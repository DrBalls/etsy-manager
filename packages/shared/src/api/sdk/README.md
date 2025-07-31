# Etsy SDK Usage Guide

The Etsy SDK provides a comprehensive, type-safe interface for interacting with the Etsy API v3. It includes built-in rate limiting, caching, and error handling.

## Installation

```typescript
import { EtsySDK, createEtsySDK } from '@etsy-manager/shared';
```

## Initialization

### Web Application (Next.js)

```typescript
import { EtsySDK } from '@etsy-manager/shared';
import { createRedisClient } from '@/lib/redis';

const sdk = new EtsySDK(
  {
    clientId: process.env.ETSY_CLIENT_ID!,
    redirectUri: process.env.ETSY_REDIRECT_URI!,
    rateLimitPerMinute: 10,
    maxRetries: 3,
    cacheProvider: new RedisCacheProvider(createRedisClient()),
  },
  async (userId?: string) => {
    // Your token provider implementation
    const session = await getSession();
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    };
  }
);
```

### Desktop Application (Electron)

```typescript
import { EtsySDK } from '@etsy-manager/shared';

const sdk = new EtsySDK(
  {
    clientId: process.env.ETSY_CLIENT_ID!,
    redirectUri: 'etsy-manager://oauth/callback',
    rateLimitPerMinute: 10,
    maxRetries: 3,
    // Uses in-memory cache by default
  },
  tokenProvider
);
```

## Shop Management

### Get Shop Information

```typescript
// Get authenticated user's shops
const myShops = await sdk.user.getMyShops();

// Get specific shop details
const shop = await sdk.shops.getShop(shopId);
console.log('Shop name:', shop.shop_name);
console.log('Currency:', shop.currency_code);

// Update shop
await sdk.shops.updateShop(shopId, {
  title: 'My Updated Shop Title',
  announcement: 'Welcome to our summer sale!',
});
```

### Manage Shop Sections

```typescript
// Get all sections
const sections = await sdk.shops.getShopSections(shopId);

// Create a new section
const newSection = await sdk.shops.createShopSection(shopId, {
  title: 'Summer Collection',
});

// Reorder sections
await sdk.shops.reorderShopSections(shopId, [
  section1.shop_section_id,
  section2.shop_section_id,
  section3.shop_section_id,
]);
```

## Listing Management

### Create and Manage Listings

```typescript
// Create a new listing
const listing = await sdk.listings.createListing(shopId, {
  title: 'Handmade Ceramic Mug',
  description: 'Beautiful handcrafted ceramic mug...',
  price: 25.00,
  quantity: 10,
  taxonomy_id: 1234,
  who_made: 'i_did',
  when_made: 'made_to_order',
  shipping_profile_id: shippingProfileId,
});

// Update listing
await sdk.listings.updateListing(listing.listing_id, {
  title: 'Updated Title',
  price: 30.00,
});

// Upload images
const imageFile = new File([imageBuffer], 'product.jpg', { 
  type: 'image/jpeg' 
});
await sdk.listings.uploadListingImage(
  shopId, 
  listing.listing_id, 
  imageFile
);
```

### Search and Filter Listings

```typescript
// Search listings
const searchResults = await sdk.listings.searchListings({
  keywords: 'ceramic mug',
  min_price: 20,
  max_price: 50,
  limit: 25,
});

// Get active listings
const activeListings = await sdk.listings.getActiveListings(shopId);

// Get draft listings
const drafts = await sdk.listings.getDraftListings(shopId);
```

## Inventory Management

### Track Inventory

```typescript
// Get inventory for a listing
const inventory = await sdk.inventory.getListingInventory(listingId);

// Update inventory
await sdk.inventory.updateListingInventory(listingId, {
  products: inventory.products.map(product => ({
    ...product,
    offerings: product.offerings.map(offering => ({
      ...offering,
      quantity: offering.quantity - 1, // Decrease by 1
    })),
  })),
});

// Get low stock items
const lowStock = await sdk.inventory.getLowStockProducts(
  listingId, 
  5 // threshold
);

// Calculate inventory value
const value = await sdk.inventory.getInventoryValue(listingId);
console.log('Total value:', value.total_value);
```

## Order Processing

### Manage Orders

```typescript
// Get unshipped orders
const unshippedOrders = await sdk.orders.getReceiptsByStatus(
  shopId, 
  'unshipped'
);

// Get order details with transactions
const receipt = await sdk.orders.getReceipt(shopId, receiptId);
const transactions = await sdk.orders.getReceiptTransactions(
  shopId, 
  receiptId
);

// Mark as shipped with tracking
await sdk.orders.createShipment(shopId, receiptId, {
  tracking_code: '1Z999AA10123456784',
  carrier_name: 'ups',
  send_bcc: true,
});

// Batch mark as shipped
const results = await sdk.orders.batchMarkAsShipped(
  shopId, 
  [receiptId1, receiptId2, receiptId3]
);
```

## Customer Management

### Customer Analytics

```typescript
// Get customer purchase history
const history = await sdk.customers.getCustomerPurchaseHistory(
  shopId, 
  buyerUserId
);

// Find repeat customers
const repeatCustomers = await sdk.customers.getRepeatCustomers(
  shopId, 
  2 // minimum purchases
);

// Customer segments
const segments = await sdk.customers.getCustomerSegments(shopId);
console.log('VIP customers:', segments.vip_customers);
console.log('Dormant customers:', segments.dormant_customers);
```

### Customer Communication

```typescript
// Get conversations (requires special permissions)
const conversations = await sdk.customers.getConversations(shopId);

// Send message
await sdk.customers.sendMessage(
  shopId, 
  conversationId, 
  'Thank you for your order!'
);
```

## Analytics and Reporting

### Shop Statistics

```typescript
// Get shop stats for last month
const stats = await sdk.analytics.getShopStats(shopId, 'month');
console.log('Revenue:', stats.revenue);
console.log('Orders:', stats.orders);
console.log('Top products:', stats.top_listings);

// Get revenue trends
const trends = await sdk.analytics.getRevenueTrends(
  shopId, 
  'daily', 
  30 // last 30 days
);

// Customer analytics
const customerStats = await sdk.analytics.getCustomerAnalytics(shopId);
console.log('Lifetime value:', customerStats.average_customer_lifetime_value);
```

## Shipping Configuration

### Manage Shipping Profiles

```typescript
// Get shipping profiles
const profiles = await sdk.shipping.getShippingProfiles(shopId);

// Create shipping profile
const profile = await sdk.shipping.createShippingProfile(shopId, {
  title: 'Standard Shipping',
  origin_country_iso: 'US',
  primary_cost: 5.00,
  secondary_cost: 2.00,
  min_processing_time: 1,
  max_processing_time: 3,
});

// Bulk assign to listings
await sdk.shipping.bulkAssignShippingProfile(
  shopId,
  profile.shipping_profile_id,
  [listingId1, listingId2, listingId3]
);
```

## Taxonomy and Categories

### Category Management

```typescript
// Get seller taxonomy nodes
const categories = await sdk.taxonomy.getSellerTaxonomyNodes();

// Search categories
const suggestions = await sdk.taxonomy.getSuggestedCategories(
  'handmade ceramic mug',
  ['pottery', 'kitchen']
);

// Validate listing properties
const validation = await sdk.taxonomy.validateListingProperties(
  taxonomyId,
  [
    { property_id: 123, value_ids: [456] },
    { property_id: 789, value_ids: [101112] },
  ]
);

if (!validation.valid) {
  console.log('Missing required:', validation.missing_required);
  console.log('Invalid:', validation.invalid_properties);
}
```

## Advanced Features

### Batch Operations

```typescript
// Batch multiple operations
const results = await sdk.batch([
  () => sdk.listings.getListing(listingId1),
  () => sdk.listings.getListing(listingId2),
  () => sdk.listings.getListing(listingId3),
]);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Listing ${index + 1}:`, result.data.title);
  } else {
    console.error(`Failed to get listing ${index + 1}:`, result.error);
  }
});
```

### Cache Management

```typescript
// Clear all cache
await sdk.clearCache();

// Clear specific endpoint cache
await sdk.clearCache('/v3/application/shops/123456/listings/active');

// Get cache stats (if using Redis)
const client = sdk.getClient();
if (client.cacheProvider instanceof RedisCacheProvider) {
  const stats = await client.cacheProvider.getStats();
  console.log('Cache hit rate:', stats.hitRate);
}
```

### Rate Limiting Info

```typescript
// Get current rate limit status
const rateLimit = sdk.getRateLimitInfo();
console.log('Remaining:', rateLimit.remaining);
console.log('Reset at:', new Date(rateLimit.resetTime));

// Get queue statistics
const queueStats = sdk.getQueueStats();
console.log('Pending requests:', queueStats.pending);
console.log('Active requests:', queueStats.size);
```

## Error Handling

```typescript
import { EtsyApiError } from '@etsy-manager/shared';

try {
  await sdk.listings.getListing(invalidId);
} catch (error) {
  if (error instanceof EtsyApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Request ID:', error.requestId);
    
    if (error.statusCode === 429) {
      console.log('Rate limited, retry after:', error.retryAfter);
    }
  }
}
```

## Platform-Specific Usage

### Next.js API Routes

```typescript
// pages/api/shops/[shopId]/stats.ts
import { createEtsySDK } from '@etsy-manager/shared';
import { getServerSession } from 'next-auth';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  const sdk = createEtsySDK(
    config,
    async () => ({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    })
  );
  
  const stats = await sdk.analytics.getShopStats(
    req.query.shopId,
    'month'
  );
  
  res.json(stats);
}
```

### Electron Main Process

```typescript
// main/api/etsy.ts
import { EtsySDK } from '@etsy-manager/shared';
import { store } from '../store';

ipcMain.handle('etsy:getShop', async (event, shopId) => {
  const sdk = new EtsySDK(config, async () => {
    const tokens = store.get('tokens');
    return tokens;
  });
  
  return sdk.shops.getShop(shopId);
});
```

### Chrome Extension Background Script

```typescript
// background.js
import { EtsySDK } from '@etsy-manager/shared';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getListings') {
    const sdk = new EtsySDK(config, tokenProvider);
    
    sdk.listings.getActiveListings(request.shopId)
      .then(listings => sendResponse({ success: true, listings }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep channel open for async response
  }
});
```

## Best Practices

1. **Token Management**: Always implement proper token refresh logic in your token provider
2. **Error Handling**: Wrap SDK calls in try-catch blocks to handle API errors gracefully
3. **Caching**: Use Redis cache in production for better performance across instances
4. **Rate Limiting**: Monitor rate limit status and implement backoff strategies
5. **Batch Operations**: Use batch methods when performing multiple operations
6. **Type Safety**: Leverage TypeScript types for better development experience

## Common Patterns

### Pagination

```typescript
// Manual pagination
let offset = 0;
const limit = 100;
const allListings = [];

while (true) {
  const page = await sdk.listings.getActiveListings(shopId, {
    limit,
    offset,
  });
  
  allListings.push(...page.results);
  
  if (page.results.length < limit) break;
  offset += limit;
}

// Or use getAllPages helper
const allReceipts = await sdk.getClient().getAllPages(
  `/v3/application/shops/${shopId}/receipts`
);
```

### Webhook Integration

```typescript
// Process webhook events
app.post('/webhooks/etsy', async (req, res) => {
  const { event_type, data } = req.body;
  
  switch (event_type) {
    case 'order_created':
      const receipt = await sdk.orders.getReceipt(
        data.shop_id,
        data.receipt_id
      );
      // Process new order
      break;
      
    case 'listing_updated':
      await sdk.clearCache(
        `/v3/application/listings/${data.listing_id}`
      );
      break;
  }
  
  res.status(200).end();
});
```