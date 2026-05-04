/**
 * Types relatifs au module Wrap (W) de l'indexeur Simplicity.
 * Le token W est la version wrapped du protocole Universal Protocol.
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawWrapContract {
  contract_id: string;
  /** Ticker du token enveloppé (généralement "W"). */
  ticker: string;
  /** Adresse Taproot du contrat de wrap. */
  taproot_address: string;
  network: string;
  status: 'active' | 'inactive';
  /** Montant total de tokens wrappés (locked dans le contrat). */
  total_wrapped: string;
  /** Montant total de tokens unwrappés (sortis du contrat). */
  total_unwrapped: string;
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/** Contrat de wrap — Taproot address qui lock des tokens pour minter du W. */
export interface WrapContract {
  contractId: string;
  ticker: string;
  taprootAddress: string;
  network: string;
  status: 'active' | 'inactive';
  totalWrapped: string;
  totalUnwrapped: string;
}
