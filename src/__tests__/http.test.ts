import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../utils/http';
import { ApiError, NotFoundError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response;
}

function makeClient(overrides?: { timeoutMs?: number; maxRetries?: number }) {
  return new HttpClient({
    baseUrl: 'http://localhost:8080',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HttpClient.get', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { ticker: 'ORDI' }));
    const client = makeClient();
    const result = await client.get<{ ticker: string }>('/v1/test');
    expect(result).toEqual({ ticker: 'ORDI' });
  });

  it('throws NotFoundError on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(404, 'not found'));
    const client = makeClient();
    await expect(client.get('/v1/missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ApiError on 500', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(500, 'server error'));
    const client = makeClient({ maxRetries: 1 });
    await expect(client.get('/v1/broken')).rejects.toBeInstanceOf(ApiError);
  });

  it('retries on 5xx and eventually throws', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(503, 'unavailable'));
    const client = makeClient({ maxRetries: 2 });
    await expect(client.get('/v1/flaky')).rejects.toBeInstanceOf(ApiError);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(400, 'bad request'));
    const client = makeClient({ maxRetries: 3 });
    await expect(client.get('/v1/bad')).rejects.toBeInstanceOf(ApiError);
    // Should NOT retry 4xx — only 1 call
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError with timeout message on AbortError', async () => {
    const abortErr = Object.assign(new Error('The operation was aborted'), {
      name: 'AbortError',
    });
    vi.mocked(fetch).mockRejectedValueOnce(abortErr);
    const client = makeClient({ timeoutMs: 5000, maxRetries: 1 });
    const err = await client.get('/v1/slow').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toContain('timed out after 5000ms');
  });

  it('throws ApiError with network message on generic error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const client = makeClient({ maxRetries: 1 });
    const err = await client.get('/v1/offline').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toContain('Unable to reach indexer');
  });

  it('sends X-API-Key header when apiKey is provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, {}));
    const client = new HttpClient({ baseUrl: 'http://localhost:8080', apiKey: 'secret' });
    await client.get('/v1/test');
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('secret');
  });

  it('appends query params correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, []));
    const client = makeClient();
    await client.get('/v1/test', { limit: 50, ticker: 'ORDI', skip: undefined });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('limit=50');
    expect(url).toContain('ticker=ORDI');
    expect(url).not.toContain('skip');
  });
});

describe('HttpClient.post', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends JSON body and returns parsed response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { is_valid: true }));
    const client = makeClient();
    const result = await client.post<{ is_valid: boolean }>('/v1/validate', { raw_tx_hex: 'abc' });
    expect(result).toEqual({ is_valid: true });
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ raw_tx_hex: 'abc' }));
  });
});
