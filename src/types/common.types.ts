/**
 * Types partagés dans tout le SDK.
 */

/** Options de pagination standard pour les endpoints qui en supportent. */
export interface PaginationOptions {
  limit?: number;
  skip?: number;
}

/** Options de filtrage pour les historiques d'opérations BRC-20. */
export interface ActivityOptions extends PaginationOptions {
  /** Filtrer par ticker (ex: "ORDI") */
  ticker?: string;
  /** Filtrer par type d'opération */
  opType?: 'deploy' | 'mint' | 'transfer';
}

/**
 * Wrapper retourné par les endpoints "GET /all" de Simplicity.
 * Ex: /v1/indexer/address/{address}/history/all
 */
export interface RawGetAllResponse<T> {
  data: T[];
  total: number;
}

/**
 * Wrapper retourné par les endpoints paginés (swap principalement).
 * Ex: /v1/indexer/swap/positions
 */
export interface RawListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
