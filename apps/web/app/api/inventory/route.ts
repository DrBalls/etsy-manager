import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryRepository, ShopRepository } from '@/lib/repositories';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    inventoryId: z.string(),
    quantity: z.number().int().min(0).optional(),
    lowStockAlert: z.number().int().positive().optional(),
  })),
});

// GET /api/inventory
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const lowStock = searchParams.get('lowStock') === 'true';

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

    let inventory;
    if (lowStock) {
      inventory = await InventoryRepository.getLowStockItems(shopId);
    } else {
      inventory = await InventoryRepository.findByShopId(shopId);
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory (bulk update)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await request.json();
    const { updates } = bulkUpdateSchema.parse(body);

    // Verify all items belong to user
    const inventoryIds = updates.map(u => u.inventoryId);
    const items = await InventoryRepository.findByIds(inventoryIds);
    
    for (const item of items) {
      if (item.listing?.userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to inventory item' },
          { status: 403 }
        );
      }
    }

    // Perform bulk update
    const results = await Promise.all(
      updates.map(async (update) => {
        const item = items.find(i => i.id === update.inventoryId);
        if (!item) return null;

        const { inventoryId, ...updateData } = update;

        return InventoryRepository.update(inventoryId, {
          ...updateData,
          updatedAt: new Date(),
        });
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error bulk updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}