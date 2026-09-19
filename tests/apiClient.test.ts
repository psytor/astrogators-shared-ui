import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../src/services/api';

const BASE = 'http://api.test/astrogators-table';

let fetchMock: ReturnType<typeof vi.fn>;
let client: ApiClient;

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  client = new ApiClient({ baseURL: BASE });
});

afterEach(() => vi.unstubAllGlobals());

const jsonRes = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('ApiClient', () => {
  it('joins baseURL + endpoint and sends JSON for POST', async () => {
    fetchMock.mockResolvedValue(jsonRes({ ok: 1 }, 200));

    await client.post('/api/v1/x', { a: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/x`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('returns {} for a 204 without trying to parse a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    expect(await client.delete('/api/v1/x')).toEqual({});
  });

  it('turns a FastAPI 422 detail array into one joined message', async () => {
    fetchMock.mockResolvedValue(
      jsonRes({ detail: [{ msg: 'email is invalid' }, { msg: 'password too short' }] }, 422)
    );

    await expect(client.post('/api/v1/x', {})).rejects.toMatchObject({
      status: 422,
      message: 'email is invalid, password too short',
    });
  });

  it('uses a string `detail` as the error message', async () => {
    fetchMock.mockResolvedValue(jsonRes({ detail: 'Incorrect email or password' }, 401));

    await expect(client.post('/api/v1/x', {})).rejects.toMatchObject({
      status: 401,
      message: 'Incorrect email or password',
    });
  });

  it('falls back to statusText when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>oops</html>', { status: 500, statusText: 'Internal Server Error' }));

    await expect(client.get('/api/v1/x')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    });
  });
});
