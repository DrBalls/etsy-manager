import { type ExtendedApiClientConfig, type TokenProvider } from '../../types/etsy-api';
import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { AnalyticsAPI } from './analytics';
import { CustomersAPI } from './customers';
import { InventoryAPI } from './inventory';
import { ListingsAPI } from './listings';
import { OrdersAPI } from './orders';
import { ShippingAPI } from './shipping';
import { ShopsAPI } from './shops';
import { TaxonomyAPI } from './taxonomy';
import { UserAPI } from './user';

/**
 * Main Etsy SDK class that provides access to all API modules
 */
export class EtsySDK {
  private client: EtsyApiClientV2;

  // API modules
  public readonly shops: ShopsAPI;
  public readonly listings: ListingsAPI;
  public readonly inventory: InventoryAPI;
  public readonly orders: OrdersAPI;
  public readonly customers: CustomersAPI;
  public readonly analytics: AnalyticsAPI;
  public readonly shipping: ShippingAPI;
  public readonly taxonomy: TaxonomyAPI;
  public readonly user: UserAPI;

  constructor(config: ExtendedApiClientConfig, tokenProvider: TokenProvider) {
    this.client = new EtsyApiClientV2(config, tokenProvider);

    // Initialize API modules
    this.shops = new ShopsAPI(this.client);
    this.listings = new ListingsAPI(this.client);
    this.inventory = new InventoryAPI(this.client);
    this.orders = new OrdersAPI(this.client);
    this.customers = new CustomersAPI(this.client);
    this.analytics = new AnalyticsAPI(this.client);
    this.shipping = new ShippingAPI(this.client);
    this.taxonomy = new TaxonomyAPI(this.client);
    this.user = new UserAPI(this.client);
  }

  /**
   * Get the underlying API client
   */
  getClient(): EtsyApiClientV2 {
    return this.client;
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
   * Batch operations helper
   */
  async batch<T>(
    operations: Array<() => Promise<T>>,
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    const promises = operations.map((op) => op());
    const results = await Promise.allSettled(promises);

    return results.map((result): { success: boolean; data?: T; error?: Error } => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        return { success: false, error: new Error(result.reason) };
      }
    });
  }

  /**
   * Upload file helper (for images/videos)
   */
  async uploadFile(
    endpoint: string,
    file: File | Buffer | Blob,
    additionalData?: Record<string, any>,
  ): Promise<any> {
    const formData = new FormData();

    if (file instanceof File) {
      formData.append('file', file);
    } else if (file instanceof Blob) {
      formData.append('file', file);
    } else {
      // Buffer
      formData.append('file', new Blob([file]));
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Use the client's request method with special handling for multipart
    return this.client.request(endpoint, {
      method: 'POST',
      body: formData as any,
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
    });
  }
}

// Export all API modules
export * from './shops';
export * from './listings';
export * from './inventory';
export * from './orders';
export * from './customers';
export * from './analytics';
export * from './shipping';
export * from './taxonomy';
export * from './user';

// Helper function to create SDK instance
export function createEtsySDK(
  config: ExtendedApiClientConfig,
  tokenProvider: TokenProvider,
): EtsySDK {
  return new EtsySDK(config, tokenProvider);
}
