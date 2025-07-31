export interface Analytics {
  id: string;
  shopId: string;
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  metrics: AnalyticsMetrics;
  breakdown?: AnalyticsBreakdown;
  createdAt: Date;
}

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface AnalyticsMetrics {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  conversionRate: number;
  views: number;
  favorites: number;
  cartAdditions: number;
  checkouts: number;
  uniqueVisitors: number;
  returningVisitors: number;
}

export interface AnalyticsBreakdown {
  byListing?: ListingMetrics[];
  byCategory?: CategoryMetrics[];
  byCountry?: CountryMetrics[];
  byDevice?: DeviceMetrics[];
  bySource?: SourceMetrics[];
}

export interface ListingMetrics {
  listingId: string;
  title: string;
  revenue: number;
  orders: number;
  views: number;
  conversionRate: number;
}

export interface CategoryMetrics {
  categoryId: number;
  categoryName: string;
  revenue: number;
  orders: number;
}

export interface CountryMetrics {
  country: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface DeviceMetrics {
  device: 'desktop' | 'mobile' | 'tablet';
  views: number;
  orders: number;
  conversionRate: number;
}

export interface SourceMetrics {
  source: 'direct' | 'search' | 'social' | 'email' | 'ads' | 'other';
  views: number;
  orders: number;
  revenue: number;
}
