import { prisma } from '@/lib/prisma';
import type { InventoryItem, Prisma } from '@prisma/client';

export class InventoryRepository {
  /**
   * Find inventory item by ID
   */
  static async findById(id: string): Promise<InventoryItem | null> {
    return prisma.inventoryItem.findUnique({
      where: { id },
    });
  }

  /**
   * Find inventory item by ID with listing data
   */
  static async findByIdWithListing(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            userId: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Find multiple inventory items by IDs with listing data
   */
  static async findByIds(ids: string[]) {
    return prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        listing: {
          select: {
            id: true,
            userId: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Get all inventory items for a listing
   */
  static async findByListing(listingId: string): Promise<InventoryItem[]> {
    return prisma.inventoryItem.findMany({
      where: { listingId },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Get all inventory items for a shop
   */
  static async findByShopId(shopId: string) {
    return prisma.inventoryItem.findMany({
      where: {
        listing: { shopId },
        isTracking: true,
      },
      include: {
        listing: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Get inventory items with low stock
   */
  static async getLowStockItems(
    shopId: string,
    threshold?: number
  ): Promise<Array<InventoryItem & { listing: { id: string; title: string } }>> {
    return prisma.inventoryItem.findMany({
      where: {
        listing: { shopId },
        isTracking: true,
        OR: [
          // Items below their custom threshold
          {
            AND: [
              { lowStockAlert: { not: null } },
              { quantity: { lte: prisma.inventoryItem.fields.lowStockAlert } },
            ],
          },
          // Items below default threshold if no custom threshold
          {
            AND: [
              { lowStockAlert: null },
              { quantity: { lte: threshold || 5 } },
            ],
          },
        ],
      },
      include: {
        listing: {
          select: { id: true, title: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  /**
   * Alias for getLowStockItems for consistency
   */
  static async findLowStock(
    shopId: string,
    threshold?: number
  ): Promise<Array<InventoryItem & { listing: { id: string; title: string } }>> {
    return this.getLowStockItems(shopId, threshold);
  }

  /**
   * Update inventory quantity
   */
  static async updateQuantity(
    id: string,
    quantity: number
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: { quantity },
    });
  }

  /**
   * Update inventory item
   */
  static async update(
    id: string,
    data: Partial<{
      quantity: number;
      lowStockAlert: number | null;
      updatedAt: Date;
    }>
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }

  /**
   * Bulk update inventory quantities
   */
  static async bulkUpdateQuantities(
    updates: Array<{ id: string; quantity: number }>
  ): Promise<number> {
    const transactions = updates.map((update) =>
      prisma.inventoryItem.update({
        where: { id: update.id },
        data: { quantity: update.quantity },
      })
    );

    const results = await prisma.$transaction(transactions);
    return results.length;
  }

  /**
   * Decrement inventory quantity (for order processing)
   */
  static async decrementQuantity(
    id: string,
    amount: number
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: {
          decrement: amount,
        },
      },
    });
  }

  /**
   * Create or update inventory item
   */
  static async upsert(
    listingId: string,
    productId: string,
    data: Omit<Prisma.InventoryItemCreateInput, 'listing'>
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.upsert({
      where: {
        listingId_productId: {
          listingId,
          productId,
        },
      },
      create: {
        ...data,
        listing: { connect: { id: listingId } },
      },
      update: data,
    });
  }

  /**
   * Toggle inventory tracking
   */
  static async toggleTracking(
    id: string,
    isTracking: boolean
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: { isTracking },
    });
  }

  /**
   * Set low stock alert threshold
   */
  static async setLowStockAlert(
    id: string,
    threshold: number | null
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: { lowStockAlert: threshold },
    });
  }

  /**
   * Get inventory value for a shop
   */
  static async getInventoryValue(shopId: string): Promise<{
    totalItems: number;
    totalValue: number;
    totalQuantity: number;
  }> {
    const items = await prisma.inventoryItem.findMany({
      where: {
        listing: { shopId },
        isTracking: true,
      },
      select: {
        quantity: true,
        price: true,
      },
    });

    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0
    );

    return {
      totalItems,
      totalQuantity,
      totalValue,
    };
  }
}