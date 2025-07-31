import { 
  EtsyApiClientV2, 
  MemoryCacheProvider,
  TokenProvider,
  ExtendedApiClientConfig,
  ETSY_API_V3_BASE_URL,
  withExponentialBackoff
} from '@etsy-manager/shared';
import { etsyAuth } from '../auth/etsy-auth';

// Token provider that uses local secure storage
export class DesktopTokenProvider implements TokenProvider {
  async getAccessToken(): Promise<string> {
    const tokens = await etsyAuth.getStoredTokens();
    if (!tokens?.access_token) {
      throw new Error('No access token available');
    }
    
    // Check if token is expired and refresh if needed
    if (etsyAuth.isTokenExpired(tokens)) {
      const refreshed = await etsyAuth.refreshAccessToken();
      return refreshed.access_token;
    }
    
    return tokens.access_token;
  }
}

// Singleton instance
let apiClient: EtsyApiClientV2 | null = null;

/**
 * Get or create the Etsy API client for desktop platform
 */
export function getEtsyApiClient(config?: Partial<ExtendedApiClientConfig>): EtsyApiClientV2 {
  if (!apiClient) {
    // Use in-memory cache for desktop (no Redis dependency)
    const cacheProvider = new MemoryCacheProvider();

    // Create token provider
    const tokenProvider = new DesktopTokenProvider();

    // Create API client with in-memory caching
    apiClient = new EtsyApiClientV2(
      {
        apiKey: process.env.VITE_ETSY_CLIENT_ID!,
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
          // Could update system tray or notification
          console.log('Rate limit updated:', info);
          
          // Send to renderer process
          if (window.electronAPI?.sendRateLimitUpdate) {
            window.electronAPI.sendRateLimitUpdate(info);
          }
        },
        onError: (error) => {
          // Could show system notification
          console.error('API error:', error);
          
          // Send error to renderer process
          if (window.electronAPI?.sendApiError) {
            window.electronAPI.sendApiError(error);
          }
        },
        ...config,
      },
      tokenProvider
    );
  }

  return apiClient;
}

/**
 * Clear the API client instance
 */
export function clearApiClient(): void {
  apiClient = null;
}

/**
 * Wrapper class for convenience methods
 */
export class EtsyApiClient {
  private client: EtsyApiClientV2;

  constructor() {
    this.client = getEtsyApiClient();
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.client.get<T>(endpoint, params);
  }

  async post<T = any>(
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.client.post<T>(endpoint, data);
  }

  async put<T = any>(
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.client.put<T>(endpoint, data);
  }

  async delete<T = any>(
    endpoint: string
  ): Promise<T> {
    return this.client.delete<T>(endpoint);
  }

  async patch<T = any>(
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.client.patch<T>(endpoint, data);
  }

  /**
   * Upload image to Etsy (special handling for multipart)
   */
  async uploadImage(
    endpoint: string,
    imageFile: File | Buffer,
    additionalData?: Record<string, any>
  ): Promise<any> {
    const accessToken = await new DesktopTokenProvider().getAccessToken();
    
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
          'x-api-key': process.env.VITE_ETSY_CLIENT_ID!,
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

  /**
   * Get paginated results
   */
  async getPaginated<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<import('@etsy-manager/shared').PaginatedResponse<T>> {
    return this.client.getPaginated<T>(endpoint, params);
  }

  /**
   * Get all pages of paginated results
   */
  async getAllPages<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T[]> {
    return this.client.getAllPages<T>(endpoint, params);
  }

  /**
   * Clear cache for specific endpoint or all cache
   */
  async clearCache(endpoint?: string): Promise<void> {
    if (endpoint) {
      await this.client.invalidateCache(endpoint);
    } else {
      await this.client.clearCache();
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.client.getQueueStats();
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo() {
    return this.client.getRateLimitInfo();
  }
}

// Export singleton instance
export const etsyApi = new EtsyApiClient();