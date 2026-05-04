/**
 * Types relatifs aux tokens BRC-20 et aux opérations on-chain.
 * Basés sur les schémas de l'API Simplicity Indexer (openapi.yaml).
 */

// ---------------------------------------------------------------------------
// Shapes brutes (API)
// ---------------------------------------------------------------------------

/**
 * Réponse brute de l'endpoint :
 *   GET /v1/indexer/brc20/{ticker}/info
 *   GET /v1/indexer/brc20/list  (tableau de ces objets)
 */
export interface RawTokenInfo {
  ticker: string;
  decimals: number;
  max_supply: string;
  limit_per_mint: string;
  actual_deploy_txid_for_api: string;
  deploy_tx_id: string;
  deploy_block_height: number;
  deploy_timestamp: string;    // ISO 8601
  creator_address: string;
  remaining_supply: string;
  current_supply: string;
  holders: number;
}

/**
 * Réponse brute d'une opération BRC-20 (deploy / mint / transfer).
 * Retournée par les endpoints /history.
 */
export interface RawOp {
  id: number;
  tx_id: string;        // wtxid
  txid: string | null;  // txid classique
  op: 'deploy' | 'mint' | 'transfer';
  ticker: string;
  amount: string | null;
  block_height: number;
  block_hash: string;
  tx_index: number;
  timestamp: string;         // ISO 8601
  from_address: string | null;
  to_address: string | null;
  valid: boolean;
}

/**
 * Réponse brute du endpoint :
 *   GET /v1/indexer/brc20/status
 */
export interface RawIndexerStatus {
  current_block_height_network: number;
  last_indexed_block_main_chain: number;
  last_indexed_brc20_op_block: number;
}

// ---------------------------------------------------------------------------
// Shapes normalisées (SDK)
// ---------------------------------------------------------------------------

/** Informations complètes sur un token BRC-20 déployé. */
export interface TokenInfo {
  ticker: string;
  decimals: number;
  maxSupply: string;
  limitPerMint: string;
  deployTxId: string;
  deployBlockHeight: number;
  deployTimestamp: string;
  creatorAddress: string;
  remainingSupply: string;
  currentSupply: string;
  holders: number;
}

/** Une opération BRC-20 (deploy, mint, transfer). */
export interface Operation {
  id: number;
  txId: string;
  type: 'deploy' | 'mint' | 'transfer';
  ticker: string;
  amount: string | null;
  blockHeight: number;
  blockHash: string;
  timestamp: string;
  fromAddress: string | null;
  toAddress: string | null;
  valid: boolean;
}

/** Statut de synchronisation de l'indexeur. */
export interface IndexerStatus {
  networkBlockHeight: number;
  lastIndexedBlock: number;
  lastBrc20OpBlock: number;
}
