import PQueue from 'p-queue';
import { 
  ApiRequestOptions, 
  ApiResponse, 
  ApiError, 
  RateLimitInfo,
  ApiClientConfig,
  TokenProvider,
  PaginatedResponse
} from '../types/etsy-api';
import { 
  ETSY_API_V3_BASE_URL, 
  ETSY_RATE_LIMITS,
  isRateLimitError,
  getRetryAfter,
  withExponentialBackoff,
  ExponentialBackoff
} from '../index';

export interface CacheEntry {
  data: any;
  expires: number;
}

export class EtsyApiClient {
  private config: Required<ApiClientConfig>;
  private tokenProvider: TokenProvider;
  private queue: PQueue;
  private cache: Map<string, CacheEntry>;
  private rateLimitInfo: RateLimitInfo = {
    limit: ETSY_RATE_LIMITS.requestsPerSecond,
    remaining: ETSY_RATE_LIMITS.requestsPerSecond,
    reset: Date.now() + 1000,
  };

  constructor(
    config: ApiClientConfig,
    tokenProvider: TokenProvider
  ) {
    // Set default config values
    this.config = {
      baseUrl: config.baseUrl || ETSY_API_V3_BASE_URL,
      apiKey: config.apiKey,
      userAgent: config.userAgent || 'Etsy-Manager/1.0',
      timeout: config.timeout || 30000,
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes default
        maxSize: 1000,
        ttlByEndpoint: {},
        ...config.cache,
      },
      retry: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        retryableStatuses: [429, 500, 502, 503, 504],
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
        ...config.retry,
      },
      queue: {
        concurrency: ETSY_RATE_LIMITS.requestsPerSecond,
        interval: 1000,
        intervalCap: ETSY_RATE_LIMITS.requestsPerSecond,
        carryoverConcurrencyCount: true,
        autoStart: true,
        ...config.queue,
      },
      onRateLimitUpdate: config.onRateLimitUpdate,
      onError: config.onError,
    };

    this.tokenProvider = tokenProvider;
    this.cache = new Map();

    // Initialize queue
    this.queue = new PQueue(this.config.queue);

    // Set up cache cleanup
    if (this.config.cache.enabled) {
      setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
    }
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      params,
      body,
      skipAuth = false,
      skipCache = false,
      cacheTTL,
      timeout = this.config.timeout,
      headers = {},
    } = options;

    // Check cache for GET requests
    if (!skipCache && method === 'GET' && this.config.cache.enabled) {
      const cached = this.getFromCache(endpoint, params);
      if (cached) {
        return { data: cached } as ApiResponse<T>;
      }
    }

    // Queue the request
    return this.queue.add(async () => {
      // Get auth token if needed
      let authHeader: Record<string, string> = {};
      if (!skipAuth) {
        try {
          const accessToken = await this.tokenProvider.getAccessToken();
          authHeader = { Authorization: `Bearer ${accessToken}` };
        } catch (error) {
          throw new Error('Failed to get access token');
        }
      }

      // Build URL with params
      const url = new URL(`${this.config.baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      // Prepare headers
      const requestHeaders = {
        'x-api-key': this.config.apiKey,
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeader,
        ...headers,
      };

      // Make request with retry logic
      const backoff = new ExponentialBackoff(this.config.retry);
      
      const response = await backoff.execute(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const res = await fetch(url.toString(), {
              method,
              headers: requestHeaders,
              body: body ? JSON.stringify(body) : undefined,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Update rate limit info from headers
            this.updateRateLimitInfo(res.headers);

            // Handle rate limiting
            if (res.status === 429) {
              const retryAfter = getRetryAfter(res.headers);
              if (retryAfter) {
                await this.sleep(retryAfter);
              }
              throw new Error('Rate limited');
            }

            // Handle errors
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              const error: ApiError = {
                error: errorData.error || 'API_ERROR',
                error_description: errorData.error_description || res.statusText,
                status: res.status,
                details: errorData,
              };

              if (this.config.onError) {
                this.config.onError(error);
              }

              throw error;
            }

            const data = await res.json();

            // Cache successful GET responses
            if (method === 'GET' && this.config.cache.enabled) {
              const ttl = cacheTTL || this.getCacheTTL(endpoint);
              this.addToCache(endpoint, params, data, ttl);
            }

            return {
              data,
              headers: Object.fromEntries(res.headers.entries()),
            };
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout');
            }
            throw error;
          }
        },
        (error: any) => {
          // Determine if error is retryable
          if (error.status && this.config.retry.retryableStatuses.includes(error.status)) {
            return true;
          }
          if (error.code && this.config.retry.retryableErrors.includes(error.code)) {
            return true;
          }
          return isRateLimitError(error);
        }
      );

      return response as ApiResponse<T>;
    });
  }

  /**
   * GET request helper
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<ApiRequestOptions, 'method' | 'params'>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'GET',
      params,
      ...options,
    });
    return response.data;
  }

  /**
   * POST request helper
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
    return response.data;
  }

  /**
   * PUT request helper
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
    return response.data;
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
    return response.data;
  }

  /**
   * PATCH request helper
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
    return response.data;
  }

  /**
   * Get paginated results
   */
  async getPaginated<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<ApiRequestOptions, 'method' | 'params'>
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, params, options);
  }

  /**
   * Get all pages of paginated results
   */
  async getAllPages<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<ApiRequestOptions, 'method' | 'params'>
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;
    const limit = params?.limit || 100;

    while (true) {
      const response = await this.getPaginated<T>(
        endpoint,
        { ...params, limit, offset },
        options
      );

      results.push(...response.results);

      if (response.results.length < limit || results.length >= response.count) {
        break;
      }

      offset += limit;
    }

    return results;
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10) * 1000, // Convert to milliseconds
      };

      if (this.config.onRateLimitUpdate) {
        this.config.onRateLimitUpdate(this.rateLimitInfo);
      }
    }
  }

  /**
   * Get cache TTL for endpoint
   */
  private getCacheTTL(endpoint: string): number {
    // Check endpoint-specific TTL
    for (const [pattern, ttl] of Object.entries(this.config.cache.ttlByEndpoint)) {
      if (endpoint.includes(pattern)) {
        return ttl;
      }
    }
    return this.config.cache.ttl;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const sortedParams = params
      ? Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(endpoint: string, params?: Record<string, any>): any {
    const key = this.getCacheKey(endpoint, params);
    const entry = this.cache.get(key);

    if (entry && entry.expires > Date.now()) {
      return entry.data;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Add to cache
   */
  private addToCache(
    endpoint: string,
    params: Record<string, any> | undefined,
    data: any,
    ttl: number
  ): void {
    // Check cache size limit
    if (this.cache.size >= this.config.cache.maxSize!) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(endpoint, params);
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      // Clear specific endpoint
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpoint)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all
      this.cache.clear();
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}