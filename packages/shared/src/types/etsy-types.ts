// Etsy API specific types

// Import types we need from other files
import { ListingState as BaseListingState, Money as BaseMoney, ListingImage } from './listing';
import { Shop as BaseShop } from './shop';
import { User as BaseUser } from './user';
import { PaginationParams as BasePaginationParams } from './etsy-api';

// Re-export with specific names to avoid conflicts
export { BaseListingState as ListingState };
export { ListingImage };

// Etsy API Listing type (extends base Listing)
export interface Listing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: BaseListingState;
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp?: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  updated_timestamp: number;
  state_timestamp?: number;
  quantity: number;
  shop_section_id?: number;
  featured_rank?: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  listing_type?: string;
  tags: string[];
  materials?: string[];
  shipping_profile_id?: number;
  return_policy_id?: number;
  processing_min?: number;
  processing_max?: number;
  who_made: 'i_did' | 'collective' | 'someone_else';
  when_made: string;
  is_supply: boolean;
  item_weight?: number;
  item_weight_unit?: string;
  item_length?: number;
  item_width?: number;
  item_height?: number;
  item_dimensions_unit?: string;
  is_private: boolean;
  style?: string[];
  file_data?: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: BaseMoney;
  taxonomy_id?: number;
  production_partners?: any[];
  skus?: string[];
  views: number;
  shipping_profile?: ShippingProfile;
  images?: ListingImage[];
  videos?: ListingVideo[];
}

// Listing-specific Etsy API types
export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  quantity: number;
  state?: BaseListingState;
  who_made: 'i_did' | 'collective' | 'someone_else';
  when_made: string;
  taxonomy_id: number;
  shipping_profile_id?: number;
  materials?: string[];
  tags?: string[];
  processing_min?: number;
  processing_max?: number;
  personalization_is_required?: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  is_digital?: boolean;
  file_data?: string;
  has_variations?: boolean;
  should_auto_renew?: boolean;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  state?: BaseListingState;
  materials?: string[];
  tags?: string[];
  processing_min?: number;
  processing_max?: number;
  personalization_is_required?: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  should_auto_renew?: boolean;
}

export const ListingStateEnum = {
  ACTIVE: 'active' as BaseListingState,
  INACTIVE: 'inactive' as BaseListingState,
  SOLD_OUT: 'sold_out' as BaseListingState,
  DRAFT: 'draft' as BaseListingState,
  EXPIRED: 'expired' as BaseListingState
}

export interface ListingVideo {
  video_id: number;
  listing_id: number;
  video_state: string;
  url?: string;
  thumbnail_url?: string;
  duration?: number;
  created_timestamp: number;
  updated_timestamp: number;
}

export interface ListingTranslation {
  listing_id: number;
  language: string;
  title: string;
  description: string;
  tags: string[];
}

export interface GetListingsByShopRequest extends BasePaginationParams {
  state?: BaseListingState;
  sort_on?: 'created' | 'price' | 'updated' | 'score';
  sort_order?: 'asc' | 'desc' | 'ascending' | 'descending';
  includes?: string[];
}

export interface UploadListingImageRequest {
  image?: File | Blob;
  listing_image_id?: number;
  rank?: number;
  overwrite?: boolean;
  is_watermarked?: boolean;
  alt_text?: string;
}

export interface UploadListingVideoRequest {
  video: File | Blob;
  name?: string;
}

export interface UpdateListingImageRequest {
  rank?: number;
  overwrite?: boolean;
  is_watermarked?: boolean;
  alt_text?: string;
}

export interface CreateListingTranslationRequest {
  title: string;
  description: string;
  tags?: string[];
}

export interface UpdateListingTranslationRequest {
  title?: string;
  description?: string;
  tags?: string[];
}

// Receipt/Order types
export interface Receipt {
  receipt_id: number;
  receipt_type?: string;
  seller_user_id?: number;
  seller_email?: string;
  buyer_user_id?: number;
  buyer_email?: string;
  name: string;
  first_line: string;
  second_line?: string;
  city: string;
  state?: string;
  zip: string;
  country_iso: string;
  formatted_address?: string;
  payment_method?: string;
  payment_email?: string;
  message_from_buyer?: string;
  message_from_seller?: string;
  message_from_payment?: string;
  is_paid?: boolean;
  is_shipped?: boolean;
  create_timestamp: number;
  update_timestamp: number;
  gift_message?: string;
  grandtotal: BaseMoney;
  subtotal: BaseMoney;
  total_price: BaseMoney;
  total_shipping_cost: BaseMoney;
  total_tax_cost: BaseMoney;
  total_vat_cost: BaseMoney;
  discount_amount?: BaseMoney;
  gift_wrap_price?: BaseMoney;
  shipments?: Shipment[];
  transactions?: Transaction[];
}

export interface Shipment {
  receipt_shipping_id?: number;
  shipment_notification_timestamp?: number;
  carrier_name?: string;
  tracking_code?: string;
  tracking_url?: string;
  buyer_note?: string;
  seller_note?: string;
}

export interface Transaction {
  transaction_id: number;
  listing_id: number;
  buyer_user_id?: number;
  quantity: number;
  price: BaseMoney;
  shipping_cost?: BaseMoney;
  is_digital?: boolean;
  file_data?: string;
  listing_title?: string;
  listing_image?: ListingImage;
  product_data?: any;
  variations?: any[];
}

export interface UpdateReceiptRequest {
  was_shipped?: boolean;
  was_paid?: boolean;
  message_from_seller?: string;
  is_gift?: boolean;
  gift_message?: string;
}

// Shipping types
export interface ShippingProfile {
  shipping_profile_id: number;
  title: string;
  user_id: number;
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
  origin_country_iso: string;
  origin_postal_code?: string;
  profile_type: 'manual' | 'calculated';
  domestic_handling_fee?: number;
  international_handling_fee?: number;
}

export interface ShippingProfileDestination {
  shipping_profile_destination_id: number;
  shipping_profile_id: number;
  origin_country_iso: string;
  destination_country_iso: string;
  destination_region?: string;
  primary_cost: BaseMoney;
  secondary_cost: BaseMoney;
  shipping_carrier_id?: number;
  mail_class?: string;
  min_delivery_days?: number;
  max_delivery_days?: number;
}

export interface CreateShippingProfileRequest {
  title: string;
  origin_country_iso: string;
  primary_cost: number;
  secondary_cost: number;
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
  origin_postal_code?: string;
  shipping_carrier_id?: number;
  mail_class?: string;
  min_delivery_days?: number;
  max_delivery_days?: number;
}

export interface UpdateShippingProfileRequest {
  title?: string;
  origin_country_iso?: string;
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
  origin_postal_code?: string;
}

export interface CreateShippingDestinationRequest {
  destination_country_iso: string;
  destination_region?: string;
  primary_cost: number;
  secondary_cost: number;
  shipping_carrier_id?: number;
  mail_class?: string;
  min_delivery_days?: number;
  max_delivery_days?: number;
}

export interface UpdateShippingDestinationRequest {
  primary_cost?: number;
  secondary_cost?: number;
  shipping_carrier_id?: number;
  mail_class?: string;
  min_delivery_days?: number;
  max_delivery_days?: number;
}

// Shop types
export interface UpdateShopRequest {
  title?: string;
  announcement?: string;
  sale_message?: string;
  digital_sale_message?: string;
  is_vacation?: boolean;
  vacation_message?: string;
  vacation_autoreply?: string;
  policy_welcome?: string;
  policy_payment?: string;
  policy_shipping?: string;
  policy_refunds?: string;
  policy_additional?: string;
  policy_privacy?: string;
  policy_seller_info?: string;
  faq?: string;
}

export interface ShopSection {
  shop_section_id: number;
  title: string;
  rank: number;
  user_id: number;
  active_listing_count: number;
}

export interface CreateShopSectionRequest {
  title: string;
}

export interface UpdateShopSectionRequest {
  title?: string;
  rank?: number;
}

// Taxonomy types
export interface TaxonomyNode {
  id: number;
  level: number;
  name: string;
  parent_id?: number;
  children?: TaxonomyNode[];
  children_ids: number[];
  full_path_taxonomy_ids: number[];
}

export interface TaxonomyProperty {
  property_id: number;
  name: string;
  display_name: string;
  scales?: TaxonomyPropertyScale[];
  is_required: boolean;
  supports_attributes: boolean;
  supports_variations: boolean;
  is_multivalued: boolean;
  max_values_allowed?: number;
  possible_values?: TaxonomyPropertyValue[];
  selected_values?: TaxonomyPropertyValue[];
}

export interface TaxonomyPropertyScale {
  scale_id: number;
  display_name: string;
  description: string;
}

export interface TaxonomyPropertyValue {
  value_id?: number;
  name: string;
  scale_id?: number;
  equal_to?: number[];
}

export interface PropertyValue {
  property_id: number;
  property_name?: string;
  scale_id?: number;
  value_ids: number[];
  values: string[];
}

// User types
export interface UpdateUserRequest {
  bio?: string;
  birth_month?: number;
  birth_day?: number;
  location?: string;
  preference_locale?: string;
  region?: string;
  city?: string;
  use_new_privacy_policy?: boolean;
}

export interface LedgerEntry {
  ledger_entry_id: number;
  ledger_id: number;
  sequence_number: number;
  amount: number;
  currency: string;
  description: string;
  balance: number;
  create_date: number;
  ledger_type: string;
  reference_type?: string;
  reference_id?: string;
  payment_adjustment_id?: number;
  payment_id?: number;
  payment_adjustment_item_id?: number;
}

export interface Shop {
  shop_id: number;
  shop_name: string;
  user_id: number;
  create_date: number;
  created_timestamp: number;
  update_date: number;
  updated_timestamp: number;
  title?: string;
  announcement?: string;
  currency_code: string;
  is_vacation: boolean;
  vacation_message?: string;
  sale_message?: string;
  digital_sale_message?: string;
  listing_active_count: number;
  digital_listing_count: number;
  login_name: string;
  accepts_custom_requests: boolean;
  policy_welcome?: string;
  policy_payment?: string;
  policy_shipping?: string;
  policy_refunds?: string;
  policy_additional?: string;
  policy_seller_info?: string;
  policy_updated_timestamp?: number;
  policy_has_private_receipt_info: boolean;
  has_unstructured_policies: boolean;
  policy_privacy?: string;
  vacation_autoreply?: string;
  url: string;
  image_url_760x100?: string;
  num_favorers: number;
  languages: string[];
  icon_url_fullxfull?: string;
  is_using_structured_policies: boolean;
  has_onboarded_structured_policies: boolean;
  include_dispute_form_link: boolean;
  is_direct_checkout_onboarded: boolean;
  is_etsy_payments_onboarded: boolean;
  is_calculated_eligible: boolean;
  is_opted_in_to_buyer_promise: boolean;
  is_shop_us_based: boolean;
  transaction_sold_count: number;
  shipping_from_country_iso?: string;
  shop_location_country_iso?: string;
  review_count?: number;
  review_average?: number;
}

export interface User {
  user_id: number;
  primary_email?: string;
  first_name?: string;
  last_name?: string;
  image_url_75x75?: string;
  bio?: string;
  birth_month?: number;
  birth_day?: number;
  transaction_buy_count?: number;
  transaction_sold_count?: number;
  is_seller?: boolean;
  created_timestamp: number;
  updated_timestamp: number;
}

// Use Money from listing.ts instead of redefining

// Use PaginationParams from etsy-api.ts instead of redefining