import { prisma } from '@/lib/prisma';
import type { Analytics, Prisma } from '@prisma/client';
import type { DateRange } from '@/types/db';

export class AnalyticsRepository {
  /**
   * Get analytics for a specific date
   */
  static async findByDate(
    shopId: string,
    date: Date
  ): Promise<Analytics | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.analytics.findUnique({
      where: {
        shopId_date: {
          shopId,
          date: startOfDay,
        },
      },
    });
  }

  /**
   * Get analytics for a date range
   */
  static async findByDateRange(
    shopId: string,
    dateRange: DateRange
  ): Promise<Analytics[]> {
    return prisma.analytics.findMany({
      where: {
        shopId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Create or update analytics for a date
   */
  static async upsert(
    shopId: string,
    date: Date,
    data: Omit<Prisma.AnalyticsCreateInput, 'shop' | 'date'>
  ): Promise<Analytics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.analytics.upsert({
      where: {
        shopId_date: {
          shopId,
          date: startOfDay,
        },
      },
      create: {
        ...data,
        date: startOfDay,
        shop: { connect: { id: shopId } },
      },
      update: data,
    });
  }

  /**
   * Increment analytics metrics
   */
  static async incrementMetrics(
    shopId: string,
    date: Date,
    metrics: {
      visits?: number;
      uniqueVisitors?: number;
      pageViews?: number;
      orders?: number;
      revenue?: number;
      favorites?: number;
      cartAdds?: number;
    }
  ): Promise<Analytics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Get current analytics or create with zeros
    const current = await this.findByDate(shopId, date);
    
    if (!current) {
      return this.upsert(shopId, date, metrics as any);
    }

    // Build update data
    const updateData: Prisma.AnalyticsUpdateInput = {};
    
    if (metrics.visits !== undefined) {
      updateData.visits = { increment: metrics.visits };
    }
    if (metrics.uniqueVisitors !== undefined) {
      updateData.uniqueVisitors = { increment: metrics.uniqueVisitors };
    }
    if (metrics.pageViews !== undefined) {
      updateData.pageViews = { increment: metrics.pageViews };
    }
    if (metrics.orders !== undefined) {
      updateData.orders = { increment: metrics.orders };
    }
    if (metrics.revenue !== undefined) {
      updateData.revenue = { increment: metrics.revenue };
    }
    if (metrics.favorites !== undefined) {
      updateData.favorites = { increment: metrics.favorites };
    }
    if (metrics.cartAdds !== undefined) {
      updateData.cartAdds = { increment: metrics.cartAdds };
    }

    return prisma.analytics.update({
      where: { id: current.id },
      data: updateData,
    });
  }

  /**
   * Get aggregated analytics for a period
   */
  static async getAggregatedStats(
    shopId: string,
    dateRange: DateRange
  ): Promise<{
    totalVisits: number;
    totalUniqueVisitors: number;
    totalPageViews: number;
    totalOrders: number;
    totalRevenue: number;
    totalFavorites: number;
    totalCartAdds: number;
    averageConversionRate: number;
    dailyAverages: {
      visits: number;
      orders: number;
      revenue: number;
    };
  }> {
    const analytics = await this.findByDateRange(shopId, dateRange);

    if (analytics.length === 0) {
      return {
        totalVisits: 0,
        totalUniqueVisitors: 0,
        totalPageViews: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalFavorites: 0,
        totalCartAdds: 0,
        averageConversionRate: 0,
        dailyAverages: {
          visits: 0,
          orders: 0,
          revenue: 0,
        },
      };
    }

    const totals = analytics.reduce(
      (acc, day) => ({
        visits: acc.visits + day.visits,
        uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
        pageViews: acc.pageViews + day.pageViews,
        orders: acc.orders + day.orders,
        revenue: acc.revenue + Number(day.revenue),
        favorites: acc.favorites + day.favorites,
        cartAdds: acc.cartAdds + day.cartAdds,
        conversionRateSum: acc.conversionRateSum + Number(day.conversionRate),
      }),
      {
        visits: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        orders: 0,
        revenue: 0,
        favorites: 0,
        cartAdds: 0,
        conversionRateSum: 0,
      }
    );

    const days = analytics.length;

    return {
      totalVisits: totals.visits,
      totalUniqueVisitors: totals.uniqueVisitors,
      totalPageViews: totals.pageViews,
      totalOrders: totals.orders,
      totalRevenue: totals.revenue,
      totalFavorites: totals.favorites,
      totalCartAdds: totals.cartAdds,
      averageConversionRate: totals.conversionRateSum / days,
      dailyAverages: {
        visits: totals.visits / days,
        orders: totals.orders / days,
        revenue: totals.revenue / days,
      },
    };
  }

  /**
   * Get top performing days
   */
  static async getTopPerformingDays(
    shopId: string,
    dateRange: DateRange,
    metric: 'revenue' | 'orders' | 'visits' = 'revenue',
    limit = 10
  ): Promise<Analytics[]> {
    return prisma.analytics.findMany({
      where: {
        shopId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: { [metric]: 'desc' },
      take: limit,
    });
  }

  /**
   * Calculate and update conversion rate
   */
  static async updateConversionRate(
    shopId: string,
    date: Date
  ): Promise<Analytics | null> {
    const analytics = await this.findByDate(shopId, date);
    
    if (!analytics || analytics.visits === 0) {
      return analytics;
    }

    const conversionRate = (analytics.orders / analytics.visits) * 100;

    return prisma.analytics.update({
      where: { id: analytics.id },
      data: { conversionRate },
    });
  }

  /**
   * Get period statistics
   */
  static async getPeriodStats(
    shopId: string,
    dateRange: DateRange
  ): Promise<{
    revenue: number;
    orders: number;
    customers: number;
    pageViews: number;
    conversionRate: number;
    averageOrderValue: number;
    cartAbandonmentRate: number;
    uniqueVisitors: number;
    cartAdds: number;
    checkouts: number;
  }> {
    const analytics = await this.findByDateRange(shopId, dateRange);
    
    if (analytics.length === 0) {
      return {
        revenue: 0,
        orders: 0,
        customers: 0,
        pageViews: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        cartAbandonmentRate: 0,
        uniqueVisitors: 0,
        cartAdds: 0,
        checkouts: 0,
      };
    }

    const totals = analytics.reduce(
      (acc, day) => ({
        revenue: acc.revenue + Number(day.revenue),
        orders: acc.orders + day.orders,
        pageViews: acc.pageViews + day.pageViews,
        uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
        cartAdds: acc.cartAdds + day.cartAdds,
      }),
      {
        revenue: 0,
        orders: 0,
        pageViews: 0,
        uniqueVisitors: 0,
        cartAdds: 0,
      }
    );

    // Get unique customers from orders
    const customersResult = await prisma.order.findMany({
      where: {
        shopId,
        etsyCreatedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });

    const customers = customersResult.filter(r => r.customerId).length;
    const checkouts = totals.orders; // Assuming each order is a successful checkout
    const conversionRate = totals.uniqueVisitors > 0 ? (totals.orders / totals.uniqueVisitors) * 100 : 0;
    const averageOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;
    const cartAbandonmentRate = totals.cartAdds > 0 ? ((totals.cartAdds - checkouts) / totals.cartAdds) * 100 : 0;

    return {
      revenue: totals.revenue,
      orders: totals.orders,
      customers,
      pageViews: totals.pageViews,
      conversionRate,
      averageOrderValue,
      cartAbandonmentRate: Math.max(0, cartAbandonmentRate),
      uniqueVisitors: totals.uniqueVisitors,
      cartAdds: totals.cartAdds,
      checkouts,
    };
  }

  /**
   * Get sales by day
   */
  static async getSalesByDay(
    shopId: string,
    dateRange: DateRange
  ): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }>> {
    const analytics = await this.findByDateRange(shopId, dateRange);

    return analytics.map(day => ({
      date: day.date.toISOString().split('T')[0],
      revenue: Number(day.revenue),
      orders: day.orders,
      averageOrderValue: day.orders > 0 ? Number(day.revenue) / day.orders : 0,
    }));
  }

  /**
   * Get top products
   */
  static async getTopProducts(
    shopId: string,
    dateRange: DateRange,
    limit = 10
  ): Promise<Array<{
    id: string;
    title: string;
    revenue: number;
    units: number;
    orders: number;
    imageUrl?: string;
  }>> {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          shopId,
          etsyCreatedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      },
      include: {
        listing: {
          include: {
            images: {
              take: 1,
              orderBy: { rank: 'asc' },
            },
          },
        },
      },
    });

    // Group by listing and calculate metrics
    const productMap = new Map<string, any>();

    orderItems.forEach(item => {
      const listingId = item.listingId;
      const existing = productMap.get(listingId);

      if (!existing) {
        productMap.set(listingId, {
          id: listingId,
          title: item.listing.title,
          revenue: Number(item.price) * item.quantity,
          units: item.quantity,
          orders: 1,
          imageUrl: item.listing.images[0]?.thumbnailUrl,
        });
      } else {
        existing.revenue += Number(item.price) * item.quantity;
        existing.units += item.quantity;
        existing.orders += 1;
      }
    });

    // Sort by revenue and take top N
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(
    shopId: string
  ): Promise<{
    total: number;
    new: number;
    returning: number;
    averageLifetimeValue: number;
    repeatRate: number;
    topCustomers: Array<{
      id: string;
      name: string;
      orderCount: number;
      totalSpent: number;
    }>;
    growth: Array<{
      date: string;
      newCustomers: number;
      returningCustomers: number;
    }>;
  }> {
    const customers = await prisma.customer.findMany({
      where: { shopId },
      include: {
        orders: {
          select: {
            id: true,
            etsyCreatedAt: true,
            total: true,
          },
        },
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newCustomers = customers.filter(c => 
      c.firstOrderAt && c.firstOrderAt >= thirtyDaysAgo
    ).length;

    const returningCustomers = customers.filter(c => 
      c.orderCount > 1
    ).length;

    const totalLifetimeValue = customers.reduce((sum, c) => 
      sum + Number(c.totalSpent), 0
    );

    const repeatRate = customers.length > 0 ? 
      (returningCustomers / customers.length) * 100 : 0;

    const topCustomers = customers
      .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name || 'Unknown',
        orderCount: c.orderCount,
        totalSpent: Number(c.totalSpent),
      }));

    // Calculate growth over last 30 days
    const growth: Array<{
      date: string;
      newCustomers: number;
      returningCustomers: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayNewCustomers = customers.filter(c => {
        if (!c.firstOrderAt) return false;
        const customerDateStr = c.firstOrderAt.toISOString().split('T')[0];
        return customerDateStr === dateStr;
      }).length;

      const dayReturningCustomers = customers.filter(c => {
        if (!c.lastOrderAt || c.orderCount <= 1) return false;
        const lastOrderDateStr = c.lastOrderAt.toISOString().split('T')[0];
        return lastOrderDateStr === dateStr && c.firstOrderAt!.toISOString().split('T')[0] !== dateStr;
      }).length;

      growth.push({
        date: dateStr,
        newCustomers: dayNewCustomers,
        returningCustomers: dayReturningCustomers,
      });
    }

    return {
      total: customers.length,
      new: newCustomers,
      returning: returningCustomers,
      averageLifetimeValue: customers.length > 0 ? totalLifetimeValue / customers.length : 0,
      repeatRate,
      topCustomers,
      growth,
    };
  }

  /**
   * Get traffic sources
   */
  static async getTrafficSources(
    shopId: string,
    dateRange: DateRange
  ): Promise<Array<{
    source: string;
    visits: number;
    pageViews: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  }>> {
    // For now, return mock data since we don't track traffic sources in analytics
    // In a real implementation, this would track referrers, utm parameters, etc.
    const analytics = await this.getAggregatedStats(shopId, dateRange);
    
    const sources = [
      { name: 'Direct', percentage: 0.35 },
      { name: 'Etsy Search', percentage: 0.25 },
      { name: 'Social Media', percentage: 0.20 },
      { name: 'Google', percentage: 0.15 },
      { name: 'Other', percentage: 0.05 },
    ];

    return sources.map(source => ({
      source: source.name,
      visits: Math.round(analytics.totalVisits * source.percentage),
      pageViews: Math.round(analytics.totalPageViews * source.percentage),
      orders: Math.round(analytics.totalOrders * source.percentage),
      revenue: Math.round(analytics.totalRevenue * source.percentage * 100) / 100,
      conversionRate: analytics.averageConversionRate,
    }));
  }
}