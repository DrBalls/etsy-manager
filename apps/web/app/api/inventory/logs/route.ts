import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryLogRepository, ShopRepository } from '@/lib/repositories';

// GET /api/inventory/logs
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const inventoryItemId = searchParams.get('inventoryItemId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the shop
    const shop = await ShopRepository.findById(shopId);
    if (!shop || shop.userId !== user.id) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    let logs;
    if (inventoryItemId) {
      logs = await InventoryLogRepository.findByInventoryItemId(inventoryItemId, limit);
    } else {
      logs = await InventoryLogRepository.findByShopId(shopId, limit);
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}