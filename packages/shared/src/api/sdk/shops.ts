import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { 
  Shop, 
  ShopSection, 
  ShopPolicies,
  UpdateShopPoliciesRequest,
  CreateShopSectionRequest,
  UpdateShopSectionRequest,
  ListShopSectionsRequest,
  ShopAnnouncement,
  UpdateShopRequest,
  PaginatedResponse
} from '../../types';

/**
 * Shop Management SDK methods
 */
export class ShopsAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get shop details by shop ID
   * @see https://developers.etsy.com/documentation/reference/#operation/getShop
   */
  async getShop(shopId: string | number): Promise<Shop> {
    return this.client.get<Shop>(`/v3/application/shops/${shopId}`);
  }

  /**
   * Get shop details by user ID
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopByOwnerUserId
   */
  async getShopByOwnerUserId(userId: string | number): Promise<Shop> {
    return this.client.get<Shop>(`/v3/application/users/${userId}/shops`);
  }

  /**
   * Update shop details
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShop
   */
  async updateShop(
    shopId: string | number,
    data: UpdateShopRequest
  ): Promise<Shop> {
    return this.client.put<Shop>(`/v3/application/shops/${shopId}`, data);
  }

  /**
   * Get shop sections
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopSections
   */
  async getShopSections(
    shopId: string | number,
    params?: ListShopSectionsRequest
  ): Promise<PaginatedResponse<ShopSection>> {
    return this.client.getPaginated<ShopSection>(
      `/v3/application/shops/${shopId}/sections`,
      params
    );
  }

  /**
   * Get all shop sections (handles pagination automatically)
   */
  async getAllShopSections(
    shopId: string | number
  ): Promise<ShopSection[]> {
    return this.client.getAllPages<ShopSection>(
      `/v3/application/shops/${shopId}/sections`
    );
  }

  /**
   * Get a specific shop section
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopSection
   */
  async getShopSection(
    shopId: string | number,
    shopSectionId: string | number
  ): Promise<ShopSection> {
    return this.client.get<ShopSection>(
      `/v3/application/shops/${shopId}/sections/${shopSectionId}`
    );
  }

  /**
   * Create a new shop section
   * @see https://developers.etsy.com/documentation/reference/#operation/createShopSection
   */
  async createShopSection(
    shopId: string | number,
    data: CreateShopSectionRequest
  ): Promise<ShopSection> {
    return this.client.post<ShopSection>(
      `/v3/application/shops/${shopId}/sections`,
      data
    );
  }

  /**
   * Update a shop section
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShopSection
   */
  async updateShopSection(
    shopId: string | number,
    shopSectionId: string | number,
    data: UpdateShopSectionRequest
  ): Promise<ShopSection> {
    return this.client.put<ShopSection>(
      `/v3/application/shops/${shopId}/sections/${shopSectionId}`,
      data
    );
  }

  /**
   * Delete a shop section
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteShopSection
   */
  async deleteShopSection(
    shopId: string | number,
    shopSectionId: string | number
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/shops/${shopId}/sections/${shopSectionId}`
    );
  }

  /**
   * Get shop policies
   * Note: Policies are now part of the shop object in v3 API
   */
  async getShopPolicies(shopId: string | number): Promise<ShopPolicies> {
    const shop = await this.getShop(shopId);
    return {
      privacy: shop.policy_privacy || null,
      payment: shop.policy_payment || null,
      shipping: shop.policy_shipping || null,
      refunds: shop.policy_refunds || null,
      additional: shop.policy_additional || null,
      seller_info: shop.policy_seller_info || null,
      updated_at: shop.policy_update_date || 0,
      has_private_receipt_info: shop.policy_has_private_receipt_info || false,
    };
  }

  /**
   * Update shop policies
   * Note: In v3 API, policies are updated via shop update
   */
  async updateShopPolicies(
    shopId: string | number,
    policies: UpdateShopPoliciesRequest
  ): Promise<ShopPolicies> {
    const updateData: UpdateShopRequest = {};

    if (policies.privacy !== undefined) {
      updateData.policy_privacy = policies.privacy;
    }
    if (policies.payment !== undefined) {
      updateData.policy_payment = policies.payment;
    }
    if (policies.shipping !== undefined) {
      updateData.policy_shipping = policies.shipping;
    }
    if (policies.refunds !== undefined) {
      updateData.policy_refunds = policies.refunds;
    }
    if (policies.additional !== undefined) {
      updateData.policy_additional = policies.additional;
    }
    if (policies.seller_info !== undefined) {
      updateData.policy_seller_info = policies.seller_info;
    }

    const updatedShop = await this.updateShop(shopId, updateData);
    return this.getShopPolicies(shopId);
  }

  /**
   * Get shop announcement
   */
  async getShopAnnouncement(shopId: string | number): Promise<ShopAnnouncement> {
    const shop = await this.getShop(shopId);
    return {
      announcement: shop.sale_message || null,
      updated_at: shop.updated_timestamp || 0,
    };
  }

  /**
   * Update shop announcement
   */
  async updateShopAnnouncement(
    shopId: string | number,
    announcement: string | null
  ): Promise<ShopAnnouncement> {
    await this.updateShop(shopId, { sale_message: announcement || '' });
    return this.getShopAnnouncement(shopId);
  }

  /**
   * Get shop vacation settings
   */
  async getShopVacationSettings(shopId: string | number): Promise<{
    is_vacation: boolean;
    vacation_message: string | null;
    vacation_autoreply: string | null;
  }> {
    const shop = await this.getShop(shopId);
    return {
      is_vacation: shop.is_vacation || false,
      vacation_message: shop.vacation_message || null,
      vacation_autoreply: shop.vacation_autoreply || null,
    };
  }

  /**
   * Update shop vacation settings
   */
  async updateShopVacationSettings(
    shopId: string | number,
    settings: {
      is_vacation?: boolean;
      vacation_message?: string | null;
      vacation_autoreply?: string | null;
    }
  ): Promise<void> {
    const updateData: UpdateShopRequest = {};

    if (settings.is_vacation !== undefined) {
      updateData.is_vacation = settings.is_vacation;
    }
    if (settings.vacation_message !== undefined) {
      updateData.vacation_message = settings.vacation_message || '';
    }
    if (settings.vacation_autoreply !== undefined) {
      updateData.vacation_autoreply = settings.vacation_autoreply || '';
    }

    await this.updateShop(shopId, updateData);
  }

  /**
   * Get featured listings for a shop
   * @see https://developers.etsy.com/documentation/reference/#operation/getFeaturedListingsByShop
   */
  async getFeaturedListings(
    shopId: string | number,
    params?: { limit?: number; offset?: number }
  ): Promise<any> {
    return this.client.getPaginated(
      `/v3/application/shops/${shopId}/listings/featured`,
      params
    );
  }
}