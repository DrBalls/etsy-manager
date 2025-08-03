import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryRepository } from '@/lib/repositories';
import { z } from 'zod';

const adjustInventorySchema = z.object({
  adjustment: z.number().int(),
  reason: z.string().optional(),
});

// POST /api/inventory/[inventoryId]/adjust
export async function POST(
  request: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const session = await requireAuth();
    const item = await InventoryRepository.findByIdWithListing(params.inventoryId);

    if (!item || item.listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { adjustment } = adjustInventorySchema.parse(body);

    // Calculate new quantity
    const oldQuantity = item.quantity;
    const newQuantity = Math.max(0, oldQuantity + adjustment);
    
    // Update inventory
    const updatedItem = await InventoryRepository.updateQuantity(
      params.inventoryId,
      newQuantity
    );

    // TODO: Implement inventory logging when InventoryLog model is added to schema
    // await InventoryLogRepository.create({
    //   inventoryId: params.inventoryId,
    //   type: 'ADJUSTMENT',
    //   quantityBefore: oldQuantity,
    //   quantityAfter: newQuantity,
    //   adjustment: adjustment,
    //   userId: session.user.id,
    //   reason: reason || 'Manual adjustment',
    // });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}