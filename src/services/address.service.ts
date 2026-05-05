import { HttpClient } from '../utils/http';
import { AddressBalance, RawAddressBalance } from '../types/address.types';
import { RawOp, Operation } from '../types/brc20.types';
import { ActivityOptions, RawGetAllResponse } from '../types/common.types';
import { normalizeBalance, normalizeOp } from '../utils/normalize';
import { assertAddress, assertTicker } from '../utils/validate';

/**
 * Handles all API calls related to Bitcoin addresses.
 *
 * Endpoints covered:
 *   GET /v1/indexer/address/{address}/brc20/{ticker}/info       → getBalance()
 *   GET /v1/indexer/address/{address}/history/all               → getTokens()
 *   GET /v1/indexer/address/{address}/history                   → getActivity()
 *   GET /v1/indexer/address/{address}/brc20/{ticker}/history    → getTickerHistory()
 */
export class AddressService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Returns the BRC-20 balance of an address for a specific ticker.
   *
   * @param address - Bitcoin address (bc1p..., bc1q...)
   * @param ticker  - BRC-20 ticker (e.g. "ORDI", "W") — case-insensitive
   *
   * @throws NotFoundError if the address or ticker is unknown to the indexer
   *
   * @example
   * const balance = await client.getBalance('bc1p...', 'ORDI');
   * console.log(balance.overallBalance);   // "1000.00000000"
   * console.log(balance.availableBalance); // "800.00000000"
   */
  async getBalance(address: string, ticker: string): Promise<AddressBalance> {
    assertAddress(address);
    assertTicker(ticker);
    const raw = await this.http.get<RawAddressBalance>(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/info`,
    );
    return normalizeBalance(raw);
  }

  /**
   * Returns all BRC-20 tokens held by an address (balance > 0).
   *
   * Strategy:
   * 1. Fetch the full address history to identify tickers ever touched
   * 2. Fetch balances in parallel for each unique ticker
   * 3. Filter out tokens with a zero balance (fully transferred out)
   *
   * @param address - Bitcoin address
   *
   * @example
   * const holdings = await client.getTokens('bc1p...');
   * holdings.forEach(b => console.log(`${b.ticker}: ${b.overallBalance}`));
   */
  async getTokens(address: string): Promise<AddressBalance[]> {
    // 1. Fetch full history to identify tickers ever touched
    const historyResponse = await this.http.get<RawGetAllResponse<RawOp>>(
      `/v1/indexer/address/${encodeURIComponent(address)}/history/all`,
    );

    // 2. Deduplicate tickers
    const tickers = [...new Set(historyResponse.data.map((op) => op.ticker))];

    // 3. Fetch balances with limited concurrency (chunks of 10) to avoid
    //    flooding the indexer when an address has many distinct tickers.
    const CHUNK = 10;
    const settled: PromiseSettledResult<AddressBalance>[] = [];
    for (let i = 0; i < tickers.length; i += CHUNK) {
      const chunk = tickers.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        chunk.map((ticker) => this.getBalance(address, ticker)),
      );
      settled.push(...results);
    }

    // 4. Keep only balances > 0
    return settled
      .filter(
        (r): r is PromiseFulfilledResult<AddressBalance> =>
          r.status === 'fulfilled' && parseFloat(r.value.overallBalance) > 0,
      )
      .map((r) => r.value);
  }

  /**
   * Returns the BRC-20 operation history for an address.
   *
   * Includes operations where the address is sender OR receiver.
   *
   * @param address - Bitcoin address
   * @param options - Filters: ticker, opType, limit (default 100)
   *
   * @example
   * // All received transfers for a ticker
   * const transfers = await client.getActivity('bc1p...', {
   *   ticker: 'ORDI',
   *   opType: 'transfer',
   * });
   */
  async getActivity(address: string, options: ActivityOptions = {}): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/address/${encodeURIComponent(address)}/history`,
      {
        ticker: options.ticker,
        op_type: options.opType,
        limit: options.limit,
      },
    );
    return raw.map(normalizeOp);
  }

  /**
   * Returns the operation history of an address for a specific token.
   *
   * More targeted than `getActivity()` which returns all tokens mixed together.
   *
   * @param address - Bitcoin address
   * @param ticker  - BRC-20 ticker
   * @param options - Pagination: limit, skip
   *
   * @example
   * // All ORDI operations for this address
   * const history = await client.getAddressTickerHistory('bc1p...', 'ORDI');
   */
  async getTickerHistory(
    address: string,
    ticker: string,
    options: ActivityOptions = {},
  ): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/history`,
      {
        limit: options.limit,
        skip: options.skip,
      },
    );
    return raw.map(normalizeOp);
  }
}
