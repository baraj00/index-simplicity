/**
 * Types relatifs au module Swap de l'indexeur Simplicity.
 * Basés sur openapi.yaml (SwapQuoteResponse, SwapPositionItem, PoolReservesResponse, TvlResponse).
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawPool {
  pool_id: string;
  token_a: string;
  token_b: string;
  reserve_a: string;
  reserve_b: string;
  last_updated_height: number | null;
}

export interface RawSwapQuote {
  src_ticker: string;
  dst_ticker: string;
  amount_in: string;
  amount_out: string;
  slippage_percent: string;
  expected_rate: string;
  actual_rate: string;
  is_partial_fill: boolean;
  protocol_fee: string;
  pool_id: string;
  reserve_in_before: string;
  reserve_out_before: string;
  reserve_in_after: string;
  reserve_out_after: string;
  k_constant: string;
  price_impact: string;
  price_impact_percent: string;
}

export interface RawSwapPosition {
  id: number;
  owner: string;
  pool_id: string;
  src_ticker: string;
  dst_ticker: string;
  amount_locked: string;
  status: 'active' | 'expired' | 'closed';
  unlock_height: number;
  tx_id: string;
  block_height: number;
  timestamp: string;
}

export interface RawTvlInfo {
  ticker: string;
  total_locked_positions_sum: string;
  deploy_remaining_supply: string;
  tvl_estimate: string;
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/** Pool de swap avec ses réserves actuelles. */
export interface Pool {
  poolId: string;           // ex: "LOL-WTF"
  tokenA: string;           // ex: "LOL"
  tokenB: string;           // ex: "WTF"
  reserveA: string;         // réserve du token A en unités décimales
  reserveB: string;         // réserve du token B en unités décimales
  lastUpdatedHeight: number | null;
}

/** Résultat d'une simulation de swap (sans exécution on-chain). */
export interface SwapQuote {
  srcTicker: string;
  dstTicker: string;
  amountIn: string;          // montant réellement utilisé
  amountOut: string;         // montant exact attendu en output
  poolId: string;
  expectedRate: string;      // taux spot avant swap
  actualRate: string;        // taux réel à l'exécution
  slippagePercent: string;
  priceImpactPercent: string;
  protocolFee: string;       // 0.3% du montant de sortie
  isPartialFill: boolean;    // true si le slippage dépasse la tolérance
}

/** Position de swap (swap.init) en attente d'exécution ou clôturée. */
export interface SwapPosition {
  id: number;
  owner: string;
  poolId: string;
  srcTicker: string;
  dstTicker: string;
  amountLocked: string;
  status: 'active' | 'expired' | 'closed';
  unlockHeight: number;
  txId: string;
  blockHeight: number;
  timestamp: string;
}

/** Total Value Locked pour un token dans le module Swap. */
export interface TvlInfo {
  ticker: string;
  totalLockedPositionsSum: string;
  deployRemainingSupply: string;
  tvlEstimate: string;
}

// ---------------------------------------------------------------------------
// Options de requête
// ---------------------------------------------------------------------------

export interface ListPoolsOptions {
  src?: string;
  dst?: string;
}

export interface ListPositionsOptions {
  owner?: string;
  src?: string;
  dst?: string;
  status?: 'active' | 'expired' | 'closed';
  limit?: number;
  offset?: number;
}
