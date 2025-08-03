import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryRepository, ShopRepository, OrderRepository } from '@/lib/repositories';
import { subDays, addDays } from 'date-fns';

// GET /api/inventory/forecast
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the shop
    const shop = await ShopRepository.findById(shopId);
    if (!shop || shop.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get inventory items
    const inventory = await InventoryRepository.findByShopId(shopId);
    
    // Calculate forecasts
    const forecasts = await Promise.all(
      inventory.map(async (item) => {
        // Get sales data for the last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const orders = await OrderRepository.findByListingId(item.listingId, {
          startDate: thirtyDaysAgo,
          endDate: new Date(),
        });

        // Calculate average daily sales
        const totalSold = orders.reduce((sum, order) => {
          const orderItem = order.items.find(i => i.listingId === item.listingId);
          return sum + (orderItem?.quantity || 0);
        }, 0);
        
        const averageDailySales = totalSold / 30;

        // Calculate days until stockout
        const daysUntilStockout = averageDailySales > 0 
          ? Math.floor(item.quantity / averageDailySales)
          : 999; // If no sales, set to high number

        // Calculate estimated stockout date
        const estimatedStockoutDate = addDays(new Date(), daysUntilStockout);

        // Lead time (could be configured per product, using default)
        const leadTimeDays = 7; // Default lead time

        // Calculate recommended reorder date (stockout date - lead time - buffer)
        const bufferDays = 3; // Safety buffer
        const recommendedReorderDate = subDays(estimatedStockoutDate, leadTimeDays + bufferDays);

        // Calculate recommended reorder quantity (30 days of stock)
        const recommendedReorderQuantity = Math.ceil(averageDailySales * 30);

        return {
          inventoryItemId: item.id,
          listing: {
            id: item.listing?.id || '',
            title: item.listing?.title || 'Unknown Product',
          },
          currentStock: item.quantity,
          averageDailySales,
          daysUntilStockout,
          estimatedStockoutDate,
          recommendedReorderQuantity,
          recommendedReorderDate,
          leadTimeDays,
        };
      })
    );

    // Sort by urgency (days until stockout)
    const sortedForecasts = forecasts
      .filter(f => f.averageDailySales > 0 && f.daysUntilStockout < 60)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return NextResponse.json(sortedForecasts);
  } catch (error) {
    console.error('Error generating inventory forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate inventory forecast' },
      { status: 500 }
    );
  }
}