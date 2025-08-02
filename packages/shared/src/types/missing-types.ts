// Missing types for SDK modules
import { type PaginationParams } from './etsy-api';
import { type Shop } from './shop';
import { type User } from './user';

// Extend interfaces that need to be exported from etsy-api-client-v2
export { ExtendedApiClientConfig } from '../api/etsy-api-client-v2';

// Customer/Conversation types
export interface Conversation {
  conversation_id: number;
  message_count: number;
  last_message_timestamp: number;
  convo_user_id: number;
  convo_username: string;
  is_read: boolean;
  has_attachments: boolean;
  listing_id?: number;
  listing_title?: string;
  listing_image_url?: string;
}

export interface ConversationMessage {
  message_id: number;
  conversation_id: number;
  sender_user_id: number;
  message: string;
  created_timestamp: number;
  is_read: boolean;
}

export interface SendMessageRequest {
  message: string;
  listing_id?: number;
}

// Inventory types
export interface ListingInventory {
  products: ListingProduct[];
  price_on_property: number[];
  quantity_on_property: number[];
  sku_on_property: number[];
}

export interface ListingProduct {
  product_id: number;
  sku?: string;
  property_values: PropertyValue[];
  offerings: ListingOffering[];
  is_deleted: boolean;
}

export interface ListingOffering {
  offering_id: number;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  is_enabled: boolean;
  is_deleted: boolean;
}

export interface PropertyValue {
  property_id: number;
  property_name?: string;
  scale_id?: number;
  value_ids: number[];
  values: string[];
}

export interface UpdateInventoryRequest {
  products: Partial<ListingProduct>[];
}

export interface UpdateVariationImagesRequest {
  variation_images: {
    property_id: number;
    value_id: number;
    image_id: number;
  }[];
}

// Order types
export interface Receipt {
  receipt_id: number;
  receipt_type: string;
  seller_user_id: number;
  seller_email?: string;
  buyer_user_id: number;
  buyer_email?: string;
  name: string;
  first_line?: string;
  second_line?: string;
  city?: string;
  state?: string;
  zip?: string;
  status: string;
  formatted_address?: string;
  country_iso?: string;
  payment_method?: string;
  payment_email?: string;
  message_from_buyer?: string;
  message_from_seller?: string;
  message_from_payment?: string;
  is_paid: boolean;
  is_shipped: boolean;
  create_timestamp: number;
  update_timestamp: number;
  gift_message?: string;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_vat_cost?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  gift_wrap_price?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipments?: Shipment[];
  transactions?: Transaction[];
}

export interface Shipment {
  receipt_shipping_id: number;
  shipment_notification_timestamp?: number;
  carrier_name?: string;
  tracking_code?: string;
}

export interface Transaction {
  transaction_id: number;
  title: string;
  description?: string;
  seller_user_id: number;
  buyer_user_id: number;
  create_timestamp: number;
  paid_timestamp?: number;
  shipped_timestamp?: number;
  quantity: number;
  listing_image_id?: number;
  receipt_id: number;
  is_digital: boolean;
  file_data?: string;
  listing_id: number;
  sku?: string;
  product_id?: number;
  transaction_type?: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipping_cost?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  variations?: Array<{
    property_id: number;
    value_id: number;
    formatted_name: string;
    formatted_value: string;
  }>;
  product_data?: any;
  shipping_profile_id?: number;
  min_processing_days?: number;
  max_processing_days?: number;
  shipping_method?: string;
  shipping_upgrade?: string;
  expected_ship_date?: number;
  buyer_coupon?: number;
  shop_coupon?: number;
}

export interface GetShopReceiptsRequest extends PaginationParams {
  was_paid?: boolean;
  was_shipped?: boolean;
  was_canceled?: boolean;
  was_delivered?: boolean;
  min_created?: number;
  max_created?: number;
}

export interface UpdateShipmentRequest {
  carrier_name?: string;
  tracking_code?: string;
  send_bcc?: boolean;
  note_to_buyer?: string;
}

export interface CreateShipmentRequest {
  carrier_name?: string;
  tracking_code?: string;
  send_bcc?: boolean;
  note_to_buyer?: string;
}

// Shop types
export interface ShopSection {
  shop_section_id: number;
  title: string;
  rank: number;
  user_id: number;
  active_listing_count: number;
}

export interface ShopPolicies {
  privacy?: string | null;
  payment?: string | null;
  shipping?: string | null;
  refunds?: string | null;
  additional?: string | null;
  seller_info?: string | null;
  updated_at?: number;
  has_private_receipt_info?: boolean;
}

export interface UpdateShopPoliciesRequest {
  privacy?: string;
  payment?: string;
  shipping?: string;
  refunds?: string;
  additional?: string;
  seller_info?: string;
}

export interface CreateShopSectionRequest {
  title: string;
}

export interface UpdateShopSectionRequest {
  title?: string;
  rank?: number;
}

export interface ListShopSectionsRequest extends PaginationParams {}

export interface ShopAnnouncement {
  sale_message?: string;
  updated_timestamp?: number;
}

export interface UpdateShopRequest {
  title?: string;
  announcement?: string;
  sale_message?: string;
  digital_sale_message?: string;
  is_vacation?: boolean;
  vacation_message?: string;
  vacation_autoreply?: string;
  policy_privacy?: string;
  policy_payment?: string;
  policy_shipping?: string;
  policy_refunds?: string;
  policy_additional?: string;
  policy_seller_info?: string;
}

// Extend Shop interface with missing properties
export interface ExtendedShop extends Shop {
  policy_privacy?: string;
  policy_payment?: string;
  policy_shipping?: string;
  policy_refunds?: string;
  policy_additional?: string;
  policy_seller_info?: string;
  policy_update_date?: number;
  policy_has_private_receipt_info?: boolean;
  sale_message?: string;
  updated_timestamp?: number;
  is_vacation?: boolean;
  vacation_message?: string;
  vacation_autoreply?: string;
}

// Extend User interface with missing properties
export interface ExtendedUser extends User {
  user_id?: number;
  create_timestamp?: number;
}

// Taxonomy types
export interface TaxonomyNode {
  id: number;
  level: number;
  name: string;
  parent_id?: number;
  path: string;
  children_ids: number[];
  full_path_taxonomy_ids: number[];
}

export interface TaxonomyNodeProperty {
  property_id: number;
  name: string;
  display_name: string;
  is_required: boolean;
  supports_attributes: boolean;
  supports_variations: boolean;
  is_multivalued: boolean;
  possible_values?: PropertyValue[];
  selected_values?: PropertyValue[];
}

export interface SellerTaxonomyNode {
  taxonomy_id: number;
  name: string;
  path: string[];
}

// Shipping profile type from etsy-api is already exported
export { ShippingProfile } from './etsy-api';
