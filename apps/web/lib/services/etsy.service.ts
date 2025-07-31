import { EtsyClient } from '@/lib/etsy/client';

export class EtsyService {
  private client: EtsyClient;

  constructor(accessToken: string) {
    this.client = new EtsyClient(accessToken);
  }

  async getListing(listingId: string) {
    return this.client.getListing(listingId);
  }

  async createListing(data: any) {
    return this.client.createListing(data);
  }

  async updateListing(listingId: string, data: any) {
    return this.client.updateListing(listingId, data);
  }

  async deleteListing(listingId: string) {
    return this.client.deleteListing(listingId);
  }

  async getShopListings(shopId: string) {
    return this.client.getShopListings(shopId);
  }
}