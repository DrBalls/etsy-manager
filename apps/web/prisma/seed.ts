import { PrismaClient } from '@prisma/client';
import { ListingState, OrderStatus } from '../types/db';
import { hashPassword } from '../lib/auth/utils';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await hashPassword('password123');
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log('Created user:', user.email);

  // Create test shop
  const shop = await prisma.shop.upsert({
    where: { etsyShopId: 'test-shop-123' },
    update: {},
    create: {
      etsyShopId: 'test-shop-123',
      userId: user.id,
      shopName: 'Test Shop',
      title: 'Test Shop - Handmade Crafts',
      announcement: 'Welcome to our test shop!',
      currencyCode: 'USD',
      url: 'https://www.etsy.com/shop/test-shop-123',
      listingActiveCount: 10,
      listingInactiveCount: 5,
      saleCount: 100,
      reviewCount: 50,
      reviewAverage: 4.5,
    },
  });

  console.log('Created shop:', shop.shopName);

  // Create test listings
  const listings = [];
  for (let i = 1; i <= 5; i++) {
    const listing = await prisma.listing.create({
      data: {
        etsyListingId: `test-listing-${i}`,
        shopId: shop.id,
        userId: user.id,
        title: `Test Product ${i}`,
        description: `This is a test product description for item ${i}`,
        state: i <= 3 ? ListingState.ACTIVE : ListingState.INACTIVE,
        url: `https://www.etsy.com/listing/test-listing-${i}`,
        price: 25.00 + i * 5,
        currencyCode: 'USD',
        quantity: 10 + i,
        tags: ['handmade', 'test', `category${i}`],
        materials: ['cotton', 'wool'],
        views: 100 * i,
        favoritersCount: 10 * i,
        etsyCreatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        etsyUpdatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
      },
    });

    // Add images
    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        etsyImageId: `test-image-${i}-1`,
        url: `https://via.placeholder.com/570x570?text=Product+${i}`,
        thumbnailUrl: `https://via.placeholder.com/170x135?text=Product+${i}`,
        rank: 0,
        width: 570,
        height: 570,
      },
    });

    // Add inventory
    await prisma.inventoryItem.create({
      data: {
        listingId: listing.id,
        productId: `product-${i}`,
        propertyValues: {},
        quantity: listing.quantity,
        price: listing.price,
        lowStockAlert: 5,
        isTracking: true,
      },
    });

    listings.push(listing);
  }

  console.log(`Created ${listings.length} listings`);

  // Create test customers
  const customers = [];
  for (let i = 1; i <= 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        shopId: shop.id,
        etsyUserId: `test-customer-${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        orderCount: i,
        totalSpent: 100 * i,
        averageOrder: 100,
        firstOrderAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastOrderAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      },
    });
    customers.push(customer);
  }

  console.log(`Created ${customers.length} customers`);

  // Create test orders
  const orders = [];
  for (let i = 1; i <= 5; i++) {
    const customerId = customers[i % customers.length].id;
    const order = await prisma.order.create({
      data: {
        etsyReceiptId: `test-receipt-${i}`,
        etsyOrderId: `test-receipt-${i}`,
        shopId: shop.id,
        userId: user.id,
        customerId,
        orderNumber: `ORDER-${1000 + i}`,
        status: i <= 3 ? 'pending' : 'shipped',
        isPaid: true,
        isShipped: i > 3,
        subtotal: 50 + i * 10,
        shipping: 5,
        tax: 5 + i,
        total: 60 + i * 10 + i,
        totalAmount: 60 + i * 10 + i,
        currencyCode: 'USD',
        buyerName: `Test Buyer ${i}`,
        buyerEmail: `buyer${i}@example.com`,
        orderDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        etsyCreatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        shippedAt: i > 3 ? new Date(Date.now() - (i - 3) * 24 * 60 * 60 * 1000) : null,
        shipByDate: new Date(Date.now() + (7 - i) * 24 * 60 * 60 * 1000),
      },
    });

    // Add order items
    const listing = listings[i % listings.length];
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        listingId: listing.id,
        etsyTransactionId: `test-transaction-${i}`,
        title: listing.title,
        quantity: 1,
        price: listing.price,
      },
    });

    orders.push(order);
  }

  console.log(`Created ${orders.length} orders`);

  // Create analytics data for the last 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.analytics.create({
      data: {
        shopId: shop.id,
        date,
        visits: Math.floor(Math.random() * 100) + 50,
        uniqueVisitors: Math.floor(Math.random() * 50) + 25,
        pageViews: Math.floor(Math.random() * 200) + 100,
        orders: Math.floor(Math.random() * 5),
        revenue: Math.floor(Math.random() * 500),
        conversionRate: Math.random() * 5,
        favorites: Math.floor(Math.random() * 10),
        cartAdds: Math.floor(Math.random() * 20),
      },
    });
  }

  console.log('Created analytics data for 30 days');

  // Create a scheduled task
  await prisma.scheduledTask.create({
    data: {
      userId: user.id,
      type: 'sync_listings',
      status: 'pending',
      schedule: '0 */6 * * *', // Every 6 hours
      config: {
        shopId: shop.id,
      },
      nextRunAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  });

  console.log('Created scheduled task');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });