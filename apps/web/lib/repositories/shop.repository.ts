import { prisma } from '@/lib/prisma';
import type { Shop, Prisma } from '@prisma/client';
import type { ShopWithListings } from '@/types/db';

export class ShopRepository {
  /**
   * Find a shop by ID
   */
  static async findById(id: string): Promise<Shop | null> {
    return prisma.shop.findUnique({
      where: { id },
    });
  }

  /**
   * Find a shop by Etsy shop ID
   */
  static async findByEtsyShopId(etsyShopId: string): Promise<Shop | null> {
    return prisma.shop.findUnique({
      where: { etsyShopId },
    });
  }

  /**
   * Get all shops for a user
   */
  static async findByUserId(userId: string): Promise<Shop[]> {
    return prisma.shop.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get shop with listings
   */
  static async findWithListings(id: string): Promise<ShopWithListings | null> {
    return prisma.shop.findUnique({
      where: { id },
      include: { 
        listings: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Create a new shop
   */
  static async create(data: Prisma.ShopCreateInput): Promise<Shop> {
    return prisma.shop.create({ data });
  }

  /**
   * Update a shop
   */
  static async update(
    id: string,
    data: Prisma.ShopUpdateInput
  ): Promise<Shop> {
    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  /**
   * Update shop sync timestamp
   */
  static async updateSyncTimestamp(id: string): Promise<Shop> {
    return prisma.shop.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  /**
   * Toggle shop sync
   */
  static async toggleSync(id: string, enabled: boolean): Promise<Shop> {
    return prisma.shop.update({
      where: { id },
      data: { syncEnabled: enabled },
    });
  }

  /**
   * Update shop statistics
   */
  static async updateStats(
    id: string,
    stats: {
      listingActiveCount?: number;
      listingInactiveCount?: number;
      saleCount?: number;
      reviewCount?: number;
      reviewAverage?: number;
    }
  ): Promise<Shop> {
    return prisma.shop.update({
      where: { id },
      data: stats,
    });
  }

  /**
   * Get shops needing sync
   */
  static async getShopsNeedingSync(
    hoursThreshold = 24
  ): Promise<Shop[]> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    return prisma.shop.findMany({
      where: {
        syncEnabled: true,
        isActive: true,
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: threshold } },
        ],
      },
    });
  }

  /**
   * Get shop with user data (includes etsyAccessToken)
   */
  static async findByIdWithUser(id: string) {
    return prisma.shop.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            etsyAccessToken: true,
            etsyRefreshToken: true,
            etsyTokenExpiresAt: true,
          },
        },
      },
    });
  }

  /**
   * Delete a shop and all related data
   */
  static async delete(id: string): Promise<Shop> {
    return prisma.shop.delete({
      where: { id },
    });
  }
}