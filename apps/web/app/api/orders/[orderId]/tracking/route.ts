import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { EtsyClient } from '@/lib/etsy/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await requireAuth();
    const { trackingNumber, trackingCarrier, status } = await request.json();

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

    // Update order with tracking info
    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        trackingNumber,
        trackingCarrier,
        status: status || 'shipped',
        shippedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Sync tracking with Etsy
    if (order.shop.etsyAccessToken) {
      try {
        const etsyClient = new EtsyClient(order.shop.etsyAccessToken);
        await etsyClient.addTrackingNumber(
          order.shop.etsyShopId,
          order.etsyOrderId,
          trackingNumber,
          trackingCarrier
        );
      } catch (error) {
        console.error('Failed to sync tracking with Etsy:', error);
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating tracking information:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking information' },
      { status: 500 }
    );
  }
}