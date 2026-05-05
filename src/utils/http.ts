import { ApiError, NotFoundError } from './errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HttpClientOptions {
  /** Base URL of the Simplicity indexer (e.g. http://localhost:8080) */
  baseUrl: string;
  /** Optional API key — sent in the X-API-Key header */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 10 000) */
  timeoutMs?: number;
  /** Max retries on 5xx responses (default: 3) */
  maxRetries?: number;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

// ---------------------------------------------------------------------------
// Client HTTP
// ---------------------------------------------------------------------------

/**
 * Lightweight wrapper around the native fetch API.
 *
 * Responsibilities:
 * - URL construction with query params
 * - Header management (Content-Type, X-API-Key)
 * - Timeout via AbortController
 * - Exponential-backoff retry on 5xx responses
 * - HTTP error normalisation → ApiError / NotFoundError
 * - JSON response parsing
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options: HttpClientOptions) {
    // Strip trailing slashes to avoid double-slashes in URLs
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 3;

    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.apiKey ? { 'X-API-Key': options.apiKey } : {}),
    };
  }

  /**
   * Perform a GET request and return the parsed JSON.
   *
   * @param path   - Relative path (e.g. /v1/indexer/brc20/list)
   * @param params - Optional query params (undefined/null values are ignored)
   */
  get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.withRetry(() => this.fetchJson<T>(url, { method: 'GET', headers: this.headers }));
  }

  /**
   * Perform a POST request with a JSON body and return the parsed JSON.
   *
   * @param path - Relative path (e.g. /v1/mempool/check-pending)
   * @param body - Object to serialise as JSON
   */
  post<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.withRetry(() =>
      this.fetchJson<T>(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /** Core fetch with timeout via AbortController. */
  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      const error = err as Error;
      const isTimeout = error.name === 'AbortError';
      throw new ApiError(
        0,
        isTimeout
          ? `Request timed out after ${this.timeoutMs}ms (${url})`
          : `Unable to reach indexer (${url}): ${error.message ?? String(err)}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 404) {
      throw new NotFoundError(url);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new ApiError(response.status, text);
    }

    const json = await response.json() as T;
    if (json == null) {
      throw new ApiError(response.status, `Empty response body from ${url}`);
    }
    return json;
  }

  /**
   * Retry wrapper with exponential backoff.
   * Only retries on 5xx ApiErrors — 4xx and network errors are not retried.
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        // Only retry on server-side errors (5xx), not 4xx or config errors
        if (err instanceof ApiError && err.statusCode >= 500 && attempt < this.maxRetries - 1) {
          const delay = 200 * 2 ** attempt; // 200ms, 400ms, 800ms...
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }
}


