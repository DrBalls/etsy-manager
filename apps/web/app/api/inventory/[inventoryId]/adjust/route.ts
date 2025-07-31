import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { InventoryRepository, InventoryLogRepository } from '@/lib/repositories';
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
    const user = await requireAuth();
    const item = await InventoryRepository.findById(params.inventoryId);

    if (!item || item.listing?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { adjustment, reason } = adjustInventorySchema.parse(body);

    // Calculate new quantity
    const oldQuantity = item.quantity;
    const newQuantity = Math.max(0, oldQuantity + adjustment);
    
    // Update inventory
    const updatedItem = await InventoryRepository.update(params.inventoryId, {
      quantity: newQuantity,
      availableQuantity: newQuantity - (item.reservedQuantity || 0),
      updatedAt: new Date(),
    });

    // Create inventory log
    await InventoryLogRepository.create({
      inventoryItemId: params.inventoryId,
      listingId: item.listingId,
      userId: user.id,
      changeType: adjustment > 0 ? 'adjustment_increase' : 'adjustment_decrease',
      quantityChange: adjustment,
      previousQuantity: oldQuantity,
      newQuantity: newQuantity,
      reason: reason || 'Manual adjustment',
    });

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