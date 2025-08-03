import Redis from 'ioredis';
import { 
  EtsyApiClientV2, 
  RedisCacheProvider,
  TokenProvider,
  ExtendedApiClientConfig,
  ETSY_API_V3_BASE_URL,
  withExponentialBackoff
} from '@etsy-manager/shared';
import { etsyAuth } from '../auth/etsy-auth';

// Token provider that uses server-side session storage
export class WebTokenProvider implements TokenProvider {
  constructor(private userId?: string) {}

  setUserId(userId: string) {
    this.userId = userId;
  }

  async getAccessToken(): Promise<string> {
    if (!this.userId) {
      throw new Error('User ID not set for token provider');
    }
    
    // Use existing etsyAuth to get valid access token
    return etsyAuth.getValidAccessToken(this.userId);
  }
}

// Create Redis client for web platform
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
  });
};

// API client instances per user
const apiClients = new Map<string, EtsyApiClientV2>();
let redisClient: Redis | null = null;

/**
 * Get or create the Etsy API client for a specific user
 */
export function getEtsyApiClient(userId: string, config?: Partial<ExtendedApiClientConfig>): EtsyApiClientV2 {
  if (!apiClients.has(userId)) {
    // Create Redis client if not exists
    if (!redisClient) {
      redisClient = createRedisClient();
    }

    // Create Redis cache provider with type assertion to handle version mismatch
    const cacheProvider = new RedisCacheProvider(redisClient as any, {
      keyPrefix: `etsy:web:${userId}:cache:`,
      defaultTTL: 300, // 5 minutes
    });

    // Create token provider for this user
    const tokenProvider = new WebTokenProvider(userId);

    // Create API client with Redis caching
    const client = new EtsyApiClientV2(
      {
        apiKey: process.env.ETSY_CLIENT_ID!,
        baseUrl: ETSY_API_V3_BASE_URL,
        cacheProvider,
        cache: {
          enabled: true,
          ttl: 300,
          maxSize: 1000,
          ttlByEndpoint: {
            '/shops': 3600, // 1 hour for shop data
            '/users': 3600, // 1 hour for user data
            '/listings': 600, // 10 minutes for listings
            '/receipts': 300, // 5 minutes for receipts
          },
        },
        onRateLimitUpdate: (info) => {
          // Could emit to a global event emitter or update UI
          console.log('Rate limit updated:', info);
        },
        onError: (error) => {
          // Could send to error tracking service
          console.error('API error:', error);
        },
        ...config,
      },
      tokenProvider
    );

    apiClients.set(userId, client);
  }

  return apiClients.get(userId)!;
}

/**
 * Clear the API client instance for a user
 */
export function clearApiClient(userId?: string): void {
  if (userId) {
    apiClients.delete(userId);
  } else {
    apiClients.clear();
  }
}

/**
 * Clear all API clients and close Redis connection
 */
export function clearAllApiClients(): void {
  apiClients.clear();
  if (redisClient) {
    redisClient.disconnect();
    redisClient = null;
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  if (!redisClient) {
    return false;
  }
  
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Legacy API client wrapper for backward compatibility
 */
export class EtsyApiClient {
  private getClient(userId: string): EtsyApiClientV2 {
    return getEtsyApiClient(userId);
  }

  async get<T = any>(
    endpoint: string,
    userId: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.getClient(userId).get<T>(endpoint, params);
  }

  async post<T = any>(
    endpoint: string,
    userId: string,
    data?: any
  ): Promise<T> {
    return this.getClient(userId).post<T>(endpoint, data);
  }

  async put<T = any>(
    endpoint: string,
    userId: string,
    data?: any
  ): Promise<T> {
    return this.getClient(userId).put<T>(endpoint, data);
  }

  async delete<T = any>(
    endpoint: string,
    userId: string
  ): Promise<T> {
    return this.getClient(userId).delete<T>(endpoint);
  }

  async patch<T = any>(
    endpoint: string,
    userId: string,
    data?: any
  ): Promise<T> {
    return this.getClient(userId).patch<T>(endpoint, data);
  }

  /**
   * Upload image to Etsy (special handling for multipart)
   */
  async uploadImage(
    endpoint: string,
    userId: string,
    imageFile: File | Buffer,
    additionalData?: Record<string, any>
  ): Promise<any> {
    const accessToken = await etsyAuth.getValidAccessToken(userId);
    
    const formData = new FormData();
    
    // Add image
    if (imageFile instanceof File) {
      formData.append('image', imageFile);
    } else {
      formData.append('image', new Blob([imageFile]));
    }

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return withExponentialBackoff(async () => {
      const response = await fetch(`${ETSY_API_V3_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': process.env.ETSY_CLIENT_ID!,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error_description || 
          errorData.message || 
          `Upload failed: ${response.status}`
        );
      }

      return response.json();
    });
  }
}

// Export singleton instance for backward compatibility
export const etsyApi = new EtsyApiClient();