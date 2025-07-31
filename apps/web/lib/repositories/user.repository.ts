import { prisma } from '@/lib/prisma';
import type { User, Prisma } from '@prisma/client';
import type { UserWithShops } from '@/types/db';

export class UserRepository {
  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by Etsy user ID
   */
  static async findByEtsyUserId(etsyUserId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { etsyUserId },
    });
  }

  /**
   * Get user with shops
   */
  static async findWithShops(id: string): Promise<UserWithShops | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { shops: true },
    });
  }

  /**
   * Create a new user
   */
  static async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Update a user
   */
  static async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update Etsy OAuth tokens
   */
  static async updateEtsyTokens(
    id: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      etsyUserId?: string;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        etsyAccessToken: tokens.accessToken,
        etsyRefreshToken: tokens.refreshToken,
        etsyTokenExpiresAt: tokens.expiresAt,
        etsyUserId: tokens.etsyUserId,
      },
    });
  }

  /**
   * Clear Etsy OAuth tokens
   */
  static async clearEtsyTokens(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        etsyAccessToken: null,
        etsyRefreshToken: null,
        etsyTokenExpiresAt: null,
        etsyUserId: null,
      },
    });
  }

  /**
   * Check if user has valid Etsy connection
   */
  static async hasValidEtsyConnection(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        etsyAccessToken: true,
        etsyTokenExpiresAt: true,
      },
    });

    if (!user?.etsyAccessToken || !user?.etsyTokenExpiresAt) {
      return false;
    }

    return new Date(user.etsyTokenExpiresAt) > new Date();
  }
}