'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { OverviewChart } from '@/components/analytics/overview-chart';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { TopProductsTable } from '@/components/analytics/top-products-table';
import { CustomerInsights } from '@/components/analytics/customer-insights';
import { TrafficSources } from '@/components/analytics/traffic-sources';
import { ConversionFunnel } from '@/components/analytics/conversion-funnel';
import { PerformanceMetrics } from '@/components/analytics/performance-metrics';
import { ExportReportDialog } from '@/components/analytics/export-report-dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsClientProps {
  shopId: string;
  currentPeriodStats: any;
  previousPeriodStats: any;
  salesByDay: any[];
  topProducts: any[];
  customerStats: any;
  trafficSources: any[];
}

export function AnalyticsClient({
  shopId,
  currentPeriodStats,
  previousPeriodStats,
  salesByDay,
  topProducts,
  customerStats,
  trafficSources,
}: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [compareMode, _setCompareMode] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDateChange = (date: any) => {
    if (date?.from && date?.to) {
      setDateRange({ from: date.from, to: date.to });
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger data refresh
      await fetch(`/api/analytics/refresh?shopId=${shopId}`, { method: 'POST' });
      toast.success('Analytics data refreshed');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${currentPeriodStats.revenue.toFixed(2)}`,
      change: calculateChange(currentPeriodStats.revenue, previousPeriodStats.revenue),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Orders',
      value: currentPeriodStats.orders,
      change: calculateChange(currentPeriodStats.orders, previousPeriodStats.orders),
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Customers',
      value: currentPeriodStats.customers,
      change: calculateChange(currentPeriodStats.customers, previousPeriodStats.customers),
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Page Views',
      value: currentPeriodStats.pageViews.toLocaleString(),
      change: calculateChange(currentPeriodStats.pageViews, previousPeriodStats.pageViews),
      icon: Eye,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Track your shop's performance and customer behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={handleDateChange}
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(stat.change).toFixed(1)}%
                  </span>
                  from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <PerformanceMetrics
        conversionRate={currentPeriodStats.conversionRate}
        averageOrderValue={currentPeriodStats.averageOrderValue}
        repeatCustomerRate={customerStats.repeatRate}
        cartAbandonmentRate={currentPeriodStats.cartAbandonmentRate}
      />

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Daily sales for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <OverviewChart data={salesByDay} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Visitor to customer journey</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnel
                  visitors={currentPeriodStats.uniqueVisitors}
                  cartAdds={currentPeriodStats.cartAdds}
                  checkouts={currentPeriodStats.checkouts}
                  purchases={currentPeriodStats.orders}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Revenue trends and breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={salesByDay} compareData={compareMode ? [] : undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsTable products={topProducts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerInsights
            totalCustomers={customerStats.total}
            newCustomers={customerStats.new}
            returningCustomers={customerStats.returning}
            averageLifetimeValue={customerStats.averageLifetimeValue}
            topCustomers={customerStats.topCustomers}
            customerGrowth={customerStats.growth}
          />
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <TrafficSources sources={trafficSources} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Popular Pages</CardTitle>
                <CardDescription>Most visited pages in your shop</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add popular pages component */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportReportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        shopId={shopId}
        dateRange={dateRange}
      />
    </div>
  );
}