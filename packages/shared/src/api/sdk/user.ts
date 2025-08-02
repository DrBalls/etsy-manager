import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { User, Shop, PaginatedResponse } from '../../types';

/**
 * User API SDK methods
 */
export class UserAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get the authenticated user
   * @see https://developers.etsy.com/documentation/reference/#operation/getMe
   */
  async getMe(): Promise<User> {
    return this.client.get<User>('/v3/application/users/me');
  }

  /**
   * Get a specific user
   * @see https://developers.etsy.com/documentation/reference/#operation/getUser
   */
  async getUser(userId: string | number): Promise<User> {
    return this.client.get<User>(`/v3/application/users/${userId}`);
  }

  /**
   * Get shops owned by the authenticated user
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopsByOwnerUserId
   */
  async getMyShops(): Promise<Shop[]> {
    const me = await this.getMe();
    const response = await this.client.get<{ results: Shop[] }>(
      `/v3/application/users/${me.user_id}/shops`
    );
    return response.results;
  }

  /**
   * Get shops owned by a specific user
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopsByOwnerUserId
   */
  async getUserShops(userId: string | number): Promise<Shop[]> {
    const response = await this.client.get<{ results: Shop[] }>(
      `/v3/application/users/${userId}/shops`
    );
    return response.results;
  }

  /**
   * Get user's favorite listings
   * Note: This may require special permissions
   */
  async getUserFavoriteListings(
    userId: string | number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>(
      `/v3/application/users/${userId}/favorites/listings`,
      params
    );
  }

  /**
   * Get user's favorite shops
   * Note: This may require special permissions
   */
  async getUserFavoriteShops(
    userId: string | number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<Shop>> {
    return this.client.getPaginated<Shop>(
      `/v3/application/users/${userId}/favorites/shops`,
      params
    );
  }

  /**
   * Check if user has a specific permission/scope
   */
  async checkPermission(scope: string): Promise<boolean> {
    try {
      // Try to get user info to verify auth is working
      await this.getMe();
      
      // In a real implementation, you'd check the token's scopes
      // For now, we'll assume the scope is available if we can auth
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's cart (buyer functionality)
   * Note: This requires buyer-specific permissions
   */
  async getUserCart(userId?: string | number): Promise<any> {
    const targetUserId = userId || 'me';
    return this.client.get<any>(`/v3/application/users/${targetUserId}/carts`);
  }

  /**
   * Get user addresses (for shipping)
   * Note: This may require special permissions
   */
  async getUserAddresses(userId?: string | number): Promise<any[]> {
    const targetUserId = userId || 'me';
    const response = await this.client.get<{ results: any[] }>(
      `/v3/application/users/${targetUserId}/addresses`
    );
    return response.results;
  }

  /**
   * Update user profile
   * Note: Very limited fields can be updated via API
   */
  async updateProfile(data: {
    bio?: string;
    birth_month?: number;
    birth_day?: number;
  }): Promise<User> {
    // Note: The v3 API has very limited user update capabilities
    // Most profile updates need to be done through Etsy's web interface
    return this.client.put<User>('/v3/application/users/me', data);
  }

  /**
   * Get user's purchase history (as a buyer)
   * Note: This requires buyer-specific permissions
   */
  async getPurchaseHistory(
    userId?: string | number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<any>> {
    const targetUserId = userId || 'me';
    return this.client.getPaginated<any>(
      `/v3/application/users/${targetUserId}/receipts`,
      params
    );
  }

  /**
   * Get user's reviews (as a buyer)
   * Note: This may require special permissions
   */
  async getUserReviews(
    userId: string | number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>(
      `/v3/application/users/${userId}/reviews`,
      params
    );
  }

  /**
   * Get detailed user profile with shop info
   */
  async getUserProfile(userId?: string | number): Promise<{
    user: User;
    shops: Shop[];
    is_seller: boolean;
    member_since: Date;
  }> {
    const targetUserId = userId || 'me';
    
    // Get user info
    const user = targetUserId === 'me' 
      ? await this.getMe()
      : await this.getUser(targetUserId);
    
    // Get user's shops
    const shops = await this.getUserShops(user.user_id);
    
    return {
      user,
      shops,
      is_seller: shops.length > 0,
      member_since: new Date(user.create_timestamp * 1000),
    };
  }
}