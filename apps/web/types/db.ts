import type { 
  User, 
  Shop, 
  Listing, 
  ListingImage,
  ListingVideo,
  InventoryItem,
  Order, 
  OrderItem,
  Customer,
  ShippingProfile,
  ShopSection,
  Analytics,
  ScheduledTask,
  ActivityLog
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Shop,
  Listing,
  ListingImage,
  ListingVideo,
  InventoryItem,
  Order,
  OrderItem,
  Customer,
  ShippingProfile,
  ShopSection,
  Analytics,
  ScheduledTask,
  ActivityLog
};

// Extended types with relations
export type UserWithShops = User & {
  shops: Shop[];
};

export type ShopWithListings = Shop & {
  listings: Listing[];
};

export type ListingWithImages = Listing & {
  images: ListingImage[];
  videos: ListingVideo[];
};

export type ListingWithInventory = Listing & {
  inventoryItems: InventoryItem[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  customer: Customer | null;
};

export type OrderItemWithListing = OrderItem & {
  listing: Listing;
};

// Enums for database constants
export enum ListingState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  EXPIRED = 'expired'
}

export enum OrderStatus {
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskType {
  SYNC_LISTINGS = 'sync_listings',
  UPDATE_INVENTORY = 'update_inventory',
  PROCESS_ORDERS = 'process_orders',
  GENERATE_REPORTS = 'generate_reports'
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ActivityAction {
  // Listing actions
  LISTING_CREATED = 'listing_created',
  LISTING_UPDATED = 'listing_updated',
  LISTING_DELETED = 'listing_deleted',
  LISTING_ACTIVATED = 'listing_activated',
  LISTING_DEACTIVATED = 'listing_deactivated',
  
  // Order actions
  ORDER_RECEIVED = 'order_received',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Shop actions
  SHOP_CONNECTED = 'shop_connected',
  SHOP_DISCONNECTED = 'shop_disconnected',
  SHOP_SYNCED = 'shop_synced',
  
  // Inventory actions
  INVENTORY_UPDATED = 'inventory_updated',
  LOW_STOCK_ALERT = 'low_stock_alert'
}

// Helper types
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DateRange = {
  start: Date;
  end: Date;
};

export type MoneyAmount = {
  amount: number;
  currency: string;
};