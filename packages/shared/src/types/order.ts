import { type Money } from './listing';

export interface Order {
  id: string;
  etsyReceiptId: string;
  shopId: string;
  buyerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  subtotal: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  discount?: Money;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  note?: string;
  giftMessage?: string;
  tracking?: TrackingInfo;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type ShippingStatus = 'not_shipped' | 'shipping' | 'shipped' | 'delivered' | 'returned';

export interface OrderItem {
  id: string;
  listingId: string;
  title: string;
  sku?: string;
  quantity: number;
  price: Money;
  variations?: Record<string, string>;
  personalization?: string;
}

export interface Address {
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}
