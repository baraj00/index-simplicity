/**
 * Types relatifs aux adresses Bitcoin et aux balances BRC-20.
 * Basés sur les schémas de l'API Simplicity Indexer.
 */

// ---------------------------------------------------------------------------
// Shapes brutes (API) — ce que l'indexeur retourne
// ---------------------------------------------------------------------------

/**
 * Réponse brute de l'endpoint :
 *   GET /v1/indexer/address/{address}/brc20/{ticker}/info
 */
export interface RawAddressBalance {
  pkscript: string;   // script pubkey (format hex)
  ticker: string;     // ticker BRC-20
  wallet: string;     // adresse Bitcoin lisible
  overall_balance: string;    // solde total (string pour éviter overflow)
  available_balance: string;  // solde disponible
  block_height: number;       // dernier bloc affectant ce solde
}

// ---------------------------------------------------------------------------
// Shapes normalisées (SDK) — ce que le SDK expose
// ---------------------------------------------------------------------------

/**
 * Balance d'un token BRC-20 pour une adresse donnée.
 * Toutes les propriétés utilisent le camelCase.
 */
export interface AddressBalance {
  /** Adresse Bitcoin (bc1p..., bc1q...) */
  address: string;
  /** Ticker du token BRC-20 (ex: "ORDI", "W") */
  ticker: string;
  /** Solde total détenu (en unités du token, sous forme de string) */
  overallBalance: string;
  /** Solde disponible non engagé dans un swap/wrap */
  availableBalance: string;
  /** Hauteur du dernier bloc affectant ce solde */
  blockHeight: number;
}
