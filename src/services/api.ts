/**
 * API Client
 * HTTP client with JWT token injection and automatic refresh.
 *
 * Token injection + refresh-and-retry are delegated to the shared
 * `authedFetch` primitive (services/tokenRefresh) so there is ONE refresh
 * implementation across the app, and any service-specific client (with its
 * own base URL) can reuse it. This class is the convenience layer on top:
 * base-URL joining, JSON encoding, and structured error parsing.
 */

import type { ApiError } from '../types';
import { authedFetch, configureAuthRefresh } from './tokenRefresh';

export interface ApiClientConfig {
  baseURL: string;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseURL: string;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    // The refresh endpoint lives on this auth base URL; wire the shared
    // primitive so authedFetch (here and in other clients) can refresh.
    configureAuthRefresh({
      baseURL: config.baseURL,
      onUnauthorized: config.onUnauthorized,
    });
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const url = `${this.baseURL}${endpoint}`;
    // authedFetch injects the bearer token and, on a 401, refreshes once and
    // retries. A surviving 401 (refresh token also dead) falls through to the
    // structured-error path below as an ordinary 401.
    const response = await authedFetch(url, { ...options, headers });

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();

        // Handle FastAPI validation errors (422)
        if (response.status === 422 && Array.isArray(errorData.detail)) {
          // Extract validation error messages
          const validationErrors = errorData.detail
            .map((err: any) => err.msg || 'Validation error')
            .join(', ');
          error.message = validationErrors;
        } else if (typeof errorData.detail === 'string') {
          error.message = errorData.detail;
        } else if (errorData.message) {
          error.message = errorData.message;
        }

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
