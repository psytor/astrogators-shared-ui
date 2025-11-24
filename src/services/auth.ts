/**
 * Authentication utility functions
 * Manages JWT tokens in localStorage
 */

const ACCESS_TOKEN_KEY = 'astrogators_access_token';
const REFRESH_TOKEN_KEY = 'astrogators_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

export const clearTokens = (): void => {
  removeAccessToken();
  removeRefreshToken();
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
