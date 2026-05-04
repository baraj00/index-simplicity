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
import { RawValidationResult, ValidationResult } from '../types/validator.types';
import { RawWrapContract, WrapContract } from '../types/wrap.types';

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
    pendingAmount: raw.pending_amount,
    transfers: raw.transfers.map((t) => ({
      txId: t.tx_id,
      amount: t.amount,
      fromAddress: t.from_address,
      toAddress: t.to_address,
    })),
  };
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

export function normalizeValidationResult(raw: RawValidationResult): ValidationResult {
  return {
    valid: raw.valid,
    message: raw.message,
    address: raw.address,
  };
}

// ---------------------------------------------------------------------------
// Wrap
// ---------------------------------------------------------------------------

export function normalizeWrapContract(raw: RawWrapContract): WrapContract {
  return {
    contractId: raw.contract_id,
    ticker: raw.ticker,
    taprootAddress: raw.taproot_address,
    network: raw.network,
    status: raw.status,
    totalWrapped: raw.total_wrapped,
    totalUnwrapped: raw.total_unwrapped,
  };
}
