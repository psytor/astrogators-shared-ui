/**
 * Generic API types
 * Common response structures
 */

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
