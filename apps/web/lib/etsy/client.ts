export class EtsyClient {
  constructor(private accessToken: string) {}

  async getListing(listingId: string) {
    // Mock implementation - would call Etsy API
    return {
      listing_id: parseInt(listingId),
      title: 'Mock Listing',
      description: 'Mock Description',
      price: { amount: 2999, divisor: 100 },
      quantity: 10,
      state: 'active',
      views: 100,
      num_favorers: 5,
      tags: ['tag1', 'tag2'],
      materials: ['material1'],
    };
  }

  async createListing(data: any) {
    // Mock implementation - would call Etsy API
    return {
      listing_id: Math.floor(Math.random() * 1000000),
      url: 'https://www.etsy.com/listing/123456',
      ...data,
    };
  }

  async updateListing(listingId: string, data: any) {
    // Mock implementation - would call Etsy API
    return {
      listing_id: parseInt(listingId),
      ...data,
    };
  }

  async deleteListing(listingId: string) {
    // Mock implementation - would call Etsy API
    return { success: true };
  }

  async getShopListings(shopId: string) {
    // Mock implementation - would call Etsy API
    return {
      count: 0,
      results: [],
    };
  }
}