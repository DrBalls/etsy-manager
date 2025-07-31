import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EtsyApiClient } from '../etsy-api-client';
import { TokenProvider, ApiClientConfig } from '../../types/etsy-api';

// Mock fetch
global.fetch = vi.fn();

// Mock token provider
const mockTokenProvider: TokenProvider = {
  getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
};

describe('EtsyApiClient', () => {
  let client: EtsyApiClient;
  const config: ApiClientConfig = {
    baseUrl: 'https://api.test.com',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    client = new EtsyApiClient(config, mockTokenProvider);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('request', () => {
    it('should make authenticated request with proper headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
        }),
      });

      const result = await client.request('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token',
            'x-api-key': 'test-api-key',
            'User-Agent': 'Etsy-Manager/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.data).toEqual(mockResponse);
    });

    it('should skip auth when skipAuth is true', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'public' }),
        headers: new Headers(),
      });

      await client.request('/public-endpoint', { skipAuth: true });

      expect(mockTokenProvider.getAccessToken).not.toHaveBeenCalled();
      
      const callHeaders = (fetch as any).mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('should handle request parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      });

      await client.request('/test', {
        params: { limit: 10, offset: 20, tags: ['test', 'demo'] },
      });

      const callUrl = (fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('offset=20');
      expect(callUrl).toContain('tags=test');
      expect(callUrl).toContain('tags=demo');
    });

    it('should retry on retryable errors', async () => {
      // First call fails with 503, second succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ error: 'server_error' }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      const promise = client.request('/test-endpoint');

      // Fast-forward timers for retry
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result.data).toEqual({ data: 'success' });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limiting with retry after header', async () => {
      // First call returns 429 with retry-after, second succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '2' }),
          json: async () => ({ error: 'rate_limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      const promise = client.request('/test-endpoint');

      // Fast-forward timers
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result.data).toEqual({ data: 'success' });
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('caching', () => {
    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // First request
      const result1 = await client.get('/test');
      expect(result1).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const result2 = await client.get('/test');
      expect(result2).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should not cache non-GET requests', async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // POST requests
      await client.post('/test', { data: 'test' });
      await client.post('/test', { data: 'test' });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect skipCache option', async () => {
      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers(),
      });

      // First request
      await client.get('/test');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request with skipCache
      await client.get('/test', undefined, { skipCache: true });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should expire cache entries', async () => {
      const customClient = new EtsyApiClient(
        {
          ...config,
          cache: { enabled: true, ttl: 1 }, // 1 second TTL
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
      await customClient.get('/test');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      // Second request should fetch again
      await customClient.get('/test');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
    });

    it('should make GET request', async () => {
      await client.get('/listings', { limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/listings?limit=10'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request', async () => {
      const postData = { title: 'New Listing' };
      await client.post('/listings', postData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should make PUT request', async () => {
      const putData = { title: 'Updated' };
      await client.put('/listings/123', putData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
    });

    it('should make DELETE request', async () => {
      await client.delete('/listings/123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should make PATCH request', async () => {
      const patchData = { quantity: 5 };
      await client.patch('/listings/123', patchData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });
  });

  describe('pagination', () => {
    it('should get paginated results', async () => {
      const mockResponse = {
        count: 100,
        results: [{ id: 1 }, { id: 2 }],
        params: { limit: 2, offset: 0 },
        type: 'Listing',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await client.getPaginated('/listings');
      expect(result).toEqual(mockResponse);
    });

    it('should get all pages', async () => {
      // Mock three pages of results
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            count: 5,
            results: [{ id: 1 }, { id: 2 }],
            params: { limit: 2, offset: 0 },
          }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            count: 5,
            results: [{ id: 3 }, { id: 4 }],
            params: { limit: 2, offset: 2 },
          }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            count: 5,
            results: [{ id: 5 }],
            params: { limit: 2, offset: 4 },
          }),
          headers: new Headers(),
        });

      const results = await client.getAllPages('/listings', { limit: 2 });
      
      expect(results).toHaveLength(5);
      expect(results).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ]);
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('queue management', () => {
    it('should respect queue concurrency', async () => {
      const customClient = new EtsyApiClient(
        {
          ...config,
          queue: {
            concurrency: 2,
            interval: 1000,
            intervalCap: 2,
          },
        },
        mockTokenProvider
      );

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ success: true }),
                headers: new Headers(),
              });
            }, 100);
          })
      );

      // Start 5 requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        customClient.get(`/test-${i}`)
      );

      // After initial processing, only 2 should be in flight
      await vi.advanceTimersByTime(50);
      const stats = customClient.getQueueStats();
      expect(stats.pending).toBeLessThanOrEqual(2);

      // Complete all requests
      await vi.runAllTimersAsync();
      await Promise.all(promises);
    });
  });

  describe('error handling', () => {
    it('should call onError callback', async () => {
      const onError = vi.fn();
      const customClient = new EtsyApiClient(
        { ...config, onError },
        mockTokenProvider
      );

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'invalid_request',
          error_description: 'Invalid parameter',
        }),
        headers: new Headers(),
      });

      await expect(customClient.get('/test')).rejects.toThrow();
      
      expect(onError).toHaveBeenCalledWith({
        error: 'invalid_request',
        error_description: 'Invalid parameter',
        status: 400,
        details: expect.any(Object),
      });
    });

    it('should handle timeout', async () => {
      const customClient = new EtsyApiClient(
        { ...config, timeout: 100 },
        mockTokenProvider
      );

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ data: 'late' }),
                headers: new Headers(),
              });
            }, 200);
          })
      );

      const promise = customClient.get('/test');
      
      await vi.advanceTimersByTime(150);
      
      await expect(promise).rejects.toThrow('Request timeout');
    });
  });

  describe('rate limit tracking', () => {
    it('should update rate limit info from headers', async () => {
      const onRateLimitUpdate = vi.fn();
      const customClient = new EtsyApiClient(
        { ...config, onRateLimitUpdate },
        mockTokenProvider
      );

      const resetTime = Date.now() / 1000 + 3600;
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers({
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': String(resetTime),
        }),
      });

      await customClient.get('/test');

      expect(onRateLimitUpdate).toHaveBeenCalledWith({
        limit: 100,
        remaining: 99,
        reset: resetTime * 1000,
      });

      const rateLimitInfo = customClient.getRateLimitInfo();
      expect(rateLimitInfo.limit).toBe(100);
      expect(rateLimitInfo.remaining).toBe(99);
    });
  });
});