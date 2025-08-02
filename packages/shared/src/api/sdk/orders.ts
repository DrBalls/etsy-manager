import {
  type CreateShipmentRequest,
  type GetShopReceiptsRequest,
  type PaginatedResponse,
  type Receipt,
  type Shipment,
  type Transaction,
  type UpdateShipmentRequest,
} from '../../types';
import { type EtsyApiClientV2 } from '../etsy-api-client-v2';

/**
 * Order Processing SDK methods
 */
export class OrdersAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get shop receipts (orders)
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopReceipts
   */
  async getShopReceipts(
    shopId: string | number,
    params?: GetShopReceiptsRequest,
  ): Promise<PaginatedResponse<Receipt>> {
    return this.client.getPaginated<Receipt>(`/v3/application/shops/${shopId}/receipts`, params);
  }

  /**
   * Get all shop receipts (handles pagination)
   */
  async getAllShopReceipts(
    shopId: string | number,
    filters?: Omit<GetShopReceiptsRequest, 'limit' | 'offset'>,
  ): Promise<Receipt[]> {
    return this.client.getAllPages<Receipt>(`/v3/application/shops/${shopId}/receipts`, filters);
  }

  /**
   * Get a specific receipt
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopReceipt
   */
  async getReceipt(shopId: string | number, receiptId: string | number): Promise<Receipt> {
    return this.client.get<Receipt>(`/v3/application/shops/${shopId}/receipts/${receiptId}`);
  }

  /**
   * Get receipt transactions
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopReceiptTransactionsByReceipt
   */
  async getReceiptTransactions(
    shopId: string | number,
    receiptId: string | number,
  ): Promise<Transaction[]> {
    const response = await this.client.get<{ results: Transaction[] }>(
      `/v3/application/shops/${shopId}/receipts/${receiptId}/transactions`,
    );
    return response.results;
  }

  /**
   * Get shop receipts by status
   */
  async getReceiptsByStatus(
    shopId: string | number,
    status: 'open' | 'unshipped' | 'unpaid' | 'completed' | 'processing' | 'all',
    params?: Omit<GetShopReceiptsRequest, 'was_shipped' | 'was_paid'>,
  ): Promise<PaginatedResponse<Receipt>> {
    const filters: GetShopReceiptsRequest = { ...params };

    switch (status) {
      case 'unshipped':
        filters.was_shipped = false;
        break;
      case 'unpaid':
        filters.was_paid = false;
        break;
      case 'open':
        filters.was_shipped = false;
        filters.was_paid = true;
        break;
      // 'all' and others don't need filters
    }

    return this.getShopReceipts(shopId, filters);
  }

  /**
   * Create or update shipment tracking
   * @see https://developers.etsy.com/documentation/reference/#operation/createReceiptShipment
   */
  async createShipment(
    shopId: string | number,
    receiptId: string | number,
    data: CreateShipmentRequest,
  ): Promise<Shipment> {
    return this.client.post<Shipment>(
      `/v3/application/shops/${shopId}/receipts/${receiptId}/tracking`,
      data,
    );
  }

  /**
   * Update shipment tracking
   * @see https://developers.etsy.com/documentation/reference/#operation/updateShopReceiptTracking
   */
  async updateShipment(
    shopId: string | number,
    trackingId: string | number,
    data: UpdateShipmentRequest,
  ): Promise<Shipment> {
    return this.client.put<Shipment>(
      `/v3/application/shops/${shopId}/receipts/tracking/${trackingId}`,
      data,
    );
  }

  /**
   * Get shipments for a receipt
   * @see https://developers.etsy.com/documentation/reference/#operation/getShopReceiptShipments
   */
  async getReceiptShipments(
    shopId: string | number,
    receiptId: string | number,
  ): Promise<Shipment[]> {
    const response = await this.client.get<{ results: Shipment[] }>(
      `/v3/application/shops/${shopId}/receipts/${receiptId}/shipments`,
    );
    return response.results;
  }

  /**
   * Mark receipt as shipped (without tracking)
   */
  async markAsShipped(shopId: string | number, receiptId: string | number): Promise<Receipt> {
    // In v3 API, this is done by creating a shipment without tracking
    await this.createShipment(shopId, receiptId, {
      // Minimal data for marking as shipped
      send_bcc: false,
    });

    return this.getReceipt(shopId, receiptId);
  }

  /**
   * Get order summary statistics
   */
  async getOrderStats(
    shopId: string | number,
    dateRange?: { start: Date; end: Date },
  ): Promise<{
    total_orders: number;
    unshipped_orders: number;
    revenue: { amount: number; currency: string };
    average_order_value: number;
  }> {
    const params: GetShopReceiptsRequest = {};

    if (dateRange) {
      params.min_created = Math.floor(dateRange.start.getTime() / 1000);
      params.max_created = Math.floor(dateRange.end.getTime() / 1000);
    }

    const receipts = await this.getAllShopReceipts(shopId, params);
    const unshippedReceipts = receipts.filter((r) => !r.is_shipped);

    let totalRevenue = 0;
    let currency = '';

    for (const receipt of receipts) {
      totalRevenue += receipt.grandtotal?.amount || 0;
      if (!currency && receipt.grandtotal?.currency_code) {
        currency = receipt.grandtotal.currency_code;
      }
    }

    return {
      total_orders: receipts.length,
      unshipped_orders: unshippedReceipts.length,
      revenue: {
        amount: totalRevenue / 100, // Convert from cents
        currency,
      },
      average_order_value: receipts.length > 0 ? totalRevenue / receipts.length / 100 : 0,
    };
  }

  /**
   * Batch update shipping status
   */
  async batchMarkAsShipped(
    shopId: string | number,
    receiptIds: (string | number)[],
  ): Promise<Array<{ receipt_id: string | number; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      receiptIds.map((receiptId) => this.markAsShipped(shopId, receiptId)),
    );

    return results.map((result, index) => ({
      receipt_id: receiptIds[index]!,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason?.message : undefined,
    }));
  }
}
