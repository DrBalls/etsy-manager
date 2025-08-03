import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository, AnalyticsRepository } from '@/lib/repositories';
import { AnalyticsClient } from './analytics-client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default async function AnalyticsPage() {
  const session = await requireAuth();
  
  // Get user's shops
  const shops = await ShopRepository.findByUserId(session.user.id);
  const primaryShop = shops[0];

  if (!primaryShop) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to view analytics
          </p>
          <a
            href="/dashboard/shops/connect"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Connect Shop
          </a>
        </div>
      </div>
    );
  }

  // Get date ranges
  const now = new Date();
  const thisMonth = {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
  const lastMonth = {
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  };

  // Fetch analytics data
  const [
    currentPeriodStats,
    previousPeriodStats,
    salesByDay,
    topProducts,
    customerStats,
    trafficSources,
  ] = await Promise.all([
    AnalyticsRepository.getPeriodStats(primaryShop.id, thisMonth),
    AnalyticsRepository.getPeriodStats(primaryShop.id, lastMonth),
    AnalyticsRepository.getSalesByDay(primaryShop.id, thisMonth),
    AnalyticsRepository.getTopProducts(primaryShop.id, thisMonth),
    AnalyticsRepository.getCustomerStats(primaryShop.id),
    AnalyticsRepository.getTrafficSources(primaryShop.id, thisMonth),
  ]);

  return (
    <AnalyticsClient
      shopId={primaryShop.id}
      currentPeriodStats={currentPeriodStats}
      previousPeriodStats={previousPeriodStats}
      salesByDay={salesByDay}
      topProducts={topProducts}
      customerStats={customerStats}
      trafficSources={trafficSources}
    />
  );
}