import { Storage } from '@plasmohq/storage';

const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000/api';
const storage = new Storage();

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    return await storage.get('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { error: error.message };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      await storage.set('authToken', response.data.token);
    }

    return response;
  }

  async logout() {
    await storage.remove('authToken');
  }

  // Listing endpoints
  async getListing(listingId: string) {
    return this.request<any>(`/listings/${listingId}`);
  }

  async updateListing(listingId: string, data: any) {
    return this.request<any>(`/listings/${listingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async syncListing(listingId: string) {
    return this.request<any>(`/listings/${listingId}/sync`, {
      method: 'POST',
    });
  }

  async bulkUpdateListings(listingIds: string[], updates: any) {
    return this.request<any>('/listings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ listingIds, updates }),
    });
  }

  // Analytics endpoints
  async getQuickStats(shopId: string) {
    return this.request<any>(`/analytics/quick-stats?shopId=${shopId}`);
  }

  async getCompetitionAnalysis(category: string, keywords: string[]) {
    return this.request<any>('/analytics/competition', {
      method: 'POST',
      body: JSON.stringify({ category, keywords }),
    });
  }

  // Order endpoints
  async getOrderSummary() {
    return this.request<any>('/orders/summary');
  }

  async bulkProcessOrders(orderIds: string[], action: string) {
    return this.request<any>('/orders/bulk-process', {
      method: 'POST',
      body: JSON.stringify({ orderIds, action }),
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(settings: any) {
    return this.request<any>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();