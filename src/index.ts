/**
 * @universal-protocol/sdk
 *
 * TypeScript SDK for the Universal Protocol (BRC-20 Extension on Bitcoin).
 * Single entry point — never import directly from src/ sub-modules.
 */

// Client
export { UniversalClient } from './client';
export type { UniversalClientOptions } from './client';

// Types — Address
export type { AddressBalance } from './types/address.types';

// Types — BRC-20
export type { TokenInfo, Operation, IndexerStatus } from './types/brc20.types';

// Types — Swap
export type {
  Pool,
  SwapPosition,
  TvlInfo,
  ListPoolsOptions,
  ListPositionsOptions,
} from './types/swap.types';

// Types — Mempool
export type { PendingResult } from './types/mempool.types';

// Types — Validator
export type {
  ValidationDetails,
  CryptoDetails,
  WrapMintValidationResult,
  AddressValidationResult,
} from './types/validator.types';

// Types — Wrap
export type {
  WrapContract,
  WrapTvl,
  WrapMetrics,
  ListContractsOptions,
} from './types/wrap.types';

// Types — Common
export type { ActivityOptions, PaginationOptions } from './types/common.types';

// Errors — for consumer catch blocks
export {
  UniversalSDKError,
  ApiError,
  NotFoundError,
  ConfigError,
} from './utils/errors';
