import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryRepository } from '@/lib/repositories';
import { z } from 'zod';

const updateInventorySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().positive().optional(),
});

// GET /api/inventory/[inventoryId]
export async function GET(
  _: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const session = await requireAuth();
    const item = await InventoryRepository.findByIdWithListing(params.inventoryId);

    if (!item || item.listing?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/[inventoryId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const session = await requireAuth();
    const item = await InventoryRepository.findByIdWithListing(params.inventoryId);

    if (!item || item.listing?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);

    const updatedItem = await InventoryRepository.update(params.inventoryId, {
      ...validatedData,
      updatedAt: new Date(),
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}