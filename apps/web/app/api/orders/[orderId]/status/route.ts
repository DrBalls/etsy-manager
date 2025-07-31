import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { OrderRepository } from '@/lib/repositories';
import { EtsyClient } from '@/lib/etsy/client';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await requireAuth();
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        shop: {
          userId: user.id,
        },
      },
      include: {
        shop: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // If marked as shipped, sync with Etsy
    if (status === 'shipped' && order.shop.etsyAccessToken) {
      try {
        const etsyClient = new EtsyClient(order.shop.etsyAccessToken);
        await etsyClient.updateShipmentStatus(
          order.shop.etsyShopId,
          order.etsyOrderId
        );
      } catch (error) {
        console.error('Failed to sync shipment status with Etsy:', error);
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}