/**
 * Fonctions de normalisation partagées entre tous les services.
 * Convertit les réponses brutes API (snake_case) en objets SDK (camelCase).
 *
 * Centraliser ici évite de dupliquer la logique de mapping dans chaque service.
 */

import { RawAddressBalance, AddressBalance } from '../types/address.types';
import {
  RawOp,
  RawTokenInfo,
  RawIndexerStatus,
  Operation,
  TokenInfo,
  IndexerStatus,
} from '../types/brc20.types';
import {
  RawPool,
  RawSwapPosition,
  RawTvlInfo,
  Pool,
  SwapPosition,
  TvlInfo,
} from '../types/swap.types';
import {
  RawPendingResult,
  PendingResult,
} from '../types/mempool.types';
import {
  RawValidateWrapMintResponse,
  RawValidateAddressResponse,
  WrapMintValidationResult,
  AddressValidationResult,
} from '../types/validator.types';
import {
  RawWrapContract,
  RawWrapTvl,
  RawWrapMetrics,
  WrapContract,
  WrapTvl,
  WrapMetrics,
} from '../types/wrap.types';

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export function normalizeBalance(raw: RawAddressBalance): AddressBalance {
  return {
    address: raw.wallet,
    ticker: raw.ticker,
    overallBalance: raw.overall_balance,
    availableBalance: raw.available_balance,
    blockHeight: raw.block_height,
  };
}

// ---------------------------------------------------------------------------
// BRC-20
// ---------------------------------------------------------------------------

export function normalizeOp(raw: RawOp): Operation {
  return {
    id: raw.id,
    txId: raw.tx_id,
    type: raw.op,
    ticker: raw.ticker,
    amount: raw.amount,
    blockHeight: raw.block_height,
    blockHash: raw.block_hash,
    timestamp: raw.timestamp,
    fromAddress: raw.from_address,
    toAddress: raw.to_address,
    valid: raw.valid,
  };
}

export function normalizeTokenInfo(raw: RawTokenInfo): TokenInfo {
  return {
    ticker: raw.ticker,
    decimals: raw.decimals,
    maxSupply: raw.max_supply,
    limitPerMint: raw.limit_per_mint,
    deployTxId: raw.deploy_tx_id,
    deployBlockHeight: raw.deploy_block_height,
    deployTimestamp: raw.deploy_timestamp,
    creatorAddress: raw.creator_address,
    remainingSupply: raw.remaining_supply,
    minted: raw.minted,
    currentSupply: raw.current_supply,
    circulatingSupply: raw.circulating_supply,
    totalLocked: raw.total_locked,
    holders: raw.holders,
    isCurve: raw.is_curve,
  };
}

export function normalizeIndexerStatus(raw: RawIndexerStatus): IndexerStatus {
  return {
    networkBlockHeight: raw.current_block_height_network,
    lastIndexedBlock: raw.last_indexed_block_main_chain,
    lastBrc20OpBlock: raw.last_indexed_brc20_op_block,
  };
}

// ---------------------------------------------------------------------------
// Swap
// ---------------------------------------------------------------------------

export function normalizePool(raw: RawPool): Pool {
  return {
    poolId: raw.pool_id,
    src: raw.src,
    dst: raw.dst,
    activePositions: raw.active_positions,
    lockedSum: raw.locked_sum,
    nextExpirationHeight: raw.next_expiration_height,
  };
}

export function normalizeSwapPosition(raw: RawSwapPosition): SwapPosition {
  return {
    id: raw.id,
    owner: raw.owner,
    src: raw.src,
    dst: raw.dst,
    amountLocked: raw.amount_locked,
    lockStartHeight: raw.lock_start_height,
    unlockHeight: raw.unlock_height,
    status: raw.status,
    initOperationId: raw.init_operation_id,
  };
}

export function normalizeTvlInfo(raw: RawTvlInfo): TvlInfo {
  return {
    ticker: raw.ticker,
    totalLockedPositionsSum: raw.total_locked_positions_sum,
    deployRemainingSupply: raw.deploy_remaining_supply,
    tvlEstimate: raw.tvl_estimate,
  };
}

// ---------------------------------------------------------------------------
// Mempool
// ---------------------------------------------------------------------------

export function normalizePendingResult(raw: RawPendingResult): PendingResult {
  return {
    address: raw.address,
    ticker: raw.ticker,
    hasPendingTransfer: raw.has_pending_transfer,
  };
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

export function normalizeWrapMintValidation(raw: RawValidateWrapMintResponse): WrapMintValidationResult {
  return {
    isValid: raw.is_valid,
    reason: raw.reason,
    details: raw.details
      ? {
          expectedAddress: raw.details.expected_address,
          foundAddress: raw.details.found_address,
          expectedAmountSats: raw.details.expected_amount_sats,
          foundAmountSats: raw.details.found_amount_sats,
        }
      : null,
  };
}

export function normalizeAddressValidation(raw: RawValidateAddressResponse): AddressValidationResult {
  return {
    isValid: raw.is_valid,
    reason: raw.reason,
    expectedAddress: raw.expected_address,
    foundAddress: raw.found_address,
    cryptoDetails: raw.crypto_details
      ? {
          alicePubkeyXonly: raw.crypto_details.alice_pubkey_xonly,
          platformPubkeyXonly: raw.crypto_details.platform_pubkey_xonly,
          internalKeyXonly: raw.crypto_details.internal_key_xonly,
          csvBlocks: raw.crypto_details.csv_blocks,
          multisigScript: raw.crypto_details.multisig_script,
          csvScript: raw.crypto_details.csv_script,
          multisigLeafHash: raw.crypto_details.multisig_leaf_hash,
          csvLeafHash: raw.crypto_details.csv_leaf_hash,
          merkleRoot: raw.crypto_details.merkle_root,
          outputKey: raw.crypto_details.output_key,
          parity: raw.crypto_details.parity,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Wrap
// ---------------------------------------------------------------------------

export function normalizeWrapContract(raw: RawWrapContract): WrapContract {
  return {
    scriptAddress: raw.script_address,
    initiatorAddress: raw.initiator_address,
    status: raw.status,
    initialAmount: raw.initial_amount,
    timelockDelay: raw.timelock_delay,
    creationHeight: raw.creation_height,
    closureHeight: raw.closure_height,
  };
}

export function normalizeWrapTvl(raw: RawWrapTvl): WrapTvl {
  return {
    ticker: raw.ticker,
    remainingLocked: raw.remaining_locked,
  };
}

export function normalizeWrapMetrics(raw: RawWrapMetrics): WrapMetrics {
  return {
    tvlW: raw.tvl_w,
    activeContracts: raw.active_contracts,
    closedContracts: raw.closed_contracts,
    expiredContracts: raw.expired_contracts,
  };
}
