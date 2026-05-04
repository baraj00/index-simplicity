/**
 * Types relatifs au module Wrap (W) de l'indexeur Simplicity.
 * Le token W est la version wrapped du protocole Universal Protocol.
 */

// ---------------------------------------------------------------------------
// Raw (API — snake_case)
// ---------------------------------------------------------------------------

export interface RawWrapContract {
  /** Adresse Taproot du script du contrat. */
  script_address: string;
  /** Adresse de l'initiateur du contrat. */
  initiator_address: string;
  status: string;
  initial_amount: string | null;
  timelock_delay: number | null;
  creation_height: number;
  closure_height: number | null;
}

export interface RawWrapTvl {
  ticker: string;
  remaining_locked: string;
}

export interface RawWrapMetrics {
  tvl_w: string;
  active_contracts: string;
  closed_contracts: string;
  expired_contracts: string;
}

export interface RawContractListResponse {
  total: number;
  limit: number;
  offset: number;
  items: RawWrapContract[];
}

// ---------------------------------------------------------------------------
// Normalized (SDK — camelCase)
// ---------------------------------------------------------------------------

/** Contrat de wrap — verrouille des tokens pour minter du W. */
export interface WrapContract {
  /** Adresse Taproot du script du contrat. */
  scriptAddress: string;
  /** Adresse de l'initiateur. */
  initiatorAddress: string;
  status: string;
  initialAmount: string | null;
  timelockDelay: number | null;
  creationHeight: number;
  closureHeight: number | null;
}

/** TVL du module Wrap. */
export interface WrapTvl {
  ticker: string;
  remainingLocked: string;
}

/** Métriques globales du module Wrap. */
export interface WrapMetrics {
  tvlW: string;
  activeContracts: string;
  closedContracts: string;
  expiredContracts: string;
}

// ---------------------------------------------------------------------------
// Options de requête
// ---------------------------------------------------------------------------

export interface ListContractsOptions {
  status?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}
