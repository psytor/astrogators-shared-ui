/**
 * Token refresh primitive
 *
 * The single, reusable implementation of "send an authenticated request and,
 * if the access token has expired, refresh it once and retry." It is split
 * out from ApiClient so that service-specific clients with their OWN base URL
 * (e.g. mod-ledger-ui's evaluationsApi, which talks to VITE_MOD_LEDGER_URL)
 * can share the same refresh behavior instead of rolling a raw `fetch` that
 * silently dies the moment the 30-minute access token expires.
 *
 * The refresh endpoint always lives on the auth service, regardless of which
 * resource host returned the 401. That auth base URL is configured once via
 * `configureAuthRefresh` — `initializeApiClient` calls it for you, so any app
 * that mounts <AuthProvider> already has it wired.
 */
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';
import type { RefreshTokenResponse } from '../types';

let authBaseUrl = '';
let onUnauthorized: (() => void) | undefined;

// Dedup concurrent refreshes: many requests can 401 at once when the token
// expires; they must all await a single in-flight refresh, not stampede the
// refresh endpoint (which would rotate the refresh token N times).
let refreshPromise: Promise<string> | null = null;

export interface AuthRefreshConfig {
  baseURL: string;
  onUnauthorized?: () => void;
}

/** Point the refresh primitive at the auth service. Idempotent. */
export const configureAuthRefresh = (config: AuthRefreshConfig): void => {
  authBaseUrl = config.baseURL;
  onUnauthorized = config.onUnauthorized;
};

/**
 * Exchange the stored refresh token for a fresh access token. Concurrent
 * callers share one in-flight request. On failure the tokens are cleared and
 * `onUnauthorized` fires, then the error propagates.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${authBaseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      onUnauthorized?.();
      throw new Error('Token refresh failed');
    }

    const data: RefreshTokenResponse = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/**
 * `fetch` that injects the current bearer token and, on a 401 from an
 * authenticated request, refreshes the token once and retries.
 *
 * Returns the final Response — it does NOT throw on non-2xx, so callers keep
 * full control over status handling (mirrors the raw `fetch` contract). When a
 * refresh is needed but fails (e.g. the refresh token is also expired), the
 * original 401 Response is returned so the caller can surface a re-login state.
 *
 * Works against ANY resource URL; only the refresh hop uses the configured
 * auth base URL.
 */
export const authedFetch = async (
  input: string,
  init: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(input, { ...init, headers });

  // Only attempt refresh when we actually sent a token — a 401 on an
  // anonymous request is a genuine authorization error, not an expiry.
  if (response.status !== 401 || !token) {
    return response;
  }

  try {
    const newToken = await refreshAccessToken();
    headers['Authorization'] = `Bearer ${newToken}`;
    return await fetch(input, { ...init, headers });
  } catch {
    // Refresh failed — hand back the original 401 for the caller to react to.
    return response;
  }
};
