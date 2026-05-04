/**
 * Types relatifs au module Mempool de l'indexeur Simplicity.
 * Permet de vérifier les transferts BRC-20 en attente dans la mempool Bitcoin.
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawPendingTransfer {
  tx_id: string;
  amount: string;
  from_address: string;
  to_address: string;
}

export interface RawPendingResult {
  address: string;
  ticker: string;
  pending_amount: string;
  transfers: RawPendingTransfer[];
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/** Un transfert BRC-20 non confirmé dans la mempool. */
export interface PendingTransfer {
  txId: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
}

/**
 * Résultat de la vérification des transferts en attente pour une adresse
 * et un ticker donné.
 */
export interface PendingResult {
  address: string;
  ticker: string;
  /** Montant total en attente de confirmation. */
  pendingAmount: string;
  /** Liste des transferts non confirmés. */
  transfers: PendingTransfer[];
}
