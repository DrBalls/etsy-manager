import { prisma } from '@/lib/prisma';
import type { Order, Prisma } from '@prisma/client';
import type { OrderWithItems, PaginatedResponse, DateRange } from '@/types/db';
import { OrderStatus } from '@/types/db';

export class OrderRepository {
  /**
   * Find an order by ID
   */
  static async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
    });
  }

  /**
   * Find an order by Etsy receipt ID
   */
  static async findByEtsyReceiptId(
    etsyReceiptId: string
  ): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { etsyReceiptId },
    });
  }

  /**
   * Get order with items and customer
   */
  static async findWithItems(id: string): Promise<OrderWithItems | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { listing: true },
        },
        customer: true,
      },
    });
  }

  /**
   * Find orders by shop ID (simple version for the orders page)
   */
  static async findByShopId(shopId: string, options?: { limit?: number }) {
    return prisma.order.findMany({
      where: { shopId },
      include: {
        items: {
          include: {
            listing: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
      take: options?.limit,
    });
  }

  /**
   * Get paginated orders for a shop
   */
  static async findByShop(
    shopId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: OrderStatus;
      dateRange?: DateRange;
      search?: string;
      orderBy?: 'createdAt' | 'etsyCreatedAt' | 'total';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<Order>> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {
      shopId,
      ...(options.status && { status: options.status }),
      ...(options.dateRange && {
        etsyCreatedAt: {
          gte: options.dateRange.start,
          lte: options.dateRange.end,
        },
      }),
      ...(options.search && {
        OR: [
          { orderNumber: { contains: options.search, mode: 'insensitive' } },
          { buyerEmail: { contains: options.search, mode: 'insensitive' } },
          { trackingNumber: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = {
      [options.orderBy || 'etsyCreatedAt']: options.order || 'desc',
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          items: true,
          customer: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get orders by status
   */
  static async findByStatus(
    shopId: string,
    status: OrderStatus
  ): Promise<Order[]> {
    return prisma.order.findMany({
      where: { shopId, status },
      orderBy: { etsyCreatedAt: 'desc' },
    });
  }

  /**
   * Get unshipped orders
   */
  static async getUnshippedOrders(shopId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        shopId,
        isShipped: false,
        status: { not: OrderStatus.CANCELLED },
      },
      orderBy: { etsyCreatedAt: 'asc' },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  /**
   * Create a new order
   */
  static async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({ data });
  }

  /**
   * Update an order
   */
  static async update(
    id: string,
    data: Prisma.OrderUpdateInput
  ): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
    });
  }

  /**
   * Mark order as shipped
   */
  static async markAsShipped(
    id: string,
    shippingData: {
      shippingCarrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    }
  ): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        isShipped: true,
        shippedAt: new Date(),
        status: OrderStatus.SHIPPED,
        ...shippingData,
      },
    });
  }

  /**
   * Get order statistics for a shop
   */
  static async getOrderStats(
    shopId: string,
    dateRange?: DateRange
  ): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }> {
    const where: Prisma.OrderWhereInput = {
      shopId,
      ...(dateRange && {
        orderDate: {
          gte: dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: dateRange?.end || new Date(),
        },
      }),
    };

    const [totalOrders, statusCounts, revenue] = await Promise.all([
      // Total orders
      prisma.order.count({ where: { shopId } }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: { shopId },
        _count: true,
      }),
      
      // Total revenue this month
      prisma.order.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      pendingOrders: statusMap['pending'] || 0,
      processingOrders: statusMap['processing'] || 0,
      shippedOrders: statusMap['shipped'] || 0,
      completedOrders: statusMap['completed'] || 0,
      totalRevenue: revenue._sum.totalAmount || 0,
    };
  }

  /**
   * Upsert order (create or update based on etsyReceiptId)
   */
  static async upsert(
    etsyReceiptId: string,
    data: Prisma.OrderCreateInput
  ): Promise<Order> {
    return prisma.order.upsert({
      where: { etsyReceiptId },
      create: data,
      update: data,
    });
  }
}