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

// Some endpoints (e.g. navicharts' optional-auth star-chart GET) accept a
// missing/rejected token and just degrade behavior (anonymous view, a 404
// for a private resource) instead of ever returning 401 — so the reactive
// "refresh on 401" path below never fires for them, and a call made right
// after the access token expires fails permanently instead of recovering.
// Decoding `exp` client-side and refreshing proactively covers those
// endpoints too, since it doesn't depend on the resource server's response.
const EXPIRY_SKEW_SECONDS = 30;

// ── transient-unavailability retry ──────────────────────────────────────────
// A backend container swapped mid-deploy, a 502/503/504 from nginx, a dropped
// connection — all recover in a few seconds. Retry those a couple of times so a
// request that straddles the swap window still lands, instead of surfacing the
// blip to the user. One backoff entry per retry; its length is the retry count.
const RETRY_BACKOFF_MS = [700, 1500];
const RETRY_STATUSES = new Set([502, 503, 504]);

const isIdempotentMethod = (method?: string): boolean => {
  const m = (method ?? 'GET').toUpperCase();
  return m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
};

// Only a string (or absent) body can be re-sent for a second attempt; a
// stream/FormData/Blob may already be consumed. Our services all send JSON
// strings, so this is permissive enough in practice and safe otherwise.
const bodyIsReplayable = (body: BodyInit | null | undefined): boolean =>
  body == null || typeof body === 'string';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * `fetch` plus a short, deliberately narrow retry for transient
 * unavailability. NOT a general retry policy:
 *
 * - A request that never got a response (`fetch` threw — connection refused,
 *   reset, offline) is retried for ANY method: nothing reached the server, so
 *   nothing can have mutated.
 * - A `502/503/504` *response* is retried only for idempotent methods
 *   (GET/HEAD/OPTIONS). For a POST/PATCH/PUT/DELETE the reverse proxy can't
 *   promise the write didn't land, so the response is handed straight back and
 *   the caller (and the user) decide what to do with it.
 */
const fetchWithRetry = async (
  input: string,
  init: RequestInit
): Promise<Response> => {
  const retryAfterResponse =
    isIdempotentMethod(init.method) && bodyIsReplayable(init.body);
  const retryAfterThrow = bodyIsReplayable(init.body);

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_BACKOFF_MS[attempt - 1]);
    const canRetry = attempt < RETRY_BACKOFF_MS.length;
    try {
      const response = await fetch(input, init);
      if (canRetry && retryAfterResponse && RETRY_STATUSES.has(response.status)) {
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (canRetry && retryAfterThrow) continue;
      throw error;
    }
  }
  // Unreachable: the final iteration never `continue`s (canRetry is false), it
  // always returns or throws. TS just can't see the loop is exhaustive.
  throw lastError ?? new Error('fetchWithRetry: retries exhausted');
};

const isExpiredOrExpiringSoon = (token: string): boolean => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return typeof exp === 'number' && Date.now() / 1000 >= exp - EXPIRY_SKEW_SECONDS;
  } catch {
    // Unparseable token - let the request go out as-is and let the server
    // reject it; not this function's job to decide it's invalid.
    return false;
  }
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
 * Transient unavailability (a backend swapped mid-deploy, a 502/503/504, a
 * dropped connection) is retried a couple of times — see `fetchWithRetry` for
 * the exact, deliberately-narrow policy (non-idempotent writes are only
 * retried when no response was ever received).
 *
 * Works against ANY resource URL; only the refresh hop uses the configured
 * auth base URL.
 */
export const authedFetch = async (
  input: string,
  init: RequestInit = {}
): Promise<Response> => {
  let token = getAccessToken();
  if (token && isExpiredOrExpiringSoon(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      // Refresh failed - fall through with whatever's left in storage (likely
      // now cleared) so the request goes out and the server gives a
      // definitive, callers-can-react-to response rather than us throwing here.
      token = getAccessToken();
    }
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetchWithRetry(input, { ...init, headers });

  // Only attempt refresh when we actually sent a token — a 401 on an
  // anonymous request is a genuine authorization error, not an expiry.
  if (response.status !== 401 || !token) {
    return response;
  }

  try {
    const newToken = await refreshAccessToken();
    headers['Authorization'] = `Bearer ${newToken}`;
    return await fetchWithRetry(input, { ...init, headers });
  } catch {
    // Refresh failed — hand back the original 401 for the caller to react to.
    return response;
  }
};
