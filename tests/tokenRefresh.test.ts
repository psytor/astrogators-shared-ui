import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authedFetch, configureAuthRefresh } from '../src/services/tokenRefresh';
import { getAccessToken, getRefreshToken, setTokens } from '../src/services/auth';

const AUTH_BASE = 'http://auth.test/astrogators-table';
const REFRESH_URL = `${AUTH_BASE}/api/v1/auth/refresh`;
const RESOURCE = 'http://resource.test/thing';

const nowSec = () => Math.floor(Date.now() / 1000);
const jwt = (exp: number) =>
  `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
const freshToken = () => jwt(nowSec() + 3600);
const expiredToken = () => jwt(nowSec() - 10);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const refreshOk = () =>
  json({ access_token: freshToken(), refresh_token: 'rotated-refresh', token_type: 'bearer', expires_in: 1800 });

let store: Map<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;
const refreshCalls = () => fetchMock.mock.calls.filter(([url]) => url === REFRESH_URL).length;
const resourceCalls = () => fetchMock.mock.calls.filter(([url]) => url === RESOURCE);
const authHeaderOf = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  configureAuthRefresh({ baseURL: AUTH_BASE });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('authedFetch: token injection and refresh', () => {
  it('sends the stored access token as a Bearer header', async () => {
    const token = freshToken();
    setTokens(token, 'r');
    fetchMock.mockResolvedValue(json({ ok: true }));

    await authedFetch(RESOURCE);

    expect(authHeaderOf(resourceCalls()[0]).Authorization).toBe(`Bearer ${token}`);
    expect(refreshCalls()).toBe(0);
  });

  it('sends no Authorization header when logged out', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await authedFetch(RESOURCE);

    expect(authHeaderOf(resourceCalls()[0]).Authorization).toBeUndefined();
  });

  it('refreshes BEFORE the request when the token is already expired, and uses the new token', async () => {
    setTokens(expiredToken(), 'old-refresh');
    fetchMock.mockImplementation(async (url: string) =>
      url === REFRESH_URL ? refreshOk() : json({ ok: true })
    );

    await authedFetch(RESOURCE);

    expect(refreshCalls()).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toBe(REFRESH_URL);
    expect(authHeaderOf(resourceCalls()[0]).Authorization).toBe(`Bearer ${getAccessToken()}`);
    expect(getRefreshToken()).toBe('rotated-refresh');
  });

  it('refreshes proactively inside the 30s expiry skew window', async () => {
    setTokens(jwt(nowSec() + 20), 'r');
    fetchMock.mockImplementation(async (url: string) =>
      url === REFRESH_URL ? refreshOk() : json({ ok: true })
    );

    await authedFetch(RESOURCE);

    expect(refreshCalls()).toBe(1);
  });

  it('on a 401 with a token: refreshes once and retries with the new token', async () => {
    setTokens(freshToken(), 'r');
    let resourceHits = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === REFRESH_URL) return refreshOk();
      return resourceHits++ === 0 ? json({}, 401) : json({ ok: true });
    });

    const res = await authedFetch(RESOURCE);

    expect(res.status).toBe(200);
    expect(refreshCalls()).toBe(1);
    expect(resourceCalls()).toHaveLength(2);
    expect(authHeaderOf(resourceCalls()[1]).Authorization).toBe(`Bearer ${getAccessToken()}`);
  });

  it('does NOT try to refresh a 401 on an anonymous request', async () => {
    fetchMock.mockResolvedValue(json({}, 401));

    const res = await authedFetch(RESOURCE);

    expect(res.status).toBe(401);
    expect(refreshCalls()).toBe(0);
    expect(resourceCalls()).toHaveLength(1);
  });

  it('when refresh fails: clears tokens, fires onUnauthorized, hands back the original 401', async () => {
    const onUnauthorized = vi.fn();
    configureAuthRefresh({ baseURL: AUTH_BASE, onUnauthorized });
    setTokens(freshToken(), 'r');
    fetchMock.mockImplementation(async (url: string) =>
      url === REFRESH_URL ? json({}, 401) : json({}, 401)
    );

    const res = await authedFetch(RESOURCE);

    expect(res.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('a failed proactive refresh still lets the request go out (server decides)', async () => {
    setTokens(expiredToken(), 'r');
    fetchMock.mockImplementation(async (url: string) =>
      url === REFRESH_URL ? json({}, 401) : json({ ok: true })
    );

    const res = await authedFetch(RESOURCE);

    expect(res.status).toBe(200);
    expect(authHeaderOf(resourceCalls()[0]).Authorization).toBeUndefined();
  });

  it('dedupes concurrent refreshes: N parallel requests share ONE refresh call', async () => {
    setTokens(expiredToken(), 'r');
    fetchMock.mockImplementation(async (url: string) => {
      if (url === REFRESH_URL) {
        await new Promise((r) => setTimeout(r, 10));
        return refreshOk();
      }
      return json({ ok: true });
    });

    await Promise.all([authedFetch(RESOURCE), authedFetch(RESOURCE), authedFetch(RESOURCE)]);

    expect(refreshCalls()).toBe(1);
    expect(resourceCalls()).toHaveLength(3);
  });
});

describe('authedFetch: transient-unavailability retry policy', () => {
  beforeEach(() => vi.useFakeTimers());

  const run = async (init?: RequestInit) => {
    const p = authedFetch(RESOURCE, init);
    // Attach the handler before timers advance so a rejection is never "unhandled".
    const settled = p.then(
      (value) => ({ value }),
      (error) => ({ error })
    );
    await vi.runAllTimersAsync();
    return settled;
  };

  it('GET that gets a 503 then a 200 is retried and succeeds', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503)).mockResolvedValueOnce(json({ ok: true }));

    const out = (await run()) as { value: Response };

    expect(out.value.status).toBe(200);
    expect(resourceCalls()).toHaveLength(2);
  });

  it.each([502, 503, 504])('GET %i is retried', async (status) => {
    fetchMock.mockResolvedValueOnce(json({}, status)).mockResolvedValueOnce(json({ ok: true }));

    const out = (await run()) as { value: Response };

    expect(out.value.status).toBe(200);
  });

  it('a 500 is NOT retried (not a transient-unavailability status)', async () => {
    fetchMock.mockResolvedValue(json({}, 500));

    const out = (await run()) as { value: Response };

    expect(out.value.status).toBe(500);
    expect(resourceCalls()).toHaveLength(1);
  });

  it('GET that keeps returning 503 gives up after 3 total attempts and returns the 503', async () => {
    fetchMock.mockResolvedValue(json({}, 503));

    const out = (await run()) as { value: Response };

    expect(out.value.status).toBe(503);
    expect(resourceCalls()).toHaveLength(3);
  });

  it('POST that gets a 503 RESPONSE is NOT retried (the write may have landed)', async () => {
    fetchMock.mockResolvedValue(json({}, 503));

    const out = (await run({ method: 'POST', body: '{"a":1}' })) as { value: Response };

    expect(out.value.status).toBe(503);
    expect(resourceCalls()).toHaveLength(1);
  });

  it('POST where fetch THROWS (nothing reached the server) IS retried', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down')).mockResolvedValueOnce(json({ ok: true }));

    const out = (await run({ method: 'POST', body: '{"a":1}' })) as { value: Response };

    expect(out.value.status).toBe(200);
    expect(resourceCalls()).toHaveLength(2);
  });

  it('a thrown fetch that never recovers rejects after 3 attempts', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    const out = (await run()) as { error: Error };

    expect(out.error).toBeInstanceOf(TypeError);
    expect(resourceCalls()).toHaveLength(3);
  });

  it('a non-replayable body (stream/FormData) is never retried, even after a throw', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    const out = (await run({ method: 'POST', body: new FormData() })) as { error: Error };

    expect(out.error).toBeInstanceOf(TypeError);
    expect(resourceCalls()).toHaveLength(1);
  });
});
