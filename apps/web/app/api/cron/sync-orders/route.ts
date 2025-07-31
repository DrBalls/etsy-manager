import { NextRequest, NextResponse } from 'next/server';
import { OrderSyncService } from '@/lib/services/order-sync';

// This route should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// or can be manually triggered

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication header check for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting order sync for all shops...');
    
    const results = await OrderSyncService.syncAllShops();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Order sync completed: ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        details: results,
      },
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Manual sync endpoint for individual shops
export async function POST(request: NextRequest) {
  try {
    const { shopId } = await request.json();
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const result = await OrderSyncService.syncShopOrders(shopId);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync shop orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}