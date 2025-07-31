import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { MemoryCacheProvider, CacheProvider } from '../cache-provider';
import { TokenProvider, ExtendedApiClientConfig } from '../../types/etsy-api';

// Mock fetch
global.fetch = vi.fn();

// Mock token provider
const mockTokenProvider: TokenProvider = {
  getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
};

// Mock cache provider
class MockCacheProvider implements CacheProvider {
  private store = new Map<string, string>();
  
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.store.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.store.clear();
    } else {
      for (const key of this.store.keys()) {
        if (key.includes(pattern)) {
          this.store.delete(key);
        }
      }
    }
  }
  
  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}

describe('EtsyApiClientV2', () => {
  let client: EtsyApiClientV2;
  let mockCacheProvider: MockCacheProvider;
  
  const config: ExtendedApiClientConfig = {
    baseUrl: 'https://api.test.com',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCacheProvider = new MockCacheProvider();
    client = new EtsyApiClientV2(
      { ...config, cacheProvider: mockCacheProvider },
      mockTokenProvider
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('caching with custom cache provider', () => {
    it('should use custom cache provider for GET requests', async () => {
      const mockData = { id: 1, name: 'Test Shop' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // First request - should hit API
      const result1 = await client.get('/shops/123');
      expect(result1).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Check that data was cached
      const cachedData = await mockCacheProvider.get('/shops/123?');
      expect(cachedData).toBeTruthy();
      expect(JSON.parse(cachedData!)).toEqual(mockData);

      // Second request - should use cache
      const result2 = await client.get('/shops/123');
      expect(result2).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should invalidate cache on write operations', async () => {
      const mockData = { id: 1, name: 'Test Shop' };
      
      // Pre-populate cache
      await mockCacheProvider.set('/shops/123?', JSON.stringify(mockData));
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });

      // Perform update operation
      await client.put('/shops/123', { name: 'Updated Shop' });

      // Check that cache was invalidated
      const cachedData = await mockCacheProvider.get('/shops/123?');
      expect(cachedData).toBeNull();
    });

    it('should handle cache errors gracefully', async () => {
      // Create a cache provider that throws errors
      const errorCacheProvider: CacheProvider = {
        get: vi.fn().mockRejectedValue(new Error('Cache error')),
        set: vi.fn().mockRejectedValue(new Error('Cache error')),
        delete: vi.fn().mockRejectedValue(new Error('Cache error')),
        clear: vi.fn().mockRejectedValue(new Error('Cache error')),
        exists: vi.fn().mockRejectedValue(new Error('Cache error')),
      };

      const errorClient = new EtsyApiClientV2(
        { ...config, cacheProvider: errorCacheProvider },
        mockTokenProvider
      );

      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // Should still work despite cache errors
      const result = await errorClient.get('/test');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('memory cache provider', () => {
    it('should work with default memory cache provider', async () => {
      const memoryClient = new EtsyApiClientV2(config, mockTokenProvider);
      
      const mockData = { id: 1, name: 'Memory Test' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // First request
      const result1 = await memoryClient.get('/test');
      expect(result1).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const result2 = await memoryClient.get('/test');
      expect(result2).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle cache expiration', async () => {
      const memoryCacheProvider = new MemoryCacheProvider();
      const ttlClient = new EtsyApiClientV2(
        { 
          ...config, 
          cacheProvider: memoryCacheProvider,
          cache: { enabled: true, ttl: 1 } // 1 second TTL
        },
        mockTokenProvider
      );

      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // First request
      await ttlClient.get('/test');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      // Second request should fetch again
      await ttlClient.get('/test');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache invalidation patterns', () => {
    it('should clear cache by pattern', async () => {
      // Pre-populate cache with multiple entries
      await mockCacheProvider.set('/shops/123?', JSON.stringify({ id: 123 }));
      await mockCacheProvider.set('/shops/456?', JSON.stringify({ id: 456 }));
      await mockCacheProvider.set('/listings/789?', JSON.stringify({ id: 789 }));

      // Clear only shop-related cache
      await client.invalidateCache('/shops');

      // Check that only shop cache was cleared
      expect(await mockCacheProvider.exists('/shops/123?')).toBe(false);
      expect(await mockCacheProvider.exists('/shops/456?')).toBe(false);
      expect(await mockCacheProvider.exists('/listings/789?')).toBe(true);
    });

    it('should clear all cache when no pattern provided', async () => {
      // Pre-populate cache
      await mockCacheProvider.set('/shops/123?', JSON.stringify({ id: 123 }));
      await mockCacheProvider.set('/listings/789?', JSON.stringify({ id: 789 }));

      // Clear all cache
      await client.clearCache();

      // Check that all cache was cleared
      expect(await mockCacheProvider.exists('/shops/123?')).toBe(false);
      expect(await mockCacheProvider.exists('/listings/789?')).toBe(false);
    });
  });

  describe('endpoint-specific TTL', () => {
    it('should use endpoint-specific TTL', async () => {
      const ttlClient = new EtsyApiClientV2(
        {
          ...config,
          cacheProvider: mockCacheProvider,
          cache: {
            enabled: true,
            ttl: 60, // Default 1 minute
            ttlByEndpoint: {
              '/shops': 3600, // 1 hour for shops
              '/listings': 300, // 5 minutes for listings
            },
          },
        },
        mockTokenProvider
      );

      const setCacheSpy = vi.spyOn(mockCacheProvider, 'set');
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      });

      // Request to /shops endpoint
      await ttlClient.get('/shops/123');
      expect(setCacheSpy).toHaveBeenCalledWith(
        '/shops/123?',
        expect.any(String),
        3600 // Should use shop-specific TTL
      );

      // Request to /listings endpoint
      await ttlClient.get('/listings/456');
      expect(setCacheSpy).toHaveBeenCalledWith(
        '/listings/456?',
        expect.any(String),
        300 // Should use listing-specific TTL
      );

      // Request to other endpoint
      await ttlClient.get('/users/789');
      expect(setCacheSpy).toHaveBeenCalledWith(
        '/users/789?',
        expect.any(String),
        60 // Should use default TTL
      );
    });
  });
});