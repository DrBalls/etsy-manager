import { prisma } from '@/lib/prisma';
import { EtsyClient } from '@/lib/etsy/client';

export class OrderSyncService {
  static async syncShopOrders(shopId: string) {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          user: {
            select: {
              etsyAccessToken: true,
            },
          },
        },
      });

      if (!shop || !shop.user.etsyAccessToken) {
        throw new Error('Shop not found or not connected to Etsy');
      }

      const etsyClient = new EtsyClient(shop.user.etsyAccessToken);

      // Fetch recent orders from Etsy
      const etsyOrders = await etsyClient.getOrders(shop.etsyShopId, {
        limit: 100,
        was_shipped: false, // Get unshipped orders
      });

      // Process each order
      for (const etsyOrder of etsyOrders.results as any[]) {
        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
          where: {
            shopId_etsyReceiptId: {
              shopId,
              etsyReceiptId: etsyOrder.receipt_id.toString(),
            },
          },
        });

        if (!existingOrder) {
          // Create new order
          await this.createOrderFromEtsy(shop.id, etsyOrder, etsyClient);
        } else {
          // Update existing order
          await this.updateOrderFromEtsy(existingOrder.id, etsyOrder);
        }
      }

      // Update last sync time
      await prisma.shop.update({
        where: { id: shopId },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, ordersProcessed: etsyOrders.results.length };
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }

  private static async createOrderFromEtsy(shopId: string, etsyOrder: any, etsyClient: EtsyClient) {
    // Get shop with user info to get userId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { userId: true },
    });
    
    if (!shop) {
      throw new Error('Shop not found');
    }
    // Get order transactions (items)
    const transactions = await etsyClient.getOrderTransactions(
      etsyOrder.shop_id.toString(),
      etsyOrder.receipt_id.toString()
    );

    // Create order with items
    const order = await prisma.order.create({
      data: {
        shopId,
        userId: shop.userId,
        etsyReceiptId: etsyOrder.receipt_id.toString(),
        etsyOrderId: etsyOrder.receipt_id.toString(), // Keep as alias
        orderNumber: etsyOrder.receipt_id.toString(),
        status: this.mapEtsyStatus(etsyOrder.status, etsyOrder.is_shipped),
        isPaid: etsyOrder.is_paid || false,
        isShipped: etsyOrder.is_shipped || false,
        buyerName: etsyOrder.name,
        buyerEmail: etsyOrder.buyer_email || undefined,
        subtotal: parseFloat(etsyOrder.subtotal?.amount || '0') / 100,
        shipping: parseFloat(etsyOrder.total_shipping_cost?.amount || '0') / 100,
        tax: parseFloat(etsyOrder.total_tax_cost?.amount || '0') / 100,
        total: parseFloat(etsyOrder.grandtotal.amount) / 100,
        totalAmount: parseFloat(etsyOrder.grandtotal.amount) / 100,
        currencyCode: etsyOrder.grandtotal.currency_code,
        orderDate: new Date(etsyOrder.create_timestamp * 1000),
        etsyCreatedAt: new Date(etsyOrder.create_timestamp * 1000),
        shipByDate: etsyOrder.estimated_ship_date 
          ? new Date(etsyOrder.estimated_ship_date * 1000)
          : undefined,
        personalMessage: etsyOrder.message_from_buyer || undefined,
        shippingAddress: {
          create: {
            name: etsyOrder.name,
            line1: etsyOrder.first_line,
            line2: etsyOrder.second_line || undefined,
            city: etsyOrder.city,
            state: etsyOrder.state || undefined,
            postalCode: etsyOrder.zip,
            country: etsyOrder.country_iso,
          },
        },
        items: {
          create: await Promise.all(
            (transactions.results as any[]).map(async (transaction: any) => {
              // Find the listing in our database
              const listing = await prisma.listing.findFirst({
                where: {
                  etsyListingId: transaction.listing_id.toString(),
                  shopId: shopId,
                },
              });
              
              if (!listing) {
                throw new Error(`Listing not found for Etsy listing ID: ${transaction.listing_id}`);
              }
              
              return {
                etsyTransactionId: transaction.transaction_id.toString(),
                listingId: listing.id,
                title: transaction.title || 'Unknown Item',
                quantity: transaction.quantity,
                price: parseFloat(transaction.price.amount) / 100,
                variations: transaction.variations || {},
              };
            })
          ),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return order;
  }

  private static async updateOrderFromEtsy(orderId: string, etsyOrder: any) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: this.mapEtsyStatus(etsyOrder.status, etsyOrder.is_shipped),
        totalAmount: parseFloat(etsyOrder.grandtotal.amount) / 100,
        updatedAt: new Date(),
      },
    });
  }

  private static mapEtsyStatus(etsyStatus: string, isShipped: boolean): string {
    if (isShipped) {
      return 'shipped';
    }
    
    switch (etsyStatus) {
      case 'paid':
        return 'pending';
      case 'completed':
        return 'completed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  static async syncAllShops() {
    try {
      // Get all shops that need syncing
      const shops = await prisma.shop.findMany({
        where: {
          user: {
            etsyAccessToken: { not: null },
          },
          OR: [
            { lastSyncAt: null },
            {
              lastSyncAt: {
                lt: new Date(Date.now() - 5 * 60 * 1000), // Older than 5 minutes
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              etsyAccessToken: true,
            },
          },
        },
      });

      const results = [];
      for (const shop of shops) {
        try {
          const result = await this.syncShopOrders(shop.id);
          results.push({ shopId: shop.id, ...result });
        } catch (error) {
          results.push({ 
            shopId: shop.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing all shops:', error);
      throw error;
    }
  }
}