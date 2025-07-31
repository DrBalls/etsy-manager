import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EtsyApiClient } from '../etsy-api-client';
import { etsyAuth } from '../../auth/etsy-auth';

// Mock dependencies
vi.mock('../../auth/etsy-auth', () => ({
  etsyAuth: {
    getValidAccessToken: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('EtsyApiClient', () => {
  let apiClient: EtsyApiClient;
  const mockUserId = 'user-123';
  const mockAccessToken = 'test-access-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    apiClient = new EtsyApiClient();
    
    // Default mock for getValidAccessToken
    (etsyAuth.getValidAccessToken as any).mockResolvedValue(mockAccessToken);
    
    // Reset environment
    process.env.ETSY_CLIENT_ID = 'test-client-id';
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
        headers: new Headers(),
      });

      const result = await apiClient.request('/test-endpoint', {
        userId: mockUserId,
        method: 'GET',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );

      const callHeaders = (fetch as any).mock.calls[0][1].headers;
      expect(callHeaders.get('Authorization')).toBe(`Bearer ${mockAccessToken}`);
      expect(callHeaders.get('x-api-key')).toBe('test-client-id');
      expect(result).toEqual(mockResponse);
    });

    it('should handle rate limiting with retry', async () => {
      // First call returns 429, second succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'retry-after': '1' }),
          json: async () => ({ error: 'rate_limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      const promise = apiClient.request('/test-endpoint', {
        userId: mockUserId,
        method: 'GET',
      });

      // Fast-forward timers
      vi.runAllTimers();

      const result = await promise;
      expect(result).toEqual({ data: 'success' });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle 401 errors and retry', async () => {
      // First call returns 401, second succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'invalid_token' }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      const result = await apiClient.request('/test-endpoint', {
        userId: mockUserId,
        method: 'GET',
      });

      expect(result).toEqual({ data: 'success' });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should skip auth when skipAuth is true', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'public' }),
        headers: new Headers(),
      });

      await apiClient.request('/public-endpoint', {
        userId: mockUserId,
        method: 'GET',
        skipAuth: true,
      });

      expect(etsyAuth.getValidAccessToken).not.toHaveBeenCalled();
      
      const callHeaders = (fetch as any).mock.calls[0][1].headers;
      expect(callHeaders.get('Authorization')).toBeNull();
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

    it('should make GET request with query params', async () => {
      await apiClient.get('/listings', mockUserId, {
        limit: 10,
        offset: 20,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/listings?limit=10&offset=20'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request with body', async () => {
      const postData = { title: 'New Listing' };
      await apiClient.post('/listings', mockUserId, postData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should make PUT request with body', async () => {
      const putData = { title: 'Updated Listing' };
      await apiClient.put('/listings/123', mockUserId, putData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
    });

    it('should make DELETE request', async () => {
      await apiClient.delete('/listings/123', mockUserId);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should make PATCH request with body', async () => {
      const patchData = { quantity: 5 };
      await apiClient.patch('/listings/123', mockUserId, patchData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });
  });

  describe('Rate limiting', () => {
    it('should enforce per-second rate limit', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });

      // Make 5 requests quickly (rate limit is 5/sec)
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          apiClient.get(`/test-${i}`, mockUserId)
        );
      }

      // The 6th request should be delayed
      vi.advanceTimersByTime(500);
      
      // Should still be waiting
      expect(fetch).toHaveBeenCalledTimes(5);

      // Advance to complete the second
      vi.advanceTimersByTime(500);

      await Promise.all(promises);
      expect(fetch).toHaveBeenCalledTimes(6);
    });

    it('should throw error when daily limit is reached', async () => {
      // Simulate that we've already made the daily limit
      const state = apiClient['rateLimitState'];
      state.requestsToday = 5000; // Daily limit

      await expect(
        apiClient.get('/test', mockUserId)
      ).rejects.toThrow('Daily API limit reached');
    });
  });

  describe('uploadImage', () => {
    it('should upload image file with form data', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const additionalData = { listing_id: '123' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ image_id: '456' }),
      });

      await apiClient.uploadImage(
        '/listings/123/images',
        mockUserId,
        mockFile,
        additionalData
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should upload buffer as blob', async () => {
      const mockBuffer = Buffer.from('test image data');
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ image_id: '789' }),
      });

      await apiClient.uploadImage(
        '/listings/123/images',
        mockUserId,
        mockBuffer
      );

      expect(fetch).toHaveBeenCalled();
      const callBody = (fetch as any).mock.calls[0][1].body;
      expect(callBody).toBeInstanceOf(FormData);
    });
  });
});