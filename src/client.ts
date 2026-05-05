import { HttpClient } from './utils/http';
import { IndexerService } from './services/indexer.service';
import { TokenService } from './services/token.service';
import { AddressService } from './services/address.service';
import { SwapService } from './services/swap.service';
import { MempoolService } from './services/mempool.service';
import { ValidatorService } from './services/validator.service';
import { WrapService } from './services/wrap.service';
import { AddressBalance } from './types/address.types';
import { TokenInfo, Operation, IndexerStatus } from './types/brc20.types';
import {
  Pool,
  SwapPosition,
  TvlInfo,
  ListPositionsOptions,
  ListPoolsOptions,
} from './types/swap.types';
import { PendingResult } from './types/mempool.types';
import { WrapMintValidationResult, AddressValidationResult } from './types/validator.types';
import { WrapContract, WrapTvl, WrapMetrics, ListContractsOptions } from './types/wrap.types';
import { ActivityOptions, PaginationOptions } from './types/common.types';

export interface UniversalClientOptions {
  /**
   * Base URL of the Simplicity indexer.
   * @default "http://localhost:8080"
   */
  baseUrl?: string;
  /**
   * Optional API key — sent in the X-API-Key header.
   */
  apiKey?: string;
  /**
   * Request timeout in milliseconds.
   * @default 10000
   */
  timeoutMs?: number;
  /**
   * Maximum number of retries on 5xx responses (exponential backoff).
   * @default 3
   */
  maxRetries?: number;
}

/**
 * Main entry point for the Universal Protocol SDK.
 *
 * Create one instance and reuse it throughout your application.
 *
 * @example
 * ```ts
 * // Local development
 * const client = new UniversalClient();
 *
 * // Production
 * const client = new UniversalClient({
 *   baseUrl: 'https://indexer.myproject.com',
 *   apiKey: process.env.INDEXER_API_KEY,
 *   timeoutMs: 15_000,
 *   maxRetries: 3,
 * });
 * ```
 */
export class UniversalClient {
  private readonly indexer: IndexerService;
  private readonly tokens: TokenService;
  private readonly address: AddressService;
  private readonly swap: SwapService;
  private readonly mempool: MempoolService;
  private readonly validator: ValidatorService;
  private readonly wrap: WrapService;

  constructor(options: UniversalClientOptions = {}) {
    const http = new HttpClient({
      baseUrl: options.baseUrl ?? 'http://localhost:8080',
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs,
      maxRetries: options.maxRetries,
    });

    this.indexer = new IndexerService(http);
    this.tokens = new TokenService(http);
    this.address = new AddressService(http);
    this.swap = new SwapService(http);
    this.mempool = new MempoolService(http);
    this.validator = new ValidatorService(http);
    this.wrap = new WrapService(http);
  }

  // ---------------------------------------------------------------------------
  // Indexeur
  // ---------------------------------------------------------------------------

  /** Check that the indexer is up. Returns `{ status: "ok" }`. */
  health(): Promise<{ status: string }> {
    return this.indexer.health();
  }

  /**
   * Returns the sync state of the indexer.
   * Useful to check if the indexer is up to date with the Bitcoin network.
   */
  status(): Promise<IndexerStatus> {
    return this.indexer.status();
  }

  // ---------------------------------------------------------------------------
  // Tokens BRC-20
  // ---------------------------------------------------------------------------

  /** Lists all deployed BRC-20 tokens on the Universal Protocol.
   * @param options - Pagination: limit, skip
   */
  listTokens(options?: PaginationOptions): Promise<TokenInfo[]> {
    return this.tokens.listTokens(options);
  }

  /**
   * Fetches detailed information about a BRC-20 token (supply, holders, deploy info...).
   * @param ticker - e.g. "ORDI", "W" (case-insensitive)
   */
  getToken(ticker: string): Promise<TokenInfo> {
    return this.tokens.getToken(ticker);
  }

  /**
   * Returns all holders of a token with their balances.
   * @param ticker  - e.g. \"ORDI\"
   * @param options - Pagination: limit, skip
   */
  getTokenHolders(ticker: string, options?: PaginationOptions): Promise<AddressBalance[]> {
    return this.tokens.getHolders(ticker, options);
  }

  /**
   * Returns the operation history for a token (deploy, mint, transfer).
   * @param ticker  - e.g. "ORDI"
   * @param options - Filters: opType, limit, skip
   */
  getTokenHistory(ticker: string, options?: ActivityOptions): Promise<Operation[]> {
    return this.tokens.getHistory(ticker, options);
  }

  // ---------------------------------------------------------------------------
  // Adresses
  // ---------------------------------------------------------------------------

  /**
   * Returns the balance of a specific token for an address.
   * @param address - Bitcoin address
   * @param ticker  - Token ticker (e.g. "ORDI")
   */
  getBalance(address: string, ticker: string): Promise<AddressBalance> {
    return this.address.getBalance(address, ticker);
  }

  /**
   * Returns all tokens held by an address (balance > 0).
   *
   * Inspects the full address history to identify touched tokens,
   * then fetches current balances in parallel (chunks of 10).
   *
   * @param address - Bitcoin address
   */
  getTokens(address: string): Promise<AddressBalance[]> {
    return this.address.getTokens(address);
  }

  /**
   * Returns the BRC-20 operation history of an address.
   * @param address - Bitcoin address
   * @param options - Filters: ticker, opType, limit
   */
  getActivity(address: string, options?: ActivityOptions): Promise<Operation[]> {
    return this.address.getActivity(address, options);
  }

  // ---------------------------------------------------------------------------
  // Swap
  // ---------------------------------------------------------------------------

  /**
   * Lists available swap pools.
   * @param options - Filter by src and/or dst ticker
   */
  listPools(options?: ListPoolsOptions): Promise<Pool[]> {
    return this.swap.listPools(options);
  }

  /**
   * Returns the TVL (Total Value Locked) of a token in the Swap module.
   * @param ticker - Token ticker
   */
  getSwapTvl(ticker: string): Promise<TvlInfo> {
    return this.swap.getTvl(ticker);
  }

  /**
   * Lists swap positions with optional filters.
   * @param options - owner, src, dst, status, limit, offset
   */
  listSwapPositions(options?: ListPositionsOptions): Promise<SwapPosition[]> {
    return this.swap.listPositions(options);
  }

  /**
   * Returns all swap positions for an address.
   * @param owner   - Bitcoin address
   * @param options - status, limit, offset
   */
  getOwnerSwapPositions(
    owner: string,
    options?: Omit<ListPositionsOptions, 'owner'>,
  ): Promise<SwapPosition[]> {
    return this.swap.getOwnerPositions(owner, options);
  }

  /**
   * Fetches a swap position by its unique identifier.
   * @param id - Numeric position ID
   */
  getSwapPosition(id: number): Promise<SwapPosition> {
    return this.swap.getPosition(id);
  }

  /**
   * Returns swap positions expiring at or before a given block height.
   * @param heightLte - Maximum block height (REQUIRED)
   * @param options   - limit, offset
   */
  getExpiringSwapPositions(
    heightLte: number,
    options?: Pick<ListPositionsOptions, 'limit' | 'offset'>,
  ): Promise<SwapPosition[]> {
    return this.swap.getExpiringPositions(heightLte, options);
  }

  // ---------------------------------------------------------------------------
  // Tokens — variantes /all, /tx/{txid}/history, /history-by-height
  // ---------------------------------------------------------------------------

  /**
   * Returns ALL deployed BRC-20 tokens (no pagination).
   * For large lists, prefer `listTokens()` with pagination.
   */
  listAllTokens(): Promise<TokenInfo[]> {
    return this.tokens.listAllTokens();
  }

  /**
   * Returns ALL holders of a token (no pagination).
   * @param ticker - Token ticker
   */
  getAllTokenHolders(ticker: string): Promise<AddressBalance[]> {
    return this.tokens.getAllHolders(ticker);
  }

  /**
   * Returns the FULL history of a token (no pagination).
   * @param ticker  - Token ticker
   * @param options - opType, maxResults, includeInvalid
   */
  getAllTokenHistory(
    ticker: string,
    options?: { opType?: string; maxResults?: number; includeInvalid?: boolean },
  ): Promise<Operation[]> {
    return this.tokens.getAllHistory(ticker, options);
  }

  /**
   * Returns BRC-20 operations linked to a specific Bitcoin transaction.
   * @param ticker - Token ticker
   * @param txid   - Transaction TXID
   */
  getTokenHistoryByTx(ticker: string, txid: string): Promise<Operation[]> {
    return this.tokens.getHistoryByTx(ticker, txid);
  }

  /**
   * Returns all BRC-20 operations indexed at a given block height (paginated).
   * @param height  - Bitcoin block height
   * @param options - limit, skip
   */
  getHistoryByHeight(
    height: number,
    options?: { limit?: number; skip?: number },
  ): Promise<Operation[]> {
    return this.tokens.getHistoryByHeight(height, options);
  }

  /**
   * Returns ALL BRC-20 operations in a block (no pagination).
   * @param height  - Bitcoin block height
   * @param options - maxResults, includeInvalid
   */
  getAllHistoryByHeight(
    height: number,
    options?: { maxResults?: number; includeInvalid?: boolean },
  ): Promise<Operation[]> {
    return this.tokens.getAllHistoryByHeight(height, options);
  }

  // ---------------------------------------------------------------------------
  // Adresses — variante par ticker
  // ---------------------------------------------------------------------------

  /**
   * Returns the operation history of an address for a specific token.
   * @param address - Bitcoin address
   * @param ticker  - BRC-20 ticker
   * @param options - limit, skip
   */
  getAddressTickerHistory(
    address: string,
    ticker: string,
    options?: ActivityOptions,
  ): Promise<Operation[]> {
    return this.address.getTickerHistory(address, ticker, options);
  }

  // ---------------------------------------------------------------------------
  // Mempool
  // ---------------------------------------------------------------------------

  /**
   * Checks for unconfirmed BRC-20 transfers for an address and ticker.
   *
   * @param address - Bitcoin address
   * @param ticker  - BRC-20 ticker
   *
   * @example
   * const pending = await client.checkPending('bc1p...', 'ORDI');
   * if (pending.hasPendingTransfer) console.log('Unconfirmed transfer detected!');
   */
  checkPending(address: string, ticker: string): Promise<PendingResult> {
    return this.mempool.checkPending(address, ticker);
  }

  // ---------------------------------------------------------------------------
  // Validator
  // ---------------------------------------------------------------------------

  /**
   * Validates a Wrap Mint transaction (W token creation).
   *
   * @param rawTxHex - Raw Bitcoin transaction in hexadecimal
   *
   * @example
   * const result = await client.validateWrapMint('0200000000010001a83c...');
   * if (!result.isValid) console.error(result.reason);
   */
  validateWrapMint(rawTxHex: string): Promise<WrapMintValidationResult> {
    return this.validator.validateWrapMint(rawTxHex);
  }

  /**
   * Validates and reconstructs a Taproot address from a raw transaction.
   *
   * @param rawTxHex - Raw Bitcoin transaction in hexadecimal
   *
   * @example
   * const result = await client.validateAddressFromWitness('0200000000010001a83c...');
   * if (result.isValid) console.log(result.foundAddress);
   */
  validateAddressFromWitness(rawTxHex: string): Promise<AddressValidationResult> {
    return this.validator.validateAddressFromWitness(rawTxHex);
  }

  // ---------------------------------------------------------------------------
  // Wrap (W)
  // ---------------------------------------------------------------------------

  /**
   * Lists wrap contracts with optional filters.
   * @param options - status, owner, limit, offset
   *
   * @example
   * const active = await client.listWrapContracts({ status: 'active' });
   */
  listWrapContracts(options?: ListContractsOptions): Promise<WrapContract[]> {
    return this.wrap.listContracts(options);
  }

  /**
   * Fetches details of a wrap contract by its script address.
   * @param scriptAddress - Taproot address of the contract (bc1p...)
   */
  getWrapContract(scriptAddress: string): Promise<WrapContract> {
    return this.wrap.getContract(scriptAddress);
  }

  /** Returns the TVL (Total Value Locked) of the Wrap module. */
  getWrapTvl(): Promise<WrapTvl> {
    return this.wrap.getTvl();
  }

  /** Returns global metrics for the Wrap module. */
  getWrapMetrics(): Promise<WrapMetrics> {
    return this.wrap.getMetrics();
  }

  // ---------------------------------------------------------------------------
  // Pagination helpers (async generators)
  // ---------------------------------------------------------------------------

  /**
   * Async generator that pages through all tokens, yielding one page at a time.
   *
   * @param pageSize - Number of tokens per page (default: 50)
   *
   * @example
   * for await (const page of client.listTokensPaginated(100)) {
   *   page.forEach(t => console.log(t.ticker));
   * }
   */
  async *listTokensPaginated(pageSize = 50): AsyncGenerator<TokenInfo[]> {
    let skip = 0;
    while (true) {
      const page = await this.tokens.listTokens({ limit: pageSize, skip });
      if (page.length === 0) break;
      yield page;
      if (page.length < pageSize) break;
      skip += pageSize;
    }
  }

  /**
   * Async generator that pages through all holders of a token.
   *
   * @param ticker   - BRC-20 ticker
   * @param pageSize - Number of holders per page (default: 100)
   *
   * @example
   * for await (const page of client.listTokenHoldersPaginated('ORDI')) {
   *   page.forEach(h => console.log(h.address, h.overallBalance));
   * }
   */
  async *listTokenHoldersPaginated(ticker: string, pageSize = 100): AsyncGenerator<AddressBalance[]> {
    let skip = 0;
    while (true) {
      const page = await this.tokens.getHolders(ticker, { limit: pageSize, skip });
      if (page.length === 0) break;
      yield page;
      if (page.length < pageSize) break;
      skip += pageSize;
    }
  }

  /**
   * Async generator that pages through swap positions.
   *
   * @param options  - owner, src, dst, status filters
   * @param pageSize - Number of positions per page (default: 100)
   *
   * @example
   * for await (const page of client.listSwapPositionsPaginated({ status: 'active' })) {
   *   page.forEach(p => console.log(p.id, p.amountLocked));
   * }
   */
  async *listSwapPositionsPaginated(
    options: Omit<ListPositionsOptions, 'limit' | 'offset'> = {},
    pageSize = 100,
  ): AsyncGenerator<SwapPosition[]> {
    let offset = 0;
    while (true) {
      const page = await this.swap.listPositions({ ...options, limit: pageSize, offset });
      if (page.length === 0) break;
      yield page;
      if (page.length < pageSize) break;
      offset += pageSize;
    }
  }
}

