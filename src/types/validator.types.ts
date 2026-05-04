/**
 * Types relatifs au module Validator de l'indexeur Simplicity.
 * Validation des transactions Wrap (W) et des adresses Taproot.
 */

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface ValidateWrapMintRequest {
  /** Transaction Bitcoin brute en hexadécimal. */
  raw_tx_hex: string;
}

export interface ValidateAddressFromWitnessRequest {
  /** Transaction Bitcoin brute en hexadécimal (witness extraite côté serveur). */
  raw_tx_hex: string;
}

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawValidationDetails {
  expected_address: string | null;
  found_address: string | null;
  expected_amount_sats: number | null;
  found_amount_sats: number | null;
}

export interface RawCryptoDetails {
  alice_pubkey_xonly?: string;
  platform_pubkey_xonly?: string;
  internal_key_xonly?: string;
  csv_blocks?: number;
  multisig_script?: string;
  csv_script?: string;
  multisig_leaf_hash?: string;
  csv_leaf_hash?: string;
  merkle_root?: string;
  output_key?: string;
  parity?: number;
}

export interface RawValidateWrapMintResponse {
  is_valid: boolean;
  reason: string;
  details: RawValidationDetails | null;
}

export interface RawValidateAddressResponse {
  is_valid: boolean;
  reason: string;
  expected_address: string | null;
  found_address: string | null;
  crypto_details: RawCryptoDetails | null;
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

export interface ValidationDetails {
  expectedAddress: string | null;
  foundAddress: string | null;
  expectedAmountSats: number | null;
  foundAmountSats: number | null;
}

export interface CryptoDetails {
  alicePubkeyXonly?: string;
  platformPubkeyXonly?: string;
  internalKeyXonly?: string;
  csvBlocks?: number;
  multisigScript?: string;
  csvScript?: string;
  multisigLeafHash?: string;
  csvLeafHash?: string;
  merkleRoot?: string;
  outputKey?: string;
  parity?: number;
}

/** Résultat de validation d'un Wrap Mint. */
export interface WrapMintValidationResult {
  /** `true` si la transaction est valide selon le protocole. */
  isValid: boolean;
  /** Code de résultat : "VALID" ou description de l'erreur. */
  reason: string;
  /** Détails cryptographiques supplémentaires. */
  details: ValidationDetails | null;
}

/** Résultat de validation d'une adresse depuis la witness. */
export interface AddressValidationResult {
  /** `true` si l'adresse reconstruite est valide. */
  isValid: boolean;
  /** Code de résultat : "VALID" ou description de l'erreur. */
  reason: string;
  expectedAddress: string | null;
  foundAddress: string | null;
  cryptoDetails: CryptoDetails | null;
}
