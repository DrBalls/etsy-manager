// Export all types but handle conflicts explicitly
export * from './user';
export * from './shop';
export * from './listing';
export * from './order';
export * from './analytics';
export * from './subscription';
export * from './auth';

// Export specific items from api.ts to avoid conflicts with etsy-api.ts
export {
  ApiResponse,
  ApiError,
  ResponseMetadata,
  PaginationParams,
  DateRangeParams,
  SearchParams,
  EtsyApiConfig,
  RateLimitInfo,
} from './api';

// Export everything from etsy-api.ts except conflicting types
export {
  ApiRequestOptions,
  CacheConfig,
  RetryConfig,
  QueueConfig,
  ApiClientConfig,
  PaginatedResponse,
  Image,
  // Note: ShippingProfile is exported but may conflict with etsy-types
  ShippingProfile as EtsyShippingProfile,
  TokenProvider,
  // Note: Don't export Money as it conflicts with listing.ts
  // Note: Don't export ApiError, ApiResponse, RateLimitInfo, PaginationParams as they conflict with api.ts
} from './etsy-api';

// etsy-types is imported by SDK files directly, not re-exported here to avoid conflicts

// Export all missing types needed by SDK
export * from './missing-types';
