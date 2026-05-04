/**
 * Types relatifs au module Swap de l'indexeur Simplicity.
 * Basés sur openapi.yaml (SwapQuoteResponse, SwapPositionItem, PoolReservesResponse, TvlResponse).
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

/**
 * Pool de swap dans Simplicity.
 * Le swap Universal Protocol est un système de positions verrouillées
 * (intent-based), PAS un AMM traditionnel avec réserves.
 */
export interface RawPool {
  pool_id: string;               // ex: "LOL-WTF"
  src: string;                   // ticker source
  dst: string;                   // ticker destination
  active_positions: number;      // nombre de positions actives
  locked_sum: string;            // montant total verrouillé
  next_expiration_height: number | null;  // prochain bloc d'expiration
}

export interface RawSwapPosition {
  id: number;
  owner: string;
  src: string;                   // ticker du token vendu
  dst: string;                   // ticker du token attendu
  amount_locked: string;
  lock_start_height: number;     // hauteur du bloc de verrouillage
  unlock_height: number;         // hauteur du bloc de déverrouillage
  status: 'active' | 'completed' | 'expired';
  init_operation_id: number | null;
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

/** Pool de swap (groupement de positions src→dst). */
export interface Pool {
  poolId: string;                    // ex: "LOL-WTF"
  src: string;                       // ticker source
  dst: string;                       // ticker destination
  activePositions: number;           // nombre de positions actives
  lockedSum: string;                 // montant total verrouillé
  nextExpirationHeight: number | null;
}

/** Position de swap (swap.init) verrouillée en attente d'exécution. */
export interface SwapPosition {
  id: number;
  owner: string;
  src: string;                       // ticker du token vendu
  dst: string;                       // ticker du token attendu
  amountLocked: string;
  lockStartHeight: number;
  unlockHeight: number;
  status: 'active' | 'completed' | 'expired';
  initOperationId: number | null;
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
  status?: 'active' | 'completed' | 'expired';
  limit?: number;
  offset?: number;
}
