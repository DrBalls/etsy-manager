import { EtsyOAuthUrls } from '../types/auth';

export const ETSY_API_V3_BASE_URL = 'https://openapi.etsy.com/v3';
export const ETSY_OAUTH_BASE_URL = 'https://www.etsy.com';

export const ETSY_OAUTH_URLS: EtsyOAuthUrls = {
  authorizationUrl: `${ETSY_OAUTH_BASE_URL}/oauth/connect`,
  tokenUrl: `${ETSY_API_V3_BASE_URL}/public/oauth/token`,
  apiBaseUrl: ETSY_API_V3_BASE_URL,
};

// Etsy OAuth 2.0 Scopes
// Reference: https://developers.etsy.com/documentation/essentials/authentication#scopes
export const ETSY_SCOPES = {
  // Read scopes
  EMAIL_R: 'email_r', // Read user email
  LISTINGS_R: 'listings_r', // Read listings
  LISTINGS_W: 'listings_w', // Create and edit listings
  LISTINGS_D: 'listings_d', // Delete listings
  TRANSACTIONS_R: 'transactions_r', // Read receipts
  TRANSACTIONS_W: 'transactions_w', // Update receipts
  BILLING_R: 'billing_r', // Read billing info
  PROFILE_R: 'profile_r', // Read user profile
  PROFILE_W: 'profile_w', // Update user profile
  ADDRESS_R: 'address_r', // Read user addresses
  ADDRESS_W: 'address_w', // Update user addresses
  FAVORITES_R: 'favorites_r', // Read favorites
  FAVORITES_W: 'favorites_w', // Update favorites
  SHOPS_R: 'shops_r', // Read shop info
  SHOPS_W: 'shops_w', // Update shop info
  CART_R: 'cart_r', // Read cart
  CART_W: 'cart_w', // Update cart
  RECOMMEND_R: 'recommend_r', // Read recommendations
  FEEDBACK_R: 'feedback_r', // Read feedback
  TREASURY_R: 'treasury_r', // Read treasuries
  TREASURY_W: 'treasury_w', // Update treasuries
  
  // Write scopes for shop management
  ACTIVITY_R: 'activity_r', // Read activity feed
  ACTIVITY_W: 'activity_w', // Update activity feed
} as const;

// Default scopes for the Etsy Store Manager app
export const DEFAULT_ETSY_SCOPES = [
  ETSY_SCOPES.EMAIL_R,
  ETSY_SCOPES.PROFILE_R,
  ETSY_SCOPES.SHOPS_R,
  ETSY_SCOPES.SHOPS_W,
  ETSY_SCOPES.LISTINGS_R,
  ETSY_SCOPES.LISTINGS_W,
  ETSY_SCOPES.LISTINGS_D,
  ETSY_SCOPES.TRANSACTIONS_R,
  ETSY_SCOPES.TRANSACTIONS_W,
  ETSY_SCOPES.BILLING_R,
  ETSY_SCOPES.FAVORITES_R,
  ETSY_SCOPES.FEEDBACK_R,
];

// Rate limit configuration (5 requests per second, 5000 per day)
export const ETSY_RATE_LIMITS = {
  requestsPerSecond: 5,
  requestsPerDay: 5000,
  retryAfter: 1000, // 1 second
  maxRetries: 3,
};

// OAuth redirect URIs for different platforms
export const ETSY_REDIRECT_URIS = {
  web: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/etsy/callback`
    : 'http://localhost:3000/api/auth/etsy/callback',
  desktop: 'http://localhost:42069/auth/callback', // Local server for desktop app
  extension: `https://${process.env.CHROME_EXTENSION_ID || 'YOUR_EXTENSION_ID'}.chromiumapp.org/`,
};

// Token expiry buffer (refresh 5 minutes before expiry)
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// PKCE configuration
export const PKCE_CODE_VERIFIER_LENGTH = 128;
export const PKCE_CODE_CHALLENGE_METHOD = 'S256';

// Error messages
export const ETSY_AUTH_ERRORS = {
  INVALID_STATE: 'Invalid state parameter. Possible CSRF attack.',
  NO_AUTH_CODE: 'No authorization code received.',
  TOKEN_EXCHANGE_FAILED: 'Failed to exchange authorization code for tokens.',
  TOKEN_REFRESH_FAILED: 'Failed to refresh access token.',
  INVALID_REDIRECT_URI: 'Invalid redirect URI.',
  MISSING_CREDENTIALS: 'Missing Etsy API credentials.',
  INVALID_SCOPE: 'Invalid or missing OAuth scope.',
  USER_DENIED: 'User denied authorization.',
  SERVER_ERROR: 'Etsy server error. Please try again later.',
} as const;