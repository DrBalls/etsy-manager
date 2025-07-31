import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { type ApiError as ApiErrorType, type ApiResponse, type RateLimitInfo } from '../types/api';
import { AppError, RateLimitError } from '../utils/errors';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  onTokenRefresh?: () => Promise<string>;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (this.config.onTokenRefresh) {
          const token = await this.config.onTokenRefresh();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error))),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.config.onTokenRefresh) {
          // Try to refresh token and retry
          const token = await this.config.onTokenRefresh();
          const originalRequest = error.config as AxiosRequestConfig;
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return this.client(originalRequest);
        }

        throw this.handleError(error);
      },
    );
  }

  private handleError(error: AxiosError): AppError {
    if (!error.response) {
      return new AppError('Network error', 'NETWORK_ERROR', 0);
    }

    const { status, data } = error.response;
    const apiError = data as ApiErrorType;

    if (status === 429) {
      const retryAfter = parseInt(String(error.response.headers['retry-after'] || '60'));
      return new RateLimitError(retryAfter);
    }

    return new AppError(
      apiError?.message || error.message,
      apiError?.code || 'API_ERROR',
      status,
      apiError?.details,
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  getRateLimitInfo(): RateLimitInfo | null {
    const lastResponse = this.client.defaults.headers.common['X-RateLimit-Remaining'];
    if (!lastResponse) return null;

    return {
      limit: parseInt(this.client.defaults.headers.common['X-RateLimit-Limit'] as string),
      remaining: parseInt(lastResponse as string),
      reset: new Date(
        parseInt(this.client.defaults.headers.common['X-RateLimit-Reset'] as string) * 1000,
      ),
    };
  }
}
