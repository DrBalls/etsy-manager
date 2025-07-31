export interface Shop {
  id: string;
  etsyShopId: string;
  userId: string;
  name: string;
  url: string;
  iconUrl?: string;
  bannerUrl?: string;
  currencyCode: string;
  language: string;
  location?: ShopLocation;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  settings?: ShopSettings;
  stats?: ShopStats;
}

export interface ShopLocation {
  country: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface ShopSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  inventoryTracking: boolean;
  reorderAlerts: boolean;
  defaultReorderPoint: number;
  taxRate?: number;
}

export interface ShopStats {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}
