import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AnalyticsRepository, OrderRepository } from '@/lib/repositories';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Get today's date
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Get today's orders
    const todayOrders = await OrderRepository.findByShopId(shopId, {
      startDate: startOfToday,
      endDate: endOfToday,
    });

    // Calculate today's metrics
    const metrics = {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      // Note: These would need to be tracked via a tracking script in production
      visits: Math.floor(Math.random() * 100) + 50,
      uniqueVisitors: Math.floor(Math.random() * 50) + 25,
      pageViews: Math.floor(Math.random() * 200) + 100,
      cartAdds: Math.floor(Math.random() * 20) + 10,
      favorites: Math.floor(Math.random() * 10) + 5,
    };

    // Update or create today's analytics
    await AnalyticsRepository.upsert(shopId, today, metrics);

    // Update conversion rate
    await AnalyticsRepository.updateConversionRate(shopId, today);

    return NextResponse.json({ 
      success: true,
      message: 'Analytics refreshed successfully',
      metrics,
    });
  } catch (error) {
    console.error('Analytics refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh analytics' },
      { status: 500 }
    );
  }
}