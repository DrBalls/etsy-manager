export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeVerifier?: string;
  codeChallenge?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  scope: string;
}

export interface EtsyOAuthUrls {
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
}

export interface TokenStorage {
  save(userId: string, tokens: OAuthTokens): Promise<void>;
  get(userId: string): Promise<OAuthTokens | null>;
  delete(userId: string): Promise<void>;
  refresh(userId: string, refreshToken: string): Promise<OAuthTokens>;
}

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface AuthorizeParams {
  response_type: 'code';
  redirect_uri: string;
  scope: string;
  client_id: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface TokenRequestParams {
  grant_type: 'authorization_code' | 'refresh_token';
  client_id: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
}

export interface EtsyUser {
  user_id: number;
  login_name: string;
  primary_email: string;
  first_name: string;
  last_name: string;
  is_seller: boolean;
  image_url_75x75: string;
  bio?: string;
  birth_month?: number;
  birth_day?: number;
  transaction_buy_count: number;
  transaction_sold_count: number;
}

export interface EtsyShop {
  shop_id: number;
  shop_name: string;
  user_id: number;
  create_date: number;
  title: string;
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
  is_etsy_payments_onboarded: boolean;
  is_calculated_eligible: boolean;
  is_opted_in_to_buyer_promise: boolean;
  is_shop_us_based: boolean;
  transaction_sold_count: number;
  shipping_from_country_iso: string;
  shop_location_country_iso: string;
  review_count?: number;
  review_average?: number;
}