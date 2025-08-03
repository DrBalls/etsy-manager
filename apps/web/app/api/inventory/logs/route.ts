import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository } from '@/lib/repositories';

// GET /api/inventory/logs
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

    // TODO: Implement inventory logging when InventoryLog model is added to schema
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}