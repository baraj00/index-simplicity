import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndexerService } from '../services/indexer.service';
import { TokenService } from '../services/token.service';
import { HttpClient } from '../utils/http';
import type { RawIndexerStatus, RawTokenInfo, RawOp } from '../types/brc20.types';
import type { RawAddressBalance } from '../types/address.types';
import { ConfigError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Shared mock factory
// ---------------------------------------------------------------------------

function makeHttp() {
  return {
    get: vi.fn(),
    post: vi.fn(),
  } as unknown as HttpClient;
}

// ---------------------------------------------------------------------------
// IndexerService
// ---------------------------------------------------------------------------

describe('IndexerService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: IndexerService;

  beforeEach(() => {
    http = makeHttp();
    service = new IndexerService(http);
  });

  it('health() returns the raw status object', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ status: 'ok' });
    const result = await service.health();
    expect(result).toEqual({ status: 'ok' });
    expect(http.get).toHaveBeenCalledWith('/v1/indexer/brc20/health');
  });

  it('status() normalizes snake_case to camelCase', async () => {
    const raw: RawIndexerStatus = {
      current_block_height_network: 845000,
      last_indexed_block_main_chain: 844999,
      last_indexed_brc20_op_block: 844990,
    };
    vi.mocked(http.get).mockResolvedValueOnce(raw);
    const result = await service.status();
    expect(result.networkBlockHeight).toBe(845000);
    expect(result.lastIndexedBlock).toBe(844999);
  });
});

// ---------------------------------------------------------------------------
// TokenService
// ---------------------------------------------------------------------------

const RAW_TOKEN: RawTokenInfo = {
  ticker: 'ORDI',
  decimals: 18,
  max_supply: '21000000',
  limit_per_mint: '1000',
  actual_deploy_txid_for_api: 'deadbeef',
  deploy_tx_id: 'deadbeef',
  deploy_block_height: 779832,
  deploy_timestamp: '2023-03-08T00:00:00Z',
  creator_address: 'bc1ptest',
  remaining_supply: '3000000',
  minted: '18000000',
  current_supply: '18000000',
  circulating_supply: '17000000',
  total_locked: '1000000',
  holders: 12500,
  is_curve: false,
};

const RAW_OP: RawOp = {
  id: 1,
  tx_id: 'aabbcc',
  txid: null,
  op: 'mint',
  ticker: 'ORDI',
  amount: '1000',
  block_height: 779833,
  block_hash: 'ffeedd',
  tx_index: 0,
  timestamp: '2023-03-08T01:00:00Z',
  from_address: null,
  to_address: 'bc1ptest',
  valid: true,
};

const RAW_BALANCE: RawAddressBalance = {
  pkscript: 'abcd',
  ticker: 'ORDI',
  wallet: 'bc1ptest',
  overall_balance: '5000',
  available_balance: '4000',
  block_height: 845000,
};

describe('TokenService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: TokenService;

  beforeEach(() => {
    http = makeHttp();
    service = new TokenService(http);
  });

  it('listTokens() maps raw array to normalized TokenInfo[]', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_TOKEN]);
    const result = await service.listTokens();
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('ORDI');
    expect(result[0].maxSupply).toBe('21000000');
    expect(result[0].isCurve).toBe(false);
    expect(http.get).toHaveBeenCalledWith('/v1/indexer/brc20/list', { limit: undefined, skip: undefined });
  });

  it('listTokens() forwards pagination options', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([]);
    await service.listTokens({ limit: 10, skip: 20 });
    expect(http.get).toHaveBeenCalledWith('/v1/indexer/brc20/list', { limit: 10, skip: 20 });
  });

  it('getToken() uppercases ticker and normalizes result', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_TOKEN);
    const result = await service.getToken('ordi');
    expect(result.ticker).toBe('ORDI');
    expect(http.get).toHaveBeenCalledWith(expect.stringContaining('ORDI'));
  });

  it('getToken() throws ConfigError on empty ticker', async () => {
    await expect(service.getToken('')).rejects.toBeInstanceOf(ConfigError);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('getHolders() returns normalized balances', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_BALANCE]);
    const result = await service.getHolders('ORDI');
    expect(result[0].overallBalance).toBe('5000');
    expect(result[0].address).toBe('bc1ptest');
  });

  it('getHistory() passes query params', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_OP]);
    const result = await service.getHistory('ORDI', { limit: 5 });
    expect(result[0].type).toBe('mint');
    expect(result[0].txId).toBe('aabbcc');
    expect(http.get).toHaveBeenCalledWith(expect.stringContaining('ORDI'), expect.objectContaining({ limit: 5 }));
  });

  it('getHistoryByTx() throws ConfigError on empty txid', async () => {
    await expect(service.getHistoryByTx('ORDI', '')).rejects.toBeInstanceOf(ConfigError);
  });

  it('getHistoryByHeight() throws ConfigError on float', async () => {
    await expect(service.getHistoryByHeight(1.5)).rejects.toBeInstanceOf(ConfigError);
  });

  it('getHistoryByHeight() normalizes ops', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_OP]);
    const result = await service.getHistoryByHeight(779833);
    expect(result[0].blockHeight).toBe(779833);
  });
});
