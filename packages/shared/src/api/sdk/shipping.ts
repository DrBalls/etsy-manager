import {
  type CreateShippingProfileRequest,
  PaginatedResponse,
  type ShippingProfile,
  type ShippingProfileDestination,
  type ShippingProfileUpgrade,
  type UpdateShippingProfileRequest,
} from '../../types';
import { type EtsyApiClientV2 } from '../etsy-api-client-v2';

/**
 * Shipping API SDK methods
 */
export class ShippingAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get shop shipping profiles
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfiles
   */
  async getShippingProfiles(shopId: string | number): Promise<ShippingProfile[]> {
    const response = await this.client.get<{ results: ShippingProfile[] }>(
      `/v3/application/shops/${shopId}/shipping-profiles`,
    );
    return response.results;
  }

  /**
   * Get a specific shipping profile
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfile
   */
  async getShippingProfile(
    shopId: string | number,
    shippingProfileId: string | number,
  ): Promise<ShippingProfile> {
    return this.client.get<ShippingProfile>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}`,
    );
  }

  /**
   * Create a shipping profile
   * @see https://developers.etsy.com/documentation/reference/#operation/createShopShippingProfile
   */
  async createShippingProfile(
    shopId: string | number,
    data: CreateShippingProfileRequest,
  ): Promise<ShippingProfile> {
    return this.client.post<ShippingProfile>(
      `/v3/application/shops/${shopId}/shipping-profiles`,
      data,
    );
  }

  /**
   * Update a shipping profile
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfile
   */
  async updateShippingProfile(
    shopId: string | number,
    shippingProfileId: string | number,
    data: UpdateShippingProfileRequest,
  ): Promise<ShippingProfile> {
    return this.client.put<ShippingProfile>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}`,
      data,
    );
  }

  /**
   * Delete a shipping profile
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteShopShippingProfile
   */
  async deleteShippingProfile(
    shopId: string | number,
    shippingProfileId: string | number,
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}`,
    );
  }

  /**
   * Get shipping profile destinations
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfileDestinations
   */
  async getShippingProfileDestinations(
    shopId: string | number,
    shippingProfileId: string | number,
  ): Promise<ShippingProfileDestination[]> {
    const response = await this.client.get<{ results: ShippingProfileDestination[] }>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/destinations`,
    );
    return response.results;
  }

  /**
   * Create shipping profile destination
   * @see https://developers.etsy.com/documentation/reference/#operation/createShopShippingProfileDestination
   */
  async createShippingProfileDestination(
    shopId: string | number,
    shippingProfileId: string | number,
    data: any, // Define proper type based on API
  ): Promise<ShippingProfileDestination> {
    return this.client.post<ShippingProfileDestination>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/destinations`,
      data,
    );
  }

  /**
   * Update shipping profile destination
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfileDestination
   */
  async updateShippingProfileDestination(
    shopId: string | number,
    shippingProfileId: string | number,
    destinationId: string | number,
    data: any, // Define proper type based on API
  ): Promise<ShippingProfileDestination> {
    return this.client.put<ShippingProfileDestination>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/destinations/${destinationId}`,
      data,
    );
  }

  /**
   * Delete shipping profile destination
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteShopShippingProfileDestination
   */
  async deleteShippingProfileDestination(
    shopId: string | number,
    shippingProfileId: string | number,
    destinationId: string | number,
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/destinations/${destinationId}`,
    );
  }

  /**
   * Get shipping profile upgrades
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfileUpgrades
   */
  async getShippingProfileUpgrades(
    shopId: string | number,
    shippingProfileId: string | number,
  ): Promise<ShippingProfileUpgrade[]> {
    const response = await this.client.get<{ results: ShippingProfileUpgrade[] }>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/upgrades`,
    );
    return response.results;
  }

  /**
   * Create shipping profile upgrade
   * @see https://developers.etsy.com/documentation/reference/#operation/createShopShippingProfileUpgrade
   */
  async createShippingProfileUpgrade(
    shopId: string | number,
    shippingProfileId: string | number,
    data: any, // Define proper type based on API
  ): Promise<ShippingProfileUpgrade> {
    return this.client.post<ShippingProfileUpgrade>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/upgrades`,
      data,
    );
  }

  /**
   * Update shipping profile upgrade
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfileUpgrade
   */
  async updateShippingProfileUpgrade(
    shopId: string | number,
    shippingProfileId: string | number,
    upgradeId: string | number,
    data: any, // Define proper type based on API
  ): Promise<ShippingProfileUpgrade> {
    return this.client.put<ShippingProfileUpgrade>(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/upgrades/${upgradeId}`,
      data,
    );
  }

  /**
   * Delete shipping profile upgrade
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteShopShippingProfileUpgrade
   */
  async deleteShippingProfileUpgrade(
    shopId: string | number,
    shippingProfileId: string | number,
    upgradeId: string | number,
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/shops/${shopId}/shipping-profiles/${shippingProfileId}/upgrades/${upgradeId}`,
    );
  }

  /**
   * Get shipping carriers
   * @see https://developers.etsy.com/documentation/reference/#operation/getShippingCarriers
   */
  async getShippingCarriers(originCountryIso: string): Promise<any[]> {
    const response = await this.client.get<{ results: any[] }>(
      '/v3/application/shipping-carriers',
      { origin_country_iso: originCountryIso },
    );
    return response.results;
  }

  /**
   * Calculate shipping costs for a listing
   */
  async calculateShippingCost(
    listingId: string | number,
    destinationCountryIso: string,
    destinationRegion?: string,
    destinationPostalCode?: string,
  ): Promise<{
    primary_cost: { amount: number; currency: string };
    secondary_cost?: { amount: number; currency: string };
    shipping_profile_id: number;
  }> {
    // This would need to get the listing, find its shipping profile,
    // then calculate costs based on destination
    // For now, returning placeholder
    return {
      primary_cost: { amount: 0, currency: 'USD' },
      shipping_profile_id: 0,
    };
  }

  /**
   * Bulk assign shipping profile to listings
   */
  async bulkAssignShippingProfile(
    shopId: string | number,
    shippingProfileId: string | number,
    listingIds: (string | number)[],
  ): Promise<Array<{ listing_id: string | number; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      listingIds.map((listingId) =>
        this.client.patch(`/v3/application/listings/${listingId}`, {
          shipping_profile_id: Number(shippingProfileId),
        }),
      ),
    );

    return results.map((result, index) => ({
      listing_id: listingIds[index]!,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason?.message : undefined,
    }));
  }
}
