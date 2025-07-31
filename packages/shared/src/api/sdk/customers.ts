import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { 
  User,
  Conversation,
  ConversationMessage,
  PaginatedResponse,
  SendMessageRequest
} from '../../types/etsy-types';

/**
 * Customer Data SDK methods
 */
export class CustomersAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get buyer information from a receipt
   */
  async getBuyerFromReceipt(
    shopId: string | number,
    receiptId: string | number
  ): Promise<User> {
    // First get the receipt to get buyer user ID
    const receipt = await this.client.get<any>(
      `/v3/application/shops/${shopId}/receipts/${receiptId}`
    );
    
    // Then get user details
    return this.getUser(receipt.buyer_user_id);
  }

  /**
   * Get user information
   * @see https://developers.etsy.com/documentation/reference/#operation/getUser
   */
  async getUser(userId: string | number): Promise<User> {
    return this.client.get<User>(`/v3/application/users/${userId}`);
  }

  /**
   * Get shop conversations
   * Note: This endpoint requires special permissions
   */
  async getConversations(
    shopId: string | number,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<Conversation>> {
    return this.client.getPaginated<Conversation>(
      `/v3/application/shops/${shopId}/convos`,
      params
    );
  }

  /**
   * Get a specific conversation
   */
  async getConversation(
    shopId: string | number,
    conversationId: string | number
  ): Promise<Conversation> {
    const conversations = await this.getConversations(shopId);
    const conversation = conversations.results.find(
      c => c.conversation_id === Number(conversationId)
    );
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    return conversation;
  }

  /**
   * Get conversation messages
   * Note: Messages are typically included in the conversation object
   */
  async getConversationMessages(
    shopId: string | number,
    conversationId: string | number
  ): Promise<ConversationMessage[]> {
    const conversation = await this.getConversation(shopId, conversationId);
    return conversation.messages || [];
  }

  /**
   * Send a message in a conversation
   * Note: This endpoint requires special permissions
   */
  async sendMessage(
    shopId: string | number,
    conversationId: string | number,
    message: string
  ): Promise<ConversationMessage> {
    const data: SendMessageRequest = {
      message,
    };
    
    return this.client.post<ConversationMessage>(
      `/v3/application/shops/${shopId}/convos/${conversationId}/messages`,
      data
    );
  }

  /**
   * Get customer purchase history
   */
  async getCustomerPurchaseHistory(
    shopId: string | number,
    buyerUserId: string | number
  ): Promise<{
    buyer: User;
    total_purchases: number;
    total_spent: { amount: number; currency: string };
    first_purchase_date?: Date;
    last_purchase_date?: Date;
    receipts: any[];
  }> {
    // Get buyer info
    const buyer = await this.getUser(buyerUserId);
    
    // Get all receipts and filter by buyer
    const allReceipts = await this.client.getAllPages<any>(
      `/v3/application/shops/${shopId}/receipts`
    );
    
    const buyerReceipts = allReceipts.filter(
      r => r.buyer_user_id === Number(buyerUserId)
    );
    
    // Calculate statistics
    let totalSpent = 0;
    let currency = '';
    let firstPurchase: Date | undefined;
    let lastPurchase: Date | undefined;
    
    for (const receipt of buyerReceipts) {
      totalSpent += receipt.grandtotal?.amount || 0;
      if (!currency && receipt.grandtotal?.currency_code) {
        currency = receipt.grandtotal.currency_code;
      }
      
      const createdDate = new Date(receipt.created_timestamp * 1000);
      if (!firstPurchase || createdDate < firstPurchase) {
        firstPurchase = createdDate;
      }
      if (!lastPurchase || createdDate > lastPurchase) {
        lastPurchase = createdDate;
      }
    }
    
    return {
      buyer,
      total_purchases: buyerReceipts.length,
      total_spent: {
        amount: totalSpent / 100, // Convert from cents
        currency,
      },
      first_purchase_date: firstPurchase,
      last_purchase_date: lastPurchase,
      receipts: buyerReceipts,
    };
  }

  /**
   * Get repeat customers
   */
  async getRepeatCustomers(
    shopId: string | number,
    minPurchases = 2
  ): Promise<Array<{
    buyer_user_id: number;
    purchase_count: number;
    total_spent: number;
    currency: string;
  }>> {
    const allReceipts = await this.client.getAllPages<any>(
      `/v3/application/shops/${shopId}/receipts`
    );
    
    // Group by buyer
    const buyerStats = new Map<number, {
      purchase_count: number;
      total_spent: number;
      currency: string;
    }>();
    
    for (const receipt of allReceipts) {
      const buyerId = receipt.buyer_user_id;
      const existing = buyerStats.get(buyerId) || {
        purchase_count: 0,
        total_spent: 0,
        currency: receipt.grandtotal?.currency_code || 'USD',
      };
      
      existing.purchase_count++;
      existing.total_spent += (receipt.grandtotal?.amount || 0) / 100;
      
      buyerStats.set(buyerId, existing);
    }
    
    // Filter for repeat customers
    const repeatCustomers: Array<{
      buyer_user_id: number;
      purchase_count: number;
      total_spent: number;
      currency: string;
    }> = [];
    
    for (const [buyerId, stats] of buyerStats) {
      if (stats.purchase_count >= minPurchases) {
        repeatCustomers.push({
          buyer_user_id: buyerId,
          ...stats,
        });
      }
    }
    
    // Sort by purchase count descending
    repeatCustomers.sort((a, b) => b.purchase_count - a.purchase_count);
    
    return repeatCustomers;
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(shopId: string | number): Promise<{
    new_customers: number;
    repeat_customers: number;
    vip_customers: number; // 5+ purchases
    dormant_customers: number; // No purchase in last 6 months
  }> {
    const allReceipts = await this.client.getAllPages<any>(
      `/v3/application/shops/${shopId}/receipts`
    );
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoTimestamp = Math.floor(sixMonthsAgo.getTime() / 1000);
    
    const buyerPurchases = new Map<number, {
      count: number;
      lastPurchase: number;
    }>();
    
    for (const receipt of allReceipts) {
      const buyerId = receipt.buyer_user_id;
      const existing = buyerPurchases.get(buyerId) || {
        count: 0,
        lastPurchase: 0,
      };
      
      existing.count++;
      if (receipt.created_timestamp > existing.lastPurchase) {
        existing.lastPurchase = receipt.created_timestamp;
      }
      
      buyerPurchases.set(buyerId, existing);
    }
    
    let newCustomers = 0;
    let repeatCustomers = 0;
    let vipCustomers = 0;
    let dormantCustomers = 0;
    
    for (const [_, stats] of buyerPurchases) {
      if (stats.count === 1) {
        newCustomers++;
      } else {
        repeatCustomers++;
        
        if (stats.count >= 5) {
          vipCustomers++;
        }
        
        if (stats.lastPurchase < sixMonthsAgoTimestamp) {
          dormantCustomers++;
        }
      }
    }
    
    return {
      new_customers: newCustomers,
      repeat_customers: repeatCustomers,
      vip_customers: vipCustomers,
      dormant_customers: dormantCustomers,
    };
  }
}