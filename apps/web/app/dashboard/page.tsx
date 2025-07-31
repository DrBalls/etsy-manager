import { requireAuth } from '@/lib/auth/utils';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { ShopRepository } from '@/lib/repositories';
import { OrderRepository } from '@/lib/repositories';
import { ListingRepository } from '@/lib/repositories';
import { AnalyticsRepository } from '@/lib/repositories';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch user's shops
  const shops = await ShopRepository.findByUserId(user.id);
  const primaryShop = shops[0];

  // If no shop is connected yet
  if (!primaryShop) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}!
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Shop Connected</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to start managing your business
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

  // Fetch dashboard data
  const [recentOrders, activeListings, analytics, recentActivities] = await Promise.all([
    OrderRepository.findByShopId(primaryShop.id, { limit: 5 }),
    ListingRepository.findByShopId(primaryShop.id, { state: 'ACTIVE' }),
    AnalyticsRepository.getShopAnalytics(primaryShop.id, 30),
    getRecentActivities(user.id, primaryShop.id),
  ]);

  // Calculate stats
  const totalRevenue = analytics.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = analytics.reduce((sum, day) => sum + day.orders, 0);
  const totalViews = analytics.reduce((sum, day) => sum + day.pageViews, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Prepare chart data
  const chartData = analytics.slice(-14).map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: day.revenue,
    orders: day.orders,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {primaryShop.shopName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          description="Last 30 days"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          description="Last 30 days"
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Active Listings"
          value={activeListings.length}
          description={`${primaryShop.listingActiveCount} total`}
          icon={Package}
        />
        <StatsCard
          title="Page Views"
          value={totalViews.toLocaleString()}
          description="Last 30 days"
          icon={Eye}
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <OverviewChart data={chartData} />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Average Order Value"
          value={`$${averageOrderValue.toFixed(2)}`}
          description="Per transaction"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Customers"
          value={primaryShop.saleCount}
          description="All time"
          icon={Users}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${((totalOrders / totalViews) * 100).toFixed(2)}%`}
          description="Orders / Views"
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}

async function getRecentActivities(userId: string, shopId: string) {
  // In a real app, this would fetch from an activity log table
  // For now, we'll create some mock data
  const orders = await OrderRepository.findByShopId(shopId, { limit: 3 });
  
  return orders.map((order) => ({
    id: order.id,
    type: 'order' as const,
    title: `New order #${order.orderNumber}`,
    description: `${order.orderItems.length} items - $${order.total.toFixed(2)}`,
    timestamp: order.createdAt,
  }));
}