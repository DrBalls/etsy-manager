import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { subDays, isAfter, isBefore } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Verify shop ownership
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        userId: user.id,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const notifications = [];
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get recent orders for notifications
    const recentOrders = await prisma.order.findMany({
      where: {
        shopId,
        orderDate: {
          gte: subDays(now, 7), // Orders from last 7 days
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Check for new orders (created in last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const newOrders = recentOrders.filter(order => 
      isAfter(new Date(order.orderDate), oneHourAgo)
    );

    newOrders.forEach(order => {
      notifications.push({
        id: `new-${order.id}`,
        type: 'new_order',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          buyerName: order.buyerName,
          shipByDate: order.shipByDate,
        },
        message: `New order from ${order.buyerName}`,
        createdAt: order.orderDate,
        read: false,
      });
    });

    // Check for orders that need to ship soon
    const pendingOrders = recentOrders.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    );

    pendingOrders.forEach(order => {
      if (order.shipByDate) {
        const shipBy = new Date(order.shipByDate);
        
        // Overdue shipments
        if (isBefore(shipBy, now)) {
          notifications.push({
            id: `overdue-${order.id}`,
            type: 'overdue_shipment',
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              buyerName: order.buyerName,
              shipByDate: order.shipByDate,
            },
            message: `Order is overdue for shipment!`,
            createdAt: now,
            read: false,
          });
        }
        // Ship by soon (within 24 hours)
        else if (isBefore(shipBy, oneDayFromNow)) {
          notifications.push({
            id: `soon-${order.id}`,
            type: 'ship_by_soon',
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              buyerName: order.buyerName,
              shipByDate: order.shipByDate,
            },
            message: `Order needs to ship within 24 hours`,
            createdAt: now,
            read: false,
          });
        }
      }
    });

    // Check for unread messages
    const unreadMessages = await prisma.orderMessage.findMany({
      where: {
        order: {
          shopId,
        },
        sender: 'buyer',
        read: false,
      },
      include: {
        order: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 10,
    });

    unreadMessages.forEach(message => {
      notifications.push({
        id: `msg-${message.id}`,
        type: 'message_received',
        order: {
          id: message.order.id,
          orderNumber: message.order.orderNumber,
          buyerName: message.order.buyerName,
        },
        message: `New message from ${message.order.buyerName}`,
        createdAt: message.sentAt,
        read: false,
      });
    });

    // Sort notifications by date (newest first)
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}