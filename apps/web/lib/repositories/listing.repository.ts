import { prisma } from '@/lib/prisma';
import type { Listing, Prisma } from '@prisma/client';
import type { ListingWithImages, ListingWithInventory, PaginatedResponse } from '@/types/db';
import { ListingState } from '@/types/db';

export class ListingRepository {
  /**
   * Find a listing by ID
   */
  static async findById(id: string): Promise<Listing | null> {
    return prisma.listing.findUnique({
      where: { id },
    });
  }

  /**
   * Find a listing by Etsy listing ID
   */
  static async findByEtsyListingId(
    etsyListingId: string
  ): Promise<Listing | null> {
    return prisma.listing.findUnique({
      where: { etsyListingId },
    });
  }

  /**
   * Get listing with images and videos
   */
  static async findWithMedia(id: string): Promise<ListingWithImages | null> {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { rank: 'asc' } },
        videos: true,
      },
    });
  }

  /**
   * Get listing with inventory
   */
  static async findWithInventory(
    id: string
  ): Promise<ListingWithInventory | null> {
    return prisma.listing.findUnique({
      where: { id },
      include: { inventoryItems: true },
    });
  }

  /**
   * Get paginated listings for a shop
   */
  static async findByShop(
    shopId: string,
    options: {
      page?: number;
      pageSize?: number;
      state?: ListingState;
      search?: string;
      orderBy?: 'createdAt' | 'updatedAt' | 'price' | 'title';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<Listing>> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ListingWhereInput = {
      shopId,
      ...(options.state && { state: options.state }),
      ...(options.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { tags: { has: options.search } },
        ],
      }),
    };

    const orderBy = {
      [options.orderBy || 'updatedAt']: options.order || 'desc',
    };

    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.listing.count({ where }),
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
   * Create a new listing
   */
  static async create(data: Prisma.ListingCreateInput): Promise<Listing> {
    return prisma.listing.create({ data });
  }

  /**
   * Update a listing
   */
  static async update(
    id: string,
    data: Prisma.ListingUpdateInput
  ): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data,
    });
  }

  /**
   * Update listing sync timestamp
   */
  static async updateSyncTimestamp(id: string): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  /**
   * Bulk update listing states
   */
  static async bulkUpdateState(
    ids: string[],
    state: ListingState
  ): Promise<number> {
    const result = await prisma.listing.updateMany({
      where: { id: { in: ids } },
      data: { state },
    });
    return result.count;
  }

  /**
   * Get listings with low stock
   */
  static async getLowStockListings(
    shopId: string,
    threshold = 5
  ): Promise<Listing[]> {
    return prisma.listing.findMany({
      where: {
        shopId,
        state: ListingState.ACTIVE,
        quantity: { lte: threshold },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  /**
   * Get listings needing sync
   */
  static async getListingsNeedingSync(
    shopId: string,
    hoursThreshold = 6
  ): Promise<Listing[]> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    return prisma.listing.findMany({
      where: {
        shopId,
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: threshold } },
        ],
      },
    });
  }

  /**
   * Update listing stats
   */
  static async updateStats(
    id: string,
    stats: {
      views?: number;
      favoritersCount?: number;
    }
  ): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data: stats,
    });
  }

  /**
   * Delete a listing
   */
  static async delete(id: string): Promise<Listing> {
    return prisma.listing.delete({
      where: { id },
    });
  }

  /**
   * Upsert listing (create or update based on etsyListingId)
   */
  static async upsert(
    etsyListingId: string,
    data: Prisma.ListingCreateInput
  ): Promise<Listing> {
    return prisma.listing.upsert({
      where: { etsyListingId },
      create: data,
      update: data,
    });
  }

  /**
   * Find all listings for a shop (without pagination)
   */
  static async findByShopId(shopId: string): Promise<Listing[]> {
    return prisma.listing.findMany({
      where: { shopId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find multiple listings by IDs with ownership check
   */
  static async findByIds(
    ids: string[],
    userId: string
  ): Promise<(Listing & { shop: { id: string; userId: string } })[]> {
    return prisma.listing.findMany({
      where: {
        id: { in: ids },
        shop: { userId },
      },
      include: {
        shop: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }
}