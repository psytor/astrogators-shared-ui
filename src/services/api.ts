/**
 * API Client
 * HTTP client with JWT token injection and automatic refresh
 */

import { getAccessToken, setTokens, clearTokens, getRefreshToken } from './auth';
import type { ApiError, RefreshTokenResponse } from '../types';

export interface ApiClientConfig {
  baseURL: string;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseURL: string;
  private onUnauthorized?: () => void;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      this.onUnauthorized?.();
      throw new Error('Token refresh failed');
    }

    const data: RefreshTokenResponse = await response.json();
    setTokens(data.access_token, refreshToken);
    return data.access_token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const url = `${this.baseURL}${endpoint}`;
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && accessToken) {
      // Prevent multiple simultaneous refresh attempts
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.refreshAccessToken()
          .finally(() => {
            this.isRefreshing = false;
            this.refreshPromise = null;
          });
      }

      try {
        const newAccessToken = await this.refreshPromise!;
        headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request with new token
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || errorData.detail || error.message;
        error.detail = errorData.detail;
      } catch {
        // Response is not JSON
      }

      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Default client instance (will be configured by applications)
export let apiClient: ApiClient;

export const initializeApiClient = (config: ApiClientConfig) => {
  apiClient = new ApiClient(config);
};
