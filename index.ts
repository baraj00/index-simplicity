/**
 * @universal-protocol/sdk
 *
 * SDK TypeScript pour le Universal Protocol (BRC-20 Extension sur Bitcoin).
 * Point d'entrée unique — ne jamais importer depuis src/ directement.
 */

// Client
export { UniversalClient } from './src/client';
export type { UniversalClientOptions } from './src/client';

// Types — Adresse
export type { AddressBalance } from './src/types/address.types';

// Types — BRC-20
export type { TokenInfo, Operation, IndexerStatus } from './src/types/brc20.types';

// Types — Swap
export type {
  Pool,
  SwapPosition,
  TvlInfo,
  ListPoolsOptions,
  ListPositionsOptions,
} from './src/types/swap.types';

// Types — Mempool
export type { PendingResult } from './src/types/mempool.types';

// Types — Validator
export type {
  ValidationDetails,
  CryptoDetails,
  WrapMintValidationResult,
  AddressValidationResult,
} from './src/types/validator.types';

// Types — Wrap
export type {
  WrapContract,
  WrapTvl,
  WrapMetrics,
  ListContractsOptions,
} from './src/types/wrap.types';

// Types — Communs
export type { ActivityOptions, PaginationOptions } from './src/types/common.types';

// Erreurs — pour les blocs catch côté consommateur
export {
  UniversalSDKError,
  ApiError,
  NotFoundError,
  ConfigError,
} from './src/utils/errors';
