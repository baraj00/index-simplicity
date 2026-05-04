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
  RawSwapQuote,
  RawSwapPosition,
  RawTvlInfo,
  Pool,
  SwapQuote,
  SwapPosition,
  TvlInfo,
} from '../types/swap.types';

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
    currentSupply: raw.current_supply,
    holders: raw.holders,
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
    tokenA: raw.token_a,
    tokenB: raw.token_b,
    reserveA: raw.reserve_a,
    reserveB: raw.reserve_b,
    lastUpdatedHeight: raw.last_updated_height,
  };
}

export function normalizeSwapQuote(raw: RawSwapQuote): SwapQuote {
  return {
    srcTicker: raw.src_ticker,
    dstTicker: raw.dst_ticker,
    amountIn: raw.amount_in,
    amountOut: raw.amount_out,
    poolId: raw.pool_id,
    expectedRate: raw.expected_rate,
    actualRate: raw.actual_rate,
    slippagePercent: raw.slippage_percent,
    priceImpactPercent: raw.price_impact_percent,
    protocolFee: raw.protocol_fee,
    isPartialFill: raw.is_partial_fill,
  };
}

export function normalizeSwapPosition(raw: RawSwapPosition): SwapPosition {
  return {
    id: raw.id,
    owner: raw.owner,
    poolId: raw.pool_id,
    srcTicker: raw.src_ticker,
    dstTicker: raw.dst_ticker,
    amountLocked: raw.amount_locked,
    status: raw.status,
    unlockHeight: raw.unlock_height,
    txId: raw.tx_id,
    blockHeight: raw.block_height,
    timestamp: raw.timestamp,
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
