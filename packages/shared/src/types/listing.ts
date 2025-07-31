export interface Listing {
  id: string;
  etsyListingId: string;
  shopId: string;
  title: string;
  description: string;
  state: ListingState;
  price: Money;
  quantity: number;
  sku?: string;
  tags: string[];
  materials?: string[];
  images: ListingImage[];
  categoryId?: number;
  sectionId?: string;
  processingMin?: number;
  processingMax?: number;
  shippingProfileId?: string;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt?: Date;
  seoScore?: number;
  analytics?: ListingAnalytics;
}

export type ListingState = 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';

export interface Money {
  amount: number;
  currency: string;
  formatted: string;
}

export interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  rank: number;
  width: number;
  height: number;
}

export interface ListingAnalytics {
  conversionRate: number;
  clickThroughRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
  revenuePerView: number;
}
