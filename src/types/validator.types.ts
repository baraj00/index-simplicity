/**
 * Types relatifs au module Validator de l'indexeur Simplicity.
 * Validation des transactions Wrap (W) et des adresses Taproot.
 */

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface ValidateWrapMintRequest {
  /** TXID de la transaction Bitcoin à valider. */
  txid: string;
}

export interface ValidateAddressFromWitnessRequest {
  /** Script witness (Taproot) à valider. */
  witness: string;
}

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawValidationResult {
  valid: boolean;
  message?: string;
  /** Adresse Taproot dérivée du witness (uniquement pour validate-address-from-witness). */
  address?: string;
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/**
 * Résultat d'une validation.
 */
export interface ValidationResult {
  /** `true` si la transaction/adresse est valide selon le protocole. */
  valid: boolean;
  /** Message d'erreur si `valid` est `false`. */
  message?: string;
  /** Adresse Taproot dérivée (uniquement pour validateAddressFromWitness). */
  address?: string;
}
