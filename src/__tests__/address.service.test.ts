import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressService } from '../services/address.service';
import { HttpClient } from '../utils/http';
import { ConfigError } from '../utils/errors';
import type { RawAddressBalance } from '../types/address.types';
import type { RawOp } from '../types/brc20.types';
import type { RawGetAllResponse } from '../types/common.types';

function makeHttp() {
  return { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
}

const RAW_BALANCE: RawAddressBalance = {
  pkscript: 'abcd',
  ticker: 'ORDI',
  wallet: 'bc1ptest',
  overall_balance: '1000',
  available_balance: '800',
  block_height: 845000,
};

const RAW_OP: RawOp = {
  id: 1,
  tx_id: 'aabbcc',
  txid: null,
  op: 'transfer',
  ticker: 'ORDI',
  amount: '100',
  block_height: 845000,
  block_hash: 'ffeedd',
  tx_index: 0,
  timestamp: '2023-03-08T01:00:00Z',
  from_address: 'bc1pother',
  to_address: 'bc1ptest',
  valid: true,
};

describe('AddressService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: AddressService;

  beforeEach(() => {
    http = makeHttp();
    service = new AddressService(http);
  });

  // ── getBalance ─────────────────────────────────────────────────────────────

  it('getBalance() normalizes the raw response', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_BALANCE);
    const result = await service.getBalance('bc1ptest', 'ORDI');
    expect(result.address).toBe('bc1ptest');
    expect(result.overallBalance).toBe('1000');
    expect(result.availableBalance).toBe('800');
    expect(result.blockHeight).toBe(845000);
  });

  it('getBalance() uppercases the ticker', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_BALANCE);
    await service.getBalance('bc1ptest', 'ordi');
    expect(http.get).toHaveBeenCalledWith(expect.stringContaining('ORDI'));
  });

  it('getBalance() throws ConfigError on empty address', async () => {
    await expect(service.getBalance('', 'ORDI')).rejects.toBeInstanceOf(ConfigError);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('getBalance() throws ConfigError on empty ticker', async () => {
    await expect(service.getBalance('bc1ptest', '')).rejects.toBeInstanceOf(ConfigError);
    expect(http.get).not.toHaveBeenCalled();
  });

  // ── getTokens ──────────────────────────────────────────────────────────────

  it('getTokens() returns tokens with non-zero balance', async () => {
    const historyResponse: RawGetAllResponse<RawOp> = {
      data: [RAW_OP, { ...RAW_OP, ticker: 'W' }],
      total: 2,
    };
    // First call: history/all; then one balance call per ticker
    vi.mocked(http.get)
      .mockResolvedValueOnce(historyResponse)                         // history/all
      .mockResolvedValueOnce(RAW_BALANCE)                             // ORDI balance
      .mockResolvedValueOnce({ ...RAW_BALANCE, ticker: 'W', overall_balance: '0' }); // W balance = 0

    const result = await service.getTokens('bc1ptest');
    // Only ORDI should be returned (W has 0 balance)
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('ORDI');
  });

  it('getTokens() deduplicates tickers from history', async () => {
    const historyResponse: RawGetAllResponse<RawOp> = {
      data: [RAW_OP, RAW_OP, RAW_OP], // same ticker 3 times
      total: 3,
    };
    vi.mocked(http.get)
      .mockResolvedValueOnce(historyResponse)
      .mockResolvedValueOnce(RAW_BALANCE); // only 1 balance call expected

    await service.getTokens('bc1ptest');
    // history/all + 1 balance call (deduplicated to 1 unique ticker)
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('getTokens() returns empty array when address has no history', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: [], total: 0 });
    const result = await service.getTokens('bc1ptest');
    expect(result).toEqual([]);
  });

  // ── getActivity ────────────────────────────────────────────────────────────

  it('getActivity() normalizes ops and passes options', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_OP]);
    const result = await service.getActivity('bc1ptest', { ticker: 'ORDI', limit: 10 });
    expect(result[0].type).toBe('transfer');
    expect(result[0].fromAddress).toBe('bc1pother');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('bc1ptest'),
      expect.objectContaining({ ticker: 'ORDI', limit: 10 }),
    );
  });
});
