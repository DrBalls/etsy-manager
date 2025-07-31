import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { EtsyClient } from '@/lib/etsy/client';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { action, orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    // Verify ownership of all orders
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        shop: {
          userId: user.id,
        },
      },
      include: {
        shop: true,
        items: {
          include: {
            listing: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found or unauthorized' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'mark-shipped':
        await prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            status: 'shipped',
            shippedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Sync with Etsy
        for (const order of orders) {
          if (order.shop.etsyAccessToken) {
            try {
              const etsyClient = new EtsyClient(order.shop.etsyAccessToken);
              await etsyClient.updateShipmentStatus(
                order.shop.etsyShopId,
                order.etsyOrderId
              );
            } catch (error) {
              console.error(`Failed to sync order ${order.id} with Etsy:`, error);
            }
          }
        }
        break;

      case 'export':
        // Generate CSV data
        const csvHeaders = [
          'Order Number',
          'Date',
          'Customer Name',
          'Customer Email',
          'Status',
          'Total',
          'Currency',
          'Items',
          'Shipping Address',
          'Tracking Number',
        ];

        const csvRows = orders.map(order => [
          order.orderNumber,
          new Date(order.orderDate).toISOString(),
          order.buyerName,
          order.buyerEmail,
          order.status,
          order.totalAmount.toString(),
          order.currencyCode,
          order.items.map(item => `${item.quantity}x ${item.listing?.title || 'Unknown'}`).join('; '),
          order.shippingAddress ? 
            `${order.shippingAddress.line1} ${order.shippingAddress.line2 || ''} ${order.shippingAddress.city} ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode} ${order.shippingAddress.country}` :
            'No address',
          order.trackingNumber || '',
        ]);

        const csv = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });

      case 'print-labels':
        // Generate shipping labels data
        const labels = orders.map(order => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          recipient: order.shippingAddress,
          items: order.items.map(item => ({
            title: item.listing?.title || 'Unknown Product',
            quantity: item.quantity,
          })),
        }));

        return NextResponse.json({ labels });

      case 'print-slips':
        // Generate packing slips data
        const packingSlips = orders.map(order => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          customer: {
            name: order.buyerName,
            email: order.buyerEmail,
          },
          shippingAddress: order.shippingAddress,
          items: order.items.map(item => ({
            title: item.listing?.title || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            variations: item.variations,
          })),
          total: order.totalAmount,
          currency: order.currencyCode,
        }));

        return NextResponse.json({ packingSlips });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, count: orders.length });
  } catch (error) {
    console.error('Error processing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}