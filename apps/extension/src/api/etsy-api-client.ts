import { 
  EtsyApiClientV2, 
  MemoryCacheProvider,
  TokenProvider,
  ExtendedApiClientConfig,
  ETSY_API_V3_BASE_URL,
  withExponentialBackoff
} from '@etsy-manager/shared';
import { etsyAuth } from '../background/auth/etsy-auth';

// Token provider that uses chrome.storage
export class ExtensionTokenProvider implements TokenProvider {
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

// API client instance (created per context)
let apiClient: EtsyApiClientV2 | null = null;

/**
 * Get or create the Etsy API client for extension
 */
export function getEtsyApiClient(config?: Partial<ExtendedApiClientConfig>): EtsyApiClientV2 {
  if (!apiClient) {
    // Use in-memory cache for extension
    const cacheProvider = new MemoryCacheProvider();

    // Create token provider
    const tokenProvider = new ExtensionTokenProvider();

    // Create API client with in-memory caching
    apiClient = new EtsyApiClientV2(
      {
        apiKey: process.env.PLASMO_PUBLIC_ETSY_CLIENT_ID!,
        cacheProvider,
        cache: {
          enabled: true,
          ttl: 300,
          maxSize: 500, // Smaller cache for extension
          ttlByEndpoint: {
            '/shops': 3600, // 1 hour for shop data
            '/users': 3600, // 1 hour for user data
            '/listings': 600, // 10 minutes for listings
            '/receipts': 300, // 5 minutes for receipts
          },
        },
        queue: {
          concurrency: 5, // Lower concurrency for extension
          interval: 1000,
          intervalCap: 5,
        },
        onRateLimitUpdate: (info) => {
          // Update badge or notification
          console.log('Rate limit updated:', info);
          
          // Could update extension badge
          if (info.remaining < 10) {
            chrome.action.setBadgeText({ text: String(info.remaining) });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
          } else {
            chrome.action.setBadgeText({ text: '' });
          }
        },
        onError: (error) => {
          console.error('API error:', error);
          
          // Show notification for critical errors
          if (error.status === 401) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '/icon-128.png',
              title: 'Etsy Authentication Error',
              message: 'Please re-authenticate with Etsy',
            });
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
 * Extension-specific API client wrapper
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
   * Upload image to Etsy (special handling for multipart in extension)
   */
  async uploadImage(
    endpoint: string,
    imageFile: File | Blob | ArrayBuffer,
    additionalData?: Record<string, any>
  ): Promise<any> {
    const accessToken = await new ExtensionTokenProvider().getAccessToken();
    
    const formData = new FormData();
    
    // Add image
    if (imageFile instanceof File || imageFile instanceof Blob) {
      formData.append('image', imageFile);
    } else {
      // ArrayBuffer
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
          'x-api-key': process.env.PLASMO_PUBLIC_ETSY_CLIENT_ID!,
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
   * Get all pages (with limit for extension)
   */
  async getAllPages<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    maxPages = 10 // Limit pages in extension context
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;
    const limit = params?.limit || 100;
    let pageCount = 0;

    while (pageCount < maxPages) {
      const response = await this.client.getPaginated<T>(
        endpoint,
        { ...params, limit, offset }
      );

      results.push(...response.results);

      if (response.results.length < limit || results.length >= response.count) {
        break;
      }

      offset += limit;
      pageCount++;
    }

    return results;
  }

  /**
   * Clear cache
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

// Message handler for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ETSY_API_REQUEST') {
    const { method, endpoint, params, data } = request;
    
    (async () => {
      try {
        let result;
        switch (method) {
          case 'GET':
            result = await etsyApi.get(endpoint, params);
            break;
          case 'POST':
            result = await etsyApi.post(endpoint, data);
            break;
          case 'PUT':
            result = await etsyApi.put(endpoint, data);
            break;
          case 'DELETE':
            result = await etsyApi.delete(endpoint);
            break;
          case 'PATCH':
            result = await etsyApi.patch(endpoint, data);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    })();
    
    return true; // Keep message channel open for async response
  }
});