// Etsy API v3 Types

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  skipAuth?: boolean;
  skipCache?: boolean;
  cacheTTL?: number; // seconds
  timeout?: number; // milliseconds
}

export interface ApiResponse<T = any> {
  data: T;
  count?: number;
  results?: T[];
  headers?: Record<string, string>;
}

export interface ApiError {
  error: string;
  error_description?: string;
  error_code?: string;
  status?: number;
  details?: any;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // default TTL in seconds
  maxSize?: number; // max cache entries
  ttlByEndpoint?: Record<string, number>;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface QueueConfig {
  concurrency: number;
  interval: number;
  intervalCap: number;
  carryoverConcurrencyCount?: boolean;
  autoStart?: boolean;
}

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  userAgent?: string;
  timeout?: number;
  cache?: CacheConfig;
  retry?: RetryConfig;
  queue?: QueueConfig;
  onRateLimitUpdate?: (info: RateLimitInfo) => void;
  onError?: (error: ApiError) => void;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort_on?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
  params: PaginationParams;
  type: string;
}

// Common Etsy Types
export interface Image {
  listing_image_id: number;
  hex_code?: string;
  red?: number;
  green?: number;
  blue?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  is_black_and_white?: boolean;
  creation_tsz: number;
  created_timestamp: number;
  rank: number;
  url_75x75: string;
  url_170x135: string;
  url_570xN: string;
  url_fullxfull: string;
  full_height: number;
  full_width: number;
  alt_text?: string;
}

export interface Money {
  amount: number;
  divisor: number;
  currency_code: string;
}

export interface ShippingProfile {
  shipping_profile_id: number;
  title: string;
  user_id: number;
  min_processing_days: number;
  max_processing_days: number;
  processing_days_display_label: string;
  origin_country_iso: string;
  origin_postal_code?: string;
  profile_type: 'manual' | 'calculated';
  domestic_handling_fee?: Money;
  international_handling_fee?: Money;
}

// Token provider interface for platform-specific implementations
export interface TokenProvider {
  getAccessToken(): Promise<string>;
  refreshToken?(refreshToken: string): Promise<void>;
}