import { EtsyApiClientV2 } from '../etsy-api-client-v2';

/**
 * Analytics API SDK methods
 */
export class AnalyticsAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get shop statistics
   * Note: Etsy v3 API has limited built-in analytics
   * Most analytics need to be calculated from transaction data
   */
  async getShopStats(
    shopId: string | number,
    period: 'day' | 'week' | 'month' | 'year' | 'all',
    customRange?: { start: Date; end: Date }
  ): Promise<{
    period: string;
    revenue: { amount: number; currency: string };
    orders: number;
    items_sold: number;
    average_order_value: number;
    top_listings: Array<{ listing_id: number; title: string; sales: number }>;
  }> {
    // Calculate date range
    let startDate: Date;
    let endDate = new Date();
    
    if (customRange) {
      startDate = customRange.start;
      endDate = customRange.end;
    } else {
      startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }
    }

    // Get receipts for the period
    const receipts = await this.client.getAllPages<any>(
      `/v3/application/shops/${shopId}/receipts`,
      {
        min_created: Math.floor(startDate.getTime() / 1000),
        max_created: Math.floor(endDate.getTime() / 1000),
      }
    );

    // Calculate statistics
    let totalRevenue = 0;
    let totalItems = 0;
    let currency = '';
    const listingSales = new Map<number, { title: string; sales: number }>();

    for (const receipt of receipts) {
      totalRevenue += receipt.grandtotal?.amount || 0;
      if (!currency && receipt.grandtotal?.currency_code) {
        currency = receipt.grandtotal.currency_code;
      }

      // Get transactions for this receipt
      const transactions = await this.client.get<{ results: any[] }>(
        `/v3/application/shops/${shopId}/receipts/${receipt.receipt_id}/transactions`
      );

      for (const transaction of transactions.results) {
        totalItems += transaction.quantity;
        
        const existing = listingSales.get(transaction.listing_id) || {
          title: transaction.title,
          sales: 0,
        };
        existing.sales += transaction.quantity;
        listingSales.set(transaction.listing_id, existing);
      }
    }

    // Get top listings
    const topListings = Array.from(listingSales.entries())
      .map(([listing_id, data]) => ({
        listing_id,
        title: data.title,
        sales: data.sales,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return {
      period,
      revenue: {
        amount: totalRevenue / 100, // Convert from cents
        currency,
      },
      orders: receipts.length,
      items_sold: totalItems,
      average_order_value: receipts.length > 0 ? totalRevenue / receipts.length / 100 : 0,
      top_listings: topListings,
    };
  }

  /**
   * Get listing performance metrics
   */
  async getListingPerformance(
    listingId: string | number,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    views: number;
    favorites: number;
    sales: number;
    revenue: { amount: number; currency: string };
    conversion_rate: number;
  }> {
    // Note: Views and favorites require additional API calls
    // that may not be available in the public API
    
    // For now, we'll return sales data
    // In a real implementation, you might store view/favorite events
    
    return {
      views: 0, // Would need to be tracked separately
      favorites: 0, // Would need to be tracked separately
      sales: 0, // Would need to calculate from receipts
      revenue: { amount: 0, currency: 'USD' },
      conversion_rate: 0,
    };
  }

  /**
   * Get traffic sources
   * Note: This would typically require integration with analytics services
   */
  async getTrafficSources(
    shopId: string | number,
    period: 'day' | 'week' | 'month'
  ): Promise<{
    sources: Array<{
      source: string;
      visits: number;
      percentage: number;
    }>;
  }> {
    // Placeholder - would need external analytics integration
    return {
      sources: [
        { source: 'Direct', visits: 0, percentage: 0 },
        { source: 'Etsy Search', visits: 0, percentage: 0 },
        { source: 'External', visits: 0, percentage: 0 },
      ],
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(
    shopId: string | number,
    period: 'daily' | 'weekly' | 'monthly',
    limit = 30
  ): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
    currency: string;
  }>> {
    // This would calculate revenue grouped by period
    // For now, returning empty array
    return [];
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(
    shopId: string | number
  ): Promise<{
    total_customers: number;
    new_customers_this_month: number;
    returning_customer_rate: number;
    average_customer_lifetime_value: number;
    currency: string;
  }> {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const allReceipts = await this.client.getAllPages<any>(
      `/v3/application/shops/${shopId}/receipts`
    );

    const customers = new Set<number>();
    const customerRevenue = new Map<number, number>();
    const newCustomersThisMonth = new Set<number>();
    let currency = '';

    for (const receipt of allReceipts) {
      const buyerId = receipt.buyer_user_id;
      customers.add(buyerId);
      
      const revenue = (receipt.grandtotal?.amount || 0) / 100;
      customerRevenue.set(buyerId, (customerRevenue.get(buyerId) || 0) + revenue);
      
      if (!currency && receipt.grandtotal?.currency_code) {
        currency = receipt.grandtotal.currency_code;
      }

      // Check if new customer this month
      if (receipt.created_timestamp * 1000 >= monthAgo.getTime()) {
        // Check if this is their first purchase
        const previousPurchases = allReceipts.filter(
          r => r.buyer_user_id === buyerId && 
          r.created_timestamp < receipt.created_timestamp
        );
        if (previousPurchases.length === 0) {
          newCustomersThisMonth.add(buyerId);
        }
      }
    }

    // Calculate returning customer rate
    const customersWithMultiplePurchases = Array.from(customerRevenue.keys()).filter(
      buyerId => allReceipts.filter(r => r.buyer_user_id === buyerId).length > 1
    );

    const totalRevenue = Array.from(customerRevenue.values()).reduce((a, b) => a + b, 0);
    const avgCustomerLifetimeValue = customers.size > 0 ? totalRevenue / customers.size : 0;

    return {
      total_customers: customers.size,
      new_customers_this_month: newCustomersThisMonth.size,
      returning_customer_rate: customers.size > 0 
        ? (customersWithMultiplePurchases.length / customers.size) * 100 
        : 0,
      average_customer_lifetime_value: avgCustomerLifetimeValue,
      currency,
    };
  }
}