import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { EtsyClient } from '@/lib/etsy/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await requireAuth();
    const { message } = await request.json();

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        shop: {
          userId: session.user.id,
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

    // Store message in database
    const orderMessage = await prisma.orderMessage.create({
      data: {
        orderId: params.orderId,
        message,
        sender: 'seller',
        sentAt: new Date(),
      },
    });

    // Send message through Etsy
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { etsyAccessToken: true },
    });

    if (user?.etsyAccessToken) {
      try {
        const etsyClient = new EtsyClient(user.etsyAccessToken);
        await etsyClient.sendOrderMessage(
          order.shop.etsyShopId,
          order.etsyOrderId,
          message
        );
      } catch (error) {
        console.error('Failed to send message through Etsy:', error);
        // Update message status to indicate Etsy sync failed
        await prisma.orderMessage.update({
          where: { id: orderMessage.id },
          data: { syncStatus: 'failed' },
        });
      }
    }

    return NextResponse.json(orderMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await requireAuth();

    // Verify order ownership
    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        shop: {
          userId: session.user.id,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get all messages for this order
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: params.orderId },
      orderBy: { sentAt: 'desc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}