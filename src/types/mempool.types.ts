/**
 * Types relatifs au module Mempool de l'indexeur Simplicity.
 * Permet de vérifier les transferts BRC-20 en attente dans la mempool Bitcoin.
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawPendingResult {
  address: string;
  ticker: string;
  has_pending_transfer: boolean;
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/**
 * Résultat de la vérification des transferts en attente pour une adresse
 * et un ticker donné.
 */
export interface PendingResult {
  address: string;
  ticker: string;
  /** `true` si l'adresse a au moins un transfert BRC-20 non confirmé pour ce ticker. */
  hasPendingTransfer: boolean;
}
