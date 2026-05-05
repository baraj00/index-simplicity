#!/usr/bin/env node
"use strict";

// mcp/index.ts
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");

// mcp/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");

// src/utils/errors.ts
var UniversalSDKError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UniversalSDKError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var ApiError = class extends UniversalSDKError {
  constructor(statusCode, message) {
    super(`[HTTP ${statusCode}] ${message}`);
    this.statusCode = statusCode;
    this.name = "ApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var NotFoundError = class extends ApiError {
  constructor(resource) {
    super(404, `Resource not found: ${resource}`);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var ConfigError = class extends UniversalSDKError {
  constructor(message) {
    super(`[Config] ${message}`);
    this.name = "ConfigError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};

// src/utils/http.ts
var HttpClient = class {
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 1e4;
    this.maxRetries = options.maxRetries ?? 3;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.apiKey ? { "X-API-Key": options.apiKey } : {}
    };
  }
  /**
   * Perform a GET request and return the parsed JSON.
   *
   * @param path   - Relative path (e.g. /v1/indexer/brc20/list)
   * @param params - Optional query params (undefined/null values are ignored)
   */
  get(path, params) {
    const url = this.buildUrl(path, params);
    return this.withRetry(() => this.fetchJson(url, { method: "GET", headers: this.headers }));
  }
  /**
   * Perform a POST request with a JSON body and return the parsed JSON.
   *
   * @param path - Relative path (e.g. /v1/mempool/check-pending)
   * @param body - Object to serialise as JSON
   */
  post(path, body) {
    const url = this.buildUrl(path);
    return this.withRetry(
      () => this.fetchJson(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body)
      })
    );
  }
  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------
  /** Core fetch with timeout via AbortController. */
  async fetchJson(url, init) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      const error = err;
      const isTimeout = error.name === "AbortError";
      throw new ApiError(
        0,
        isTimeout ? `Request timed out after ${this.timeoutMs}ms (${url})` : `Unable to reach indexer (${url}): ${error.message ?? String(err)}`
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
    const json = await response.json();
    if (json == null) {
      throw new ApiError(response.status, `Empty response body from ${url}`);
    }
    return json;
  }
  /**
   * Retry wrapper with exponential backoff.
   * Only retries on 5xx ApiErrors — 4xx and network errors are not retried.
   */
  async withRetry(fn) {
    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (err instanceof ApiError && err.statusCode >= 500 && attempt < this.maxRetries - 1) {
          const delay = 200 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
  buildUrl(path, params) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0 && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
};

// src/utils/normalize.ts
function normalizeBalance(raw) {
  return {
    address: raw.wallet,
    ticker: raw.ticker,
    overallBalance: raw.overall_balance,
    availableBalance: raw.available_balance,
    blockHeight: raw.block_height
  };
}
function normalizeOp(raw) {
  return {
    id: raw.id,
    txId: raw.tx_id,
    type: raw.op,
    ticker: raw.ticker,
    amount: raw.amount,
    blockHeight: raw.block_height,
    blockHash: raw.block_hash,
    timestamp: raw.timestamp,
    fromAddress: raw.from_address,
    toAddress: raw.to_address,
    valid: raw.valid
  };
}
function normalizeTokenInfo(raw) {
  return {
    ticker: raw.ticker,
    decimals: raw.decimals,
    maxSupply: raw.max_supply,
    limitPerMint: raw.limit_per_mint,
    deployTxId: raw.deploy_tx_id,
    deployBlockHeight: raw.deploy_block_height,
    deployTimestamp: raw.deploy_timestamp,
    creatorAddress: raw.creator_address,
    remainingSupply: raw.remaining_supply,
    minted: raw.minted,
    currentSupply: raw.current_supply,
    circulatingSupply: raw.circulating_supply,
    totalLocked: raw.total_locked,
    holders: raw.holders,
    isCurve: raw.is_curve
  };
}
function normalizeIndexerStatus(raw) {
  return {
    networkBlockHeight: raw.current_block_height_network,
    lastIndexedBlock: raw.last_indexed_block_main_chain,
    lastBrc20OpBlock: raw.last_indexed_brc20_op_block
  };
}
function normalizePool(raw) {
  return {
    poolId: raw.pool_id,
    src: raw.src,
    dst: raw.dst,
    activePositions: raw.active_positions,
    lockedSum: raw.locked_sum,
    nextExpirationHeight: raw.next_expiration_height
  };
}
function normalizeSwapPosition(raw) {
  return {
    id: raw.id,
    owner: raw.owner,
    src: raw.src,
    dst: raw.dst,
    amountLocked: raw.amount_locked,
    lockStartHeight: raw.lock_start_height,
    unlockHeight: raw.unlock_height,
    status: raw.status,
    initOperationId: raw.init_operation_id
  };
}
function normalizeTvlInfo(raw) {
  return {
    ticker: raw.ticker,
    totalLockedPositionsSum: raw.total_locked_positions_sum,
    deployRemainingSupply: raw.deploy_remaining_supply,
    tvlEstimate: raw.tvl_estimate
  };
}
function normalizePendingResult(raw) {
  return {
    address: raw.address,
    ticker: raw.ticker,
    hasPendingTransfer: raw.has_pending_transfer
  };
}
function normalizeWrapMintValidation(raw) {
  return {
    isValid: raw.is_valid,
    reason: raw.reason,
    details: raw.details ? {
      expectedAddress: raw.details.expected_address,
      foundAddress: raw.details.found_address,
      expectedAmountSats: raw.details.expected_amount_sats,
      foundAmountSats: raw.details.found_amount_sats
    } : null
  };
}
function normalizeAddressValidation(raw) {
  return {
    isValid: raw.is_valid,
    reason: raw.reason,
    expectedAddress: raw.expected_address,
    foundAddress: raw.found_address,
    cryptoDetails: raw.crypto_details ? {
      alicePubkeyXonly: raw.crypto_details.alice_pubkey_xonly,
      platformPubkeyXonly: raw.crypto_details.platform_pubkey_xonly,
      internalKeyXonly: raw.crypto_details.internal_key_xonly,
      csvBlocks: raw.crypto_details.csv_blocks,
      multisigScript: raw.crypto_details.multisig_script,
      csvScript: raw.crypto_details.csv_script,
      multisigLeafHash: raw.crypto_details.multisig_leaf_hash,
      csvLeafHash: raw.crypto_details.csv_leaf_hash,
      merkleRoot: raw.crypto_details.merkle_root,
      outputKey: raw.crypto_details.output_key,
      parity: raw.crypto_details.parity
    } : null
  };
}
function normalizeWrapContract(raw) {
  return {
    scriptAddress: raw.script_address,
    initiatorAddress: raw.initiator_address,
    status: raw.status,
    initialAmount: raw.initial_amount,
    timelockDelay: raw.timelock_delay,
    creationHeight: raw.creation_height,
    closureHeight: raw.closure_height
  };
}
function normalizeWrapTvl(raw) {
  return {
    ticker: raw.ticker,
    remainingLocked: raw.remaining_locked
  };
}
function normalizeWrapMetrics(raw) {
  return {
    tvlW: raw.tvl_w,
    activeContracts: raw.active_contracts,
    closedContracts: raw.closed_contracts,
    expiredContracts: raw.expired_contracts
  };
}

// src/services/indexer.service.ts
var IndexerService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Vérifie que l'indexeur est opérationnel.
   * @returns `{ status: "ok" }` si l'API répond correctement.
   */
  async health() {
    return this.http.get("/v1/indexer/brc20/health");
  }
  /**
   * Retourne la hauteur de bloc actuelle du réseau et l'état de sync.
   *
   * Permet de vérifier si l'indexeur est à jour par rapport à la chaîne.
   *
   * @example
   * const s = await client.status();
   * const lag = s.networkBlockHeight - s.lastBrc20OpBlock;
   * console.log(`Retard indexeur : ${lag} blocs`);
   */
  async status() {
    const raw = await this.http.get("/v1/indexer/brc20/status");
    return normalizeIndexerStatus(raw);
  }
};

// src/utils/validate.ts
function assertTicker(ticker, paramName = "ticker") {
  if (!ticker || typeof ticker !== "string" || ticker.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}
function assertAddress(address, paramName = "address") {
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}
function assertPositiveInt(value, paramName) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ConfigError(`'${paramName}' must be a non-negative integer, got: ${value}`);
  }
}
function assertNonEmptyString(value, paramName) {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}

// src/services/token.service.ts
var TokenService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Lists all deployed BRC-20 tokens.
   *
   * @param options - Pagination: limit, skip
   * @returns Array of TokenInfo sorted by deploy order.
   */
  async listTokens(options = {}) {
    const raw = await this.http.get("/v1/indexer/brc20/list", {
      limit: options.limit,
      skip: options.skip
    });
    return raw.map(normalizeTokenInfo);
  }
  /**
   * Récupère les informations détaillées d'un token.
   *
   * @param ticker - Ticker du token (ex: "ORDI", "W") — insensible à la casse
   *
   * @throws NotFoundError si le ticker n'est pas déployé sur le protocole
   *
   * @example
   * const token = await client.getToken('ORDI');
   * console.log(token.holders);       // 12500
   * console.log(token.currentSupply); // "18000000"
   */
  async getToken(ticker) {
    assertTicker(ticker);
    const raw = await this.http.get(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/info`
    );
    return normalizeTokenInfo(raw);
  }
  /**
   * Returns all holders of a token with their balances.
   *
   * @param ticker  - Token ticker
   * @param options - Pagination: limit, skip
   *
   * @example
   * const holders = await client.getTokenHolders('ORDI');
   * // Sorted by balance descending
   */
  async getHolders(ticker, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/holders`,
      { limit: options.limit, skip: options.skip }
    );
    return raw.map(normalizeBalance);
  }
  /**
   * Returns the operation history (deploy, mint, transfer) for a token.
   *
   * @param ticker  - Token ticker
   * @param options - Pagination: limit (default 100), skip (default 0)
   *
   * @example
   * const mints = await client.getTokenHistory('ORDI', { opType: 'mint', limit: 50 });
   */
  async getHistory(ticker, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/history`,
      {
        limit: options.limit,
        skip: options.skip
      }
    );
    return raw.map(normalizeOp);
  }
  /**
   * Retourne TOUS les tokens BRC-20 déployés (sans pagination).
   *
   * À utiliser avec précaution si le nombre de tokens est très grand.
   *
   * @example
   * const all = await client.listAllTokens();
   */
  async listAllTokens() {
    const raw = await this.http.get("/v1/indexer/brc20/list/all");
    return raw.map(normalizeTokenInfo);
  }
  /**
   * Retourne TOUS les détenteurs d'un token (sans pagination).
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const allHolders = await client.getAllTokenHolders('ORDI');
   */
  async getAllHolders(ticker) {
    const raw = await this.http.get(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/holders/all`
    );
    return raw.map(normalizeBalance);
  }
  /**
   * Retourne TOUT l'historique des opérations pour un token (sans pagination).
   *
   * @param ticker  - Ticker du token
   * @param options - Filtres : opType, maxResults, includeInvalid
   *
   * @example
   * const fullHistory = await client.getAllTokenHistory('ORDI');
   */
  async getAllHistory(ticker, options = {}) {
    const raw = await this.http.get(
      "/v1/indexer/brc20/history/all",
      {
        ticker: ticker.toUpperCase(),
        op_type: options.opType,
        max_results: options.maxResults,
        include_invalid: options.includeInvalid
      }
    );
    return raw.data.map(normalizeOp);
  }
  /**
   * Retourne toutes les opérations BRC-20 liées à une transaction Bitcoin spécifique.
   *
   * @param ticker - Ticker du token
   * @param txid   - TXID de la transaction Bitcoin
   *
   * @example
   * const ops = await client.getTokenHistoryByTx('ORDI', 'a1b2c3...');
   */
  async getHistoryByTx(ticker, txid) {
    assertTicker(ticker);
    assertNonEmptyString(txid, "txid");
    const raw = await this.http.get(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/tx/${encodeURIComponent(txid)}/history`
    );
    return raw.map(normalizeOp);
  }
  /**
   * Retourne toutes les opérations BRC-20 indexées à une hauteur de bloc donnée (avec pagination).
   *
   * @param height  - Hauteur du bloc Bitcoin (ex: 840000)
   * @param options - limit, skip
   *
   * @example
   * const ops = await client.getHistoryByHeight(840000);
   */
  async getHistoryByHeight(height, options = {}) {
    assertPositiveInt(height, "height");
    const raw = await this.http.get(
      `/v1/indexer/brc20/history-by-height/${encodeURIComponent(String(height))}`,
      { limit: options.limit, skip: options.skip }
    );
    return raw.map(normalizeOp);
  }
  /**
   * Retourne TOUTES les opérations BRC-20 d'un bloc (sans pagination).
   *
   * @param height  - Hauteur du bloc Bitcoin
   * @param options - maxResults, includeInvalid
   *
   * @example
   * const all = await client.getAllHistoryByHeight(840000);
   */
  async getAllHistoryByHeight(height, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/brc20/history-by-height/${encodeURIComponent(String(height))}/all`,
      { max_results: options.maxResults, include_invalid: options.includeInvalid }
    );
    return raw.data.map(normalizeOp);
  }
};

// src/services/address.service.ts
var AddressService = class {
  constructor(http) {
    this.http = http;
  }
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
  async getBalance(address, ticker) {
    assertAddress(address);
    assertTicker(ticker);
    const raw = await this.http.get(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/info`
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
  async getTokens(address) {
    const historyResponse = await this.http.get(
      `/v1/indexer/address/${encodeURIComponent(address)}/history/all`
    );
    const tickers = [...new Set(historyResponse.data.map((op) => op.ticker))];
    const CHUNK = 10;
    const settled = [];
    for (let i = 0; i < tickers.length; i += CHUNK) {
      const chunk = tickers.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        chunk.map((ticker) => this.getBalance(address, ticker))
      );
      settled.push(...results);
    }
    return settled.filter(
      (r) => r.status === "fulfilled" && parseFloat(r.value.overallBalance) > 0
    ).map((r) => r.value);
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
  async getActivity(address, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/address/${encodeURIComponent(address)}/history`,
      {
        ticker: options.ticker,
        op_type: options.opType,
        limit: options.limit
      }
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
  async getTickerHistory(address, ticker, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/history`,
      {
        limit: options.limit,
        skip: options.skip
      }
    );
    return raw.map(normalizeOp);
  }
};

// src/services/swap.service.ts
var SwapService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Liste tous les pools de swap disponibles.
   *
   * @param options - Filtrer par src et/ou dst ticker
   *
   * @example
   * const pools = await client.listPools({ src: 'LOL' });
   */
  async listPools(options = {}) {
    const raw = await this.http.get(
      "/v1/indexer/swap/pools",
      { src: options.src, dst: options.dst }
    );
    const items = Array.isArray(raw) ? raw : raw.items;
    return items.map(normalizePool);
  }
  /**
   * Retourne la TVL (Total Value Locked) d'un token dans le module Swap.
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const tvl = await client.getSwapTvl('LOL');
   * console.log(tvl.tvlEstimate); // "1111111.11000000"
   */
  async getTvl(ticker) {
    assertTicker(ticker);
    const raw = await this.http.get(
      `/v1/indexer/swap/tvl/${encodeURIComponent(ticker.toUpperCase())}`
    );
    return normalizeTvlInfo(raw);
  }
  /**
   * Liste les positions de swap avec filtres optionnels.
   *
   * @param options - Filtres : owner, src, dst, status, limit, offset
   *
   * @example
   * // Toutes les positions actives du pool LOL-WTF
   * const positions = await client.listSwapPositions({
   *   src: 'LOL', dst: 'WTF', status: 'active'
   * });
   */
  async listPositions(options = {}) {
    const raw = await this.http.get(
      "/v1/indexer/swap/positions",
      {
        owner: options.owner,
        src: options.src,
        dst: options.dst,
        status: options.status,
        limit: options.limit,
        offset: options.offset
      }
    );
    return raw.items.map(normalizeSwapPosition);
  }
  /**
   * Récupère une position de swap par son identifiant unique.
   *
   * @param id - Identifiant numérique de la position
   *
   * @throws NotFoundError si la position n'existe pas
   *
   * @example
   * const position = await client.getSwapPosition(42);
   * console.log(position.status); // 'active' | 'completed' | 'expired'
   */
  async getPosition(id) {
    assertPositiveInt(id, "id");
    const raw = await this.http.get(
      `/v1/indexer/swap/positions/${encodeURIComponent(String(id))}`
    );
    return normalizeSwapPosition(raw);
  }
  /**
   * Retourne les positions de swap qui expirent à une hauteur de bloc donnée ou avant.
   *
   * @param heightLte - Hauteur de bloc maximale pour l'expiration (REQUIS)
   * @param options   - Pagination : limit, offset
   *
   * @example
   * // Positions qui expirent au prochain bloc ou avant
   * const expiring = await client.getExpiringSwapPositions(895000, { limit: 20 });
   * expiring.forEach(p => console.log(`Expire bloc #${p.unlockHeight}`));
   */
  async getExpiringPositions(heightLte, options = {}) {
    assertPositiveInt(heightLte, "heightLte");
    const raw = await this.http.get(
      "/v1/indexer/swap/expiring",
      { height_lte: heightLte, limit: options.limit, offset: options.offset }
    );
    return raw.items.map(normalizeSwapPosition);
  }
  /**
   * Liste toutes les positions de swap d'une adresse.
   *
   * @param owner   - Adresse Bitcoin du propriétaire
   * @param options - Filtres : status, limit, offset
   *
   * @example
   * const myPositions = await client.getOwnerSwapPositions('bc1p...');
   * const active = myPositions.filter(p => p.status === 'active');
   */
  async getOwnerPositions(owner, options = {}) {
    const raw = await this.http.get(
      `/v1/indexer/swap/owner/${encodeURIComponent(owner)}/positions`,
      {
        status: options.status,
        limit: options.limit,
        offset: options.offset
      }
    );
    return raw.items.map(normalizeSwapPosition);
  }
};

// src/services/mempool.service.ts
var MempoolService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Vérifie si une adresse a des transferts BRC-20 non confirmés pour un ticker.
   *
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token BRC-20
   *
   * @example
   * const result = await client.checkPending('bc1p...', 'ORDI');
   * if (result.hasPendingTransfer) {
   *   console.log('Transfert en attente d\'ORDI détecté !');
   * }
   */
  async checkPending(address, ticker) {
    const raw = await this.http.post("/v1/mempool/check-pending", {
      address,
      ticker: ticker.toUpperCase()
    });
    return normalizePendingResult(raw);
  }
};

// src/services/validator.service.ts
var ValidatorService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Valide une transaction de Wrap Mint (création de token W).
   *
   * @param rawTxHex - Transaction Bitcoin brute en hexadécimal
   *
   * @example
   * const result = await client.validateWrapMint('0200000000010001a83c...');
   * if (!result.isValid) console.error('Invalide:', result.reason);
   */
  async validateWrapMint(rawTxHex) {
    const body = { raw_tx_hex: rawTxHex };
    const raw = await this.http.post(
      "/v1/validator/validate-wrap-mint",
      body
    );
    return normalizeWrapMintValidation(raw);
  }
  /**
   * Valide et recalcule une adresse Taproot à partir d'une transaction brute.
   *
   * @param rawTxHex - Transaction Bitcoin brute en hexadécimal
   *
   * @example
   * const result = await client.validateAddressFromWitness('0200000000010001a83c...');
   * if (result.isValid) console.log('Adresse:', result.foundAddress);
   */
  async validateAddressFromWitness(rawTxHex) {
    const body = { raw_tx_hex: rawTxHex };
    const raw = await this.http.post(
      "/v1/validator/validate-address-from-witness",
      body
    );
    return normalizeAddressValidation(raw);
  }
};

// src/services/wrap.service.ts
var WrapService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Retourne la liste des contrats de wrap avec filtres optionnels.
   *
   * @param options - Filtres : status, owner, limit, offset
   *
   * @example
   * const actifs = await client.listWrapContracts({ status: 'active' });
   * console.log(`${actifs.length} contrats actifs`);
   */
  async listContracts(options = {}) {
    const raw = await this.http.get("/v1/indexer/w/contracts", {
      status: options.status,
      owner: options.owner,
      limit: options.limit,
      offset: options.offset
    });
    return raw.items.map(normalizeWrapContract);
  }
  /**
   * Récupère les détails d'un contrat de wrap par son adresse script.
   *
   * @param scriptAddress - Adresse Taproot du contrat (bc1p...)
   *
   * @throws NotFoundError si le contrat n'existe pas
   *
   * @example
   * const contract = await client.getWrapContract('bc1p...');
   * console.log(contract.status); // 'active'
   */
  async getContract(scriptAddress) {
    const raw = await this.http.get(
      `/v1/indexer/w/contracts/${encodeURIComponent(scriptAddress)}`
    );
    return normalizeWrapContract(raw);
  }
  /**
   * Retourne la TVL (Total Value Locked) du module Wrap.
   *
   * @example
   * const tvl = await client.getWrapTvl();
   * console.log(`${tvl.remainingLocked} W verrouillés`);
   */
  async getTvl() {
    const raw = await this.http.get("/v1/indexer/w/tvl");
    return normalizeWrapTvl(raw);
  }
  /**
   * Retourne les métriques globales du module Wrap.
   *
   * @example
   * const metrics = await client.getWrapMetrics();
   * console.log(`TVL: ${metrics.tvlW} W, contrats actifs: ${metrics.activeContracts}`);
   */
  async getMetrics() {
    const raw = await this.http.get("/v1/indexer/w/metrics");
    return normalizeWrapMetrics(raw);
  }
};

// src/client.ts
var UniversalClient = class {
  constructor(options = {}) {
    const http = new HttpClient({
      baseUrl: options.baseUrl ?? "http://localhost:8080",
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs,
      maxRetries: options.maxRetries
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
  health() {
    return this.indexer.health();
  }
  /**
   * Returns the sync state of the indexer.
   * Useful to check if the indexer is up to date with the Bitcoin network.
   */
  status() {
    return this.indexer.status();
  }
  // ---------------------------------------------------------------------------
  // Tokens BRC-20
  // ---------------------------------------------------------------------------
  /** Lists all deployed BRC-20 tokens on the Universal Protocol.
   * @param options - Pagination: limit, skip
   */
  listTokens(options) {
    return this.tokens.listTokens(options);
  }
  /**
   * Fetches detailed information about a BRC-20 token (supply, holders, deploy info...).
   * @param ticker - e.g. "ORDI", "W" (case-insensitive)
   */
  getToken(ticker) {
    return this.tokens.getToken(ticker);
  }
  /**
   * Returns all holders of a token with their balances.
   * @param ticker  - e.g. \"ORDI\"
   * @param options - Pagination: limit, skip
   */
  getTokenHolders(ticker, options) {
    return this.tokens.getHolders(ticker, options);
  }
  /**
   * Returns the operation history for a token (deploy, mint, transfer).
   * @param ticker  - e.g. "ORDI"
   * @param options - Filters: opType, limit, skip
   */
  getTokenHistory(ticker, options) {
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
  getBalance(address, ticker) {
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
  getTokens(address) {
    return this.address.getTokens(address);
  }
  /**
   * Returns the BRC-20 operation history of an address.
   * @param address - Bitcoin address
   * @param options - Filters: ticker, opType, limit
   */
  getActivity(address, options) {
    return this.address.getActivity(address, options);
  }
  // ---------------------------------------------------------------------------
  // Swap
  // ---------------------------------------------------------------------------
  /**
   * Lists available swap pools.
   * @param options - Filter by src and/or dst ticker
   */
  listPools(options) {
    return this.swap.listPools(options);
  }
  /**
   * Returns the TVL (Total Value Locked) of a token in the Swap module.
   * @param ticker - Token ticker
   */
  getSwapTvl(ticker) {
    return this.swap.getTvl(ticker);
  }
  /**
   * Lists swap positions with optional filters.
   * @param options - owner, src, dst, status, limit, offset
   */
  listSwapPositions(options) {
    return this.swap.listPositions(options);
  }
  /**
   * Returns all swap positions for an address.
   * @param owner   - Bitcoin address
   * @param options - status, limit, offset
   */
  getOwnerSwapPositions(owner, options) {
    return this.swap.getOwnerPositions(owner, options);
  }
  /**
   * Fetches a swap position by its unique identifier.
   * @param id - Numeric position ID
   */
  getSwapPosition(id) {
    return this.swap.getPosition(id);
  }
  /**
   * Returns swap positions expiring at or before a given block height.
   * @param heightLte - Maximum block height (REQUIRED)
   * @param options   - limit, offset
   */
  getExpiringSwapPositions(heightLte, options) {
    return this.swap.getExpiringPositions(heightLte, options);
  }
  // ---------------------------------------------------------------------------
  // Tokens — variantes /all, /tx/{txid}/history, /history-by-height
  // ---------------------------------------------------------------------------
  /**
   * Returns ALL deployed BRC-20 tokens (no pagination).
   * For large lists, prefer `listTokens()` with pagination.
   */
  listAllTokens() {
    return this.tokens.listAllTokens();
  }
  /**
   * Returns ALL holders of a token (no pagination).
   * @param ticker - Token ticker
   */
  getAllTokenHolders(ticker) {
    return this.tokens.getAllHolders(ticker);
  }
  /**
   * Returns the FULL history of a token (no pagination).
   * @param ticker  - Token ticker
   * @param options - opType, maxResults, includeInvalid
   */
  getAllTokenHistory(ticker, options) {
    return this.tokens.getAllHistory(ticker, options);
  }
  /**
   * Returns BRC-20 operations linked to a specific Bitcoin transaction.
   * @param ticker - Token ticker
   * @param txid   - Transaction TXID
   */
  getTokenHistoryByTx(ticker, txid) {
    return this.tokens.getHistoryByTx(ticker, txid);
  }
  /**
   * Returns all BRC-20 operations indexed at a given block height (paginated).
   * @param height  - Bitcoin block height
   * @param options - limit, skip
   */
  getHistoryByHeight(height, options) {
    return this.tokens.getHistoryByHeight(height, options);
  }
  /**
   * Returns ALL BRC-20 operations in a block (no pagination).
   * @param height  - Bitcoin block height
   * @param options - maxResults, includeInvalid
   */
  getAllHistoryByHeight(height, options) {
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
  getAddressTickerHistory(address, ticker, options) {
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
  checkPending(address, ticker) {
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
  validateWrapMint(rawTxHex) {
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
  validateAddressFromWitness(rawTxHex) {
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
  listWrapContracts(options) {
    return this.wrap.listContracts(options);
  }
  /**
   * Fetches details of a wrap contract by its script address.
   * @param scriptAddress - Taproot address of the contract (bc1p...)
   */
  getWrapContract(scriptAddress) {
    return this.wrap.getContract(scriptAddress);
  }
  /** Returns the TVL (Total Value Locked) of the Wrap module. */
  getWrapTvl() {
    return this.wrap.getTvl();
  }
  /** Returns global metrics for the Wrap module. */
  getWrapMetrics() {
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
  async *listTokensPaginated(pageSize = 50) {
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
  async *listTokenHoldersPaginated(ticker, pageSize = 100) {
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
  async *listSwapPositionsPaginated(options = {}, pageSize = 100) {
    let offset = 0;
    while (true) {
      const page = await this.swap.listPositions({ ...options, limit: pageSize, offset });
      if (page.length === 0) break;
      yield page;
      if (page.length < pageSize) break;
      offset += pageSize;
    }
  }
};

// mcp/utils.ts
function ok(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
  };
}
function fail(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: msg }],
    isError: true
  };
}

// mcp/tools/indexer.tools.ts
function registerIndexerTools(server, client) {
  server.tool(
    "health",
    'Check if the Simplicity indexer is operational. Returns { status: "ok" } when healthy.',
    {},
    async () => {
      try {
        return ok(await client.health());
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "status",
    "Get the sync state of the Simplicity indexer: current network block height vs the last indexed block.",
    {},
    async () => {
      try {
        return ok(await client.status());
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/tools/token.tools.ts
var import_zod = require("zod");
function registerTokenTools(server, client) {
  server.tool(
    "list_tokens",
    "List deployed BRC-20 tokens on the Universal Protocol.",
    {
      limit: import_zod.z.number().int().min(1).max(1e3).optional().describe("Max tokens to return"),
      skip: import_zod.z.number().int().min(0).optional().describe("Tokens to skip (pagination)")
    },
    async ({ limit, skip }) => {
      try {
        return ok(await client.listTokens({ limit, skip }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_token",
    "Get detailed information about a BRC-20 token: supply, holders, deploy block, curve flag.",
    {
      ticker: import_zod.z.string().min(1).describe('BRC-20 ticker symbol, e.g. "ORDI" or "W"')
    },
    async ({ ticker }) => {
      try {
        return ok(await client.getToken(ticker));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_token_holders",
    "List all holders of a BRC-20 token with their balances, sorted by balance descending.",
    {
      ticker: import_zod.z.string().min(1).describe("BRC-20 ticker symbol"),
      limit: import_zod.z.number().int().min(1).max(1e3).optional().describe("Max holders to return"),
      skip: import_zod.z.number().int().min(0).optional().describe("Holders to skip (pagination)")
    },
    async ({ ticker, limit, skip }) => {
      try {
        return ok(await client.getTokenHolders(ticker, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_token_history",
    "Get the operation history (deploy, mint, transfer) for a BRC-20 token.",
    {
      ticker: import_zod.z.string().min(1).describe("BRC-20 ticker symbol"),
      op_type: import_zod.z.enum(["deploy", "mint", "transfer"]).optional().describe("Filter by operation type"),
      limit: import_zod.z.number().int().min(1).max(1e3).optional().describe("Max operations to return"),
      skip: import_zod.z.number().int().min(0).optional().describe("Operations to skip (pagination)")
    },
    async ({ ticker, op_type, limit, skip }) => {
      try {
        return ok(await client.getTokenHistory(ticker, { opType: op_type, limit, skip }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_token_history_by_tx",
    "Get BRC-20 operations linked to a specific Bitcoin transaction ID.",
    {
      ticker: import_zod.z.string().min(1).describe("BRC-20 ticker symbol"),
      txid: import_zod.z.string().min(1).describe("Bitcoin transaction ID (TXID or wtxid)")
    },
    async ({ ticker, txid }) => {
      try {
        return ok(await client.getTokenHistoryByTx(ticker, txid));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_history_by_height",
    "Get all BRC-20 operations indexed at a specific Bitcoin block height.",
    {
      height: import_zod.z.number().int().min(0).describe("Bitcoin block height"),
      limit: import_zod.z.number().int().min(1).max(1e3).optional().describe("Max operations to return"),
      skip: import_zod.z.number().int().min(0).optional().describe("Operations to skip (pagination)")
    },
    async ({ height, limit, skip }) => {
      try {
        return ok(await client.getHistoryByHeight(height, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/tools/address.tools.ts
var import_zod2 = require("zod");
function registerAddressTools(server, client) {
  server.tool(
    "get_balance",
    "Get the BRC-20 token balance for a Bitcoin address. Returns overallBalance and availableBalance.",
    {
      address: import_zod2.z.string().min(1).describe("Bitcoin address (bc1p, bc1q, tb1, 1..., 3...)"),
      ticker: import_zod2.z.string().min(1).describe("BRC-20 ticker symbol")
    },
    async ({ address, ticker }) => {
      try {
        return ok(await client.getBalance(address, ticker));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_tokens",
    "Get all BRC-20 tokens held by a Bitcoin address (only tokens with balance > 0).",
    {
      address: import_zod2.z.string().min(1).describe("Bitcoin address")
    },
    async ({ address }) => {
      try {
        return ok(await client.getTokens(address));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_activity",
    "Get the BRC-20 operation history for a Bitcoin address (as sender or receiver).",
    {
      address: import_zod2.z.string().min(1).describe("Bitcoin address"),
      ticker: import_zod2.z.string().min(1).optional().describe("Filter by BRC-20 ticker"),
      op_type: import_zod2.z.enum(["deploy", "mint", "transfer"]).optional().describe("Filter by operation type"),
      limit: import_zod2.z.number().int().min(1).max(1e3).optional().describe("Max operations to return")
    },
    async ({ address, ticker, op_type, limit }) => {
      try {
        return ok(await client.getActivity(address, { ticker, opType: op_type, limit }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_address_ticker_history",
    "Get the operation history of a Bitcoin address scoped to a single BRC-20 token.",
    {
      address: import_zod2.z.string().min(1).describe("Bitcoin address"),
      ticker: import_zod2.z.string().min(1).describe("BRC-20 ticker symbol"),
      limit: import_zod2.z.number().int().min(1).max(1e3).optional().describe("Max operations to return"),
      skip: import_zod2.z.number().int().min(0).optional().describe("Operations to skip (pagination)")
    },
    async ({ address, ticker, limit, skip }) => {
      try {
        return ok(await client.getAddressTickerHistory(address, ticker, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "check_pending",
    "Check if a Bitcoin address has pending (unconfirmed mempool) BRC-20 transfers for a ticker.",
    {
      address: import_zod2.z.string().min(1).describe("Bitcoin address"),
      ticker: import_zod2.z.string().min(1).describe("BRC-20 ticker symbol")
    },
    async ({ address, ticker }) => {
      try {
        return ok(await client.checkPending(address, ticker));
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/tools/swap.tools.ts
var import_zod3 = require("zod");
function registerSwapTools(server, client) {
  server.tool(
    "list_pools",
    "List all active swap pools on the Universal Protocol. Optionally filter by source or destination token.",
    {
      src: import_zod3.z.string().min(1).optional().describe("Filter by source token ticker"),
      dst: import_zod3.z.string().min(1).optional().describe("Filter by destination token ticker")
    },
    async ({ src, dst }) => {
      try {
        return ok(await client.listPools({ src, dst }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_swap_tvl",
    "Get the Total Value Locked (TVL) for a specific token in the swap module.",
    {
      ticker: import_zod3.z.string().min(1).describe("BRC-20 ticker symbol")
    },
    async ({ ticker }) => {
      try {
        return ok(await client.getSwapTvl(ticker));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "list_swap_positions",
    "List swap positions with optional filters for owner, tokens, status, and pagination.",
    {
      owner: import_zod3.z.string().min(1).optional().describe("Filter by owner Bitcoin address"),
      src: import_zod3.z.string().min(1).optional().describe("Filter by source token ticker"),
      dst: import_zod3.z.string().min(1).optional().describe("Filter by destination token ticker"),
      status: import_zod3.z.enum(["active", "completed", "expired"]).optional().describe("Filter by position status"),
      limit: import_zod3.z.number().int().min(1).max(1e3).optional().describe("Max positions to return"),
      offset: import_zod3.z.number().int().min(0).optional().describe("Positions to skip (pagination)")
    },
    async ({ owner, src, dst, status, limit, offset }) => {
      try {
        return ok(await client.listSwapPositions({ owner, src, dst, status, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_owner_swap_positions",
    "Get all swap positions belonging to a specific Bitcoin address.",
    {
      owner: import_zod3.z.string().min(1).describe("Bitcoin address of the position owner"),
      status: import_zod3.z.enum(["active", "completed", "expired"]).optional().describe("Filter by position status"),
      limit: import_zod3.z.number().int().min(1).max(1e3).optional().describe("Max positions to return"),
      offset: import_zod3.z.number().int().min(0).optional().describe("Positions to skip (pagination)")
    },
    async ({ owner, status, limit, offset }) => {
      try {
        return ok(await client.getOwnerSwapPositions(owner, { status, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_swap_position",
    "Get a specific swap position by its unique numeric ID.",
    {
      id: import_zod3.z.number().int().min(0).describe("Numeric position ID")
    },
    async ({ id }) => {
      try {
        return ok(await client.getSwapPosition(id));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_expiring_swap_positions",
    "Get swap positions that expire at or before a given Bitcoin block height.",
    {
      height_lte: import_zod3.z.number().int().min(0).describe("Maximum block height (inclusive) \u2014 positions expiring at or before this block"),
      limit: import_zod3.z.number().int().min(1).max(1e3).optional().describe("Max positions to return"),
      offset: import_zod3.z.number().int().min(0).optional().describe("Positions to skip (pagination)")
    },
    async ({ height_lte, limit, offset }) => {
      try {
        return ok(await client.getExpiringSwapPositions(height_lte, { limit, offset }));
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/tools/wrap.tools.ts
var import_zod4 = require("zod");
function registerWrapTools(server, client) {
  server.tool(
    "list_wrap_contracts",
    "List Wrap (W token) contracts with optional filters for status, owner, and pagination.",
    {
      status: import_zod4.z.string().min(1).optional().describe('Filter by contract status (e.g. "active", "closed", "expired")'),
      owner: import_zod4.z.string().min(1).optional().describe("Filter by initiator Bitcoin address"),
      limit: import_zod4.z.number().int().min(1).max(1e3).optional().describe("Max contracts to return"),
      offset: import_zod4.z.number().int().min(0).optional().describe("Contracts to skip (pagination)")
    },
    async ({ status, owner, limit, offset }) => {
      try {
        return ok(await client.listWrapContracts({ status, owner, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_wrap_contract",
    "Get details of a specific Wrap contract by its Taproot script address.",
    {
      script_address: import_zod4.z.string().min(1).describe("Taproot script address of the wrap contract (bc1p...)")
    },
    async ({ script_address }) => {
      try {
        return ok(await client.getWrapContract(script_address));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_wrap_tvl",
    "Get the Total Value Locked (TVL) for the Wrap module (native W token).",
    {},
    async () => {
      try {
        return ok(await client.getWrapTvl());
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "get_wrap_metrics",
    "Get global metrics for the Wrap module: active contracts count, total TVL, closed and expired counts.",
    {},
    async () => {
      try {
        return ok(await client.getWrapMetrics());
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/tools/validator.tools.ts
var import_zod5 = require("zod");
function registerValidatorTools(server, client) {
  server.tool(
    "validate_wrap_mint",
    "Validate a Wrap Mint transaction (W token creation) against Universal Protocol rules. Returns isValid and a reason code.",
    {
      raw_tx_hex: import_zod5.z.string().min(1).describe("Raw Bitcoin transaction in hexadecimal format")
    },
    async ({ raw_tx_hex }) => {
      try {
        return ok(await client.validateWrapMint(raw_tx_hex));
      } catch (err) {
        return fail(err);
      }
    }
  );
  server.tool(
    "validate_address_from_witness",
    "Reconstruct and validate a Taproot address from the witness data of a raw Bitcoin transaction.",
    {
      raw_tx_hex: import_zod5.z.string().min(1).describe("Raw Bitcoin transaction in hexadecimal format")
    },
    async ({ raw_tx_hex }) => {
      try {
        return ok(await client.validateAddressFromWitness(raw_tx_hex));
      } catch (err) {
        return fail(err);
      }
    }
  );
}

// mcp/server.ts
function createMcpServer() {
  const client = new UniversalClient({
    baseUrl: process.env["INDEXER_URL"] ?? "http://localhost:8080",
    apiKey: process.env["INDEXER_API_KEY"],
    timeoutMs: process.env["INDEXER_TIMEOUT_MS"] ? parseInt(process.env["INDEXER_TIMEOUT_MS"], 10) : void 0,
    maxRetries: process.env["INDEXER_MAX_RETRIES"] ? parseInt(process.env["INDEXER_MAX_RETRIES"], 10) : void 0
  });
  const server = new import_mcp.McpServer({ name: "universal-protocol-mcp", version: "0.2.0" });
  registerIndexerTools(server, client);
  registerTokenTools(server, client);
  registerAddressTools(server, client);
  registerSwapTools(server, client);
  registerWrapTools(server, client);
  registerValidatorTools(server, client);
  return server;
}

// mcp/index.ts
(async () => {
  const server = createMcpServer();
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[universal-protocol-mcp] Server running on stdio\n");
})();
