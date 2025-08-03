export class EtsyClient {
  // TODO: Use accessToken when implementing real API calls
  constructor(private accessToken: string) {
    // Suppress unused warning - will be used when implementing real API calls
    void this.accessToken;
  }

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
    void listingId; // Will be used when implementing real API calls
    return { success: true };
  }

  async getShopListings(shopId: string) {
    // Mock implementation - would call Etsy API
    void shopId; // Will be used when implementing real API calls
    return {
      count: 0,
      results: [],
    };
  }

  async sendOrderMessage(shopId: string, orderId: string, message: string) {
    // Mock implementation - would call Etsy API
    void shopId;
    void orderId;
    void message;
    return { success: true };
  }

  async updateShipmentStatus(shopId: string, orderId: string) {
    // Mock implementation - would call Etsy API
    void shopId;
    void orderId;
    return { success: true };
  }

  async addTrackingNumber(shopId: string, orderId: string, trackingNumber: string, trackingCarrier: string) {
    // Mock implementation - would call Etsy API
    void shopId;
    void orderId;
    void trackingNumber;
    void trackingCarrier;
    return { success: true };
  }

  async getOrders(shopId: string, options: { limit?: number; was_shipped?: boolean } = {}) {
    // Mock implementation - would call Etsy API
    void shopId;
    void options;
    return {
      count: 0,
      results: [],
    };
  }

  async getOrderTransactions(shopId: string, receiptId: string) {
    // Mock implementation - would call Etsy API
    void shopId;
    void receiptId;
    return {
      count: 0,
      results: [],
    };
  }
}