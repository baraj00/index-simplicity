import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwapService } from '../services/swap.service';
import { MempoolService } from '../services/mempool.service';
import { ValidatorService } from '../services/validator.service';
import { WrapService } from '../services/wrap.service';
import { HttpClient } from '../utils/http';
import { ConfigError } from '../utils/errors';
import type { RawPool, RawSwapPosition, RawTvlInfo } from '../types/swap.types';
import type { RawPendingResult } from '../types/mempool.types';
import type { RawValidateWrapMintResponse, RawValidateAddressResponse } from '../types/validator.types';
import type { RawWrapContract, RawContractListResponse, RawWrapTvl, RawWrapMetrics } from '../types/wrap.types';

function makeHttp() {
  return { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
}

// ---------------------------------------------------------------------------
// SwapService
// ---------------------------------------------------------------------------

const RAW_POOL: RawPool = {
  pool_id: 'LOL-WTF',
  src: 'LOL',
  dst: 'WTF',
  active_positions: 5,
  locked_sum: '50000',
  next_expiration_height: 845100,
};

const RAW_POSITION: RawSwapPosition = {
  id: 42,
  owner: 'bc1ptest',
  src: 'LOL',
  dst: 'WTF',
  amount_locked: '10000',
  lock_start_height: 844000,
  unlock_height: 845000,
  status: 'active',
  init_operation_id: 1,
};

const RAW_TVL: RawTvlInfo = {
  ticker: 'LOL',
  total_locked_positions_sum: '50000',
  deploy_remaining_supply: '9000000',
  tvl_estimate: '1000000',
};

describe('SwapService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: SwapService;

  beforeEach(() => {
    http = makeHttp();
    service = new SwapService(http);
  });

  it('listPools() normalizes raw pools (array response)', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([RAW_POOL]);
    const result = await service.listPools();
    expect(result[0].poolId).toBe('LOL-WTF');
    expect(result[0].activePositions).toBe(5);
    expect(result[0].lockedSum).toBe('50000');
  });

  it('listPools() normalizes wrapped response ({ items })', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ items: [RAW_POOL], total: 1 });
    const result = await service.listPools();
    expect(result).toHaveLength(1);
    expect(result[0].src).toBe('LOL');
  });

  it('listPools() passes src/dst filter params', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([]);
    await service.listPools({ src: 'LOL' });
    expect(http.get).toHaveBeenCalledWith(expect.any(String), { src: 'LOL', dst: undefined });
  });

  it('getTvl() normalizes TVL info', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_TVL);
    const result = await service.getTvl('LOL');
    expect(result.ticker).toBe('LOL');
    expect(result.tvlEstimate).toBe('1000000');
  });

  it('getTvl() throws ConfigError on empty ticker', async () => {
    await expect(service.getTvl('')).rejects.toBeInstanceOf(ConfigError);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('getPosition() normalizes a swap position', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_POSITION);
    const result = await service.getPosition(42);
    expect(result.id).toBe(42);
    expect(result.amountLocked).toBe('10000');
    expect(result.status).toBe('active');
    expect(result.initOperationId).toBe(1);
  });

  it('getPosition() throws ConfigError on negative id', async () => {
    await expect(service.getPosition(-1)).rejects.toBeInstanceOf(ConfigError);
  });

  it('getExpiringPositions() throws ConfigError on float heightLte', async () => {
    await expect(service.getExpiringPositions(1.5)).rejects.toBeInstanceOf(ConfigError);
  });

  it('listPositions() normalizes and passes options', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ items: [RAW_POSITION], total: 1, limit: 100, offset: 0 });
    const result = await service.listPositions({ status: 'active' });
    expect(result[0].owner).toBe('bc1ptest');
  });

  it('getOwnerPositions() encodes owner address in URL', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ items: [], total: 0, limit: 100, offset: 0 });
    await service.getOwnerPositions('bc1ptest');
    expect(http.get).toHaveBeenCalledWith(expect.stringContaining('bc1ptest'), expect.anything());
  });
});

// ---------------------------------------------------------------------------
// MempoolService
// ---------------------------------------------------------------------------

describe('MempoolService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: MempoolService;

  beforeEach(() => {
    http = makeHttp();
    service = new MempoolService(http);
  });

  it('checkPending() posts correct body and normalizes result', async () => {
    const raw: RawPendingResult = {
      address: 'bc1ptest',
      ticker: 'ORDI',
      has_pending_transfer: true,
    };
    vi.mocked(http.post).mockResolvedValueOnce(raw);
    const result = await service.checkPending('bc1ptest', 'ORDI');
    expect(result.hasPendingTransfer).toBe(true);
    expect(result.address).toBe('bc1ptest');
    expect(http.post).toHaveBeenCalledWith('/v1/mempool/check-pending', {
      address: 'bc1ptest',
      ticker: 'ORDI',
    });
  });

  it('checkPending() uppercases the ticker', async () => {
    const raw: RawPendingResult = { address: 'bc1ptest', ticker: 'ORDI', has_pending_transfer: false };
    vi.mocked(http.post).mockResolvedValueOnce(raw);
    await service.checkPending('bc1ptest', 'ordi');
    expect(http.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ ticker: 'ORDI' }));
  });
});

// ---------------------------------------------------------------------------
// ValidatorService
// ---------------------------------------------------------------------------

describe('ValidatorService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: ValidatorService;

  beforeEach(() => {
    http = makeHttp();
    service = new ValidatorService(http);
  });

  it('validateWrapMint() posts raw_tx_hex and normalizes', async () => {
    const raw: RawValidateWrapMintResponse = { is_valid: true, reason: 'VALID', details: null };
    vi.mocked(http.post).mockResolvedValueOnce(raw);
    const result = await service.validateWrapMint('deadbeef');
    expect(result.isValid).toBe(true);
    expect(result.reason).toBe('VALID');
    expect(result.details).toBeNull();
    expect(http.post).toHaveBeenCalledWith('/v1/validator/validate-wrap-mint', { raw_tx_hex: 'deadbeef' });
  });

  it('validateAddressFromWitness() posts raw_tx_hex and normalizes', async () => {
    const raw: RawValidateAddressResponse = {
      is_valid: false,
      reason: 'ADDRESS_MISMATCH',
      expected_address: 'bc1pexpected',
      found_address: 'bc1pfound',
      crypto_details: null,
    };
    vi.mocked(http.post).mockResolvedValueOnce(raw);
    const result = await service.validateAddressFromWitness('cafebabe');
    expect(result.isValid).toBe(false);
    expect(result.expectedAddress).toBe('bc1pexpected');
    expect(http.post).toHaveBeenCalledWith('/v1/validator/validate-address-from-witness', { raw_tx_hex: 'cafebabe' });
  });
});

// ---------------------------------------------------------------------------
// WrapService
// ---------------------------------------------------------------------------

const RAW_CONTRACT: RawWrapContract = {
  script_address: 'bc1pscript',
  initiator_address: 'bc1pinit',
  status: 'active',
  initial_amount: '1000000',
  timelock_delay: 144,
  creation_height: 840000,
  closure_height: null,
};

describe('WrapService', () => {
  let http: ReturnType<typeof makeHttp>;
  let service: WrapService;

  beforeEach(() => {
    http = makeHttp();
    service = new WrapService(http);
  });

  it('listContracts() normalizes items from response', async () => {
    const raw: RawContractListResponse = { total: 1, limit: 100, offset: 0, items: [RAW_CONTRACT] };
    vi.mocked(http.get).mockResolvedValueOnce(raw);
    const result = await service.listContracts();
    expect(result[0].scriptAddress).toBe('bc1pscript');
    expect(result[0].initiatorAddress).toBe('bc1pinit');
    expect(result[0].creationHeight).toBe(840000);
    expect(result[0].closureHeight).toBeNull();
  });

  it('listContracts() passes filter options', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ total: 0, limit: 10, offset: 0, items: [] });
    await service.listContracts({ status: 'active', limit: 10 });
    expect(http.get).toHaveBeenCalledWith('/v1/indexer/w/contracts', expect.objectContaining({ status: 'active', limit: 10 }));
  });

  it('getContract() encodes scriptAddress and normalizes', async () => {
    vi.mocked(http.get).mockResolvedValueOnce(RAW_CONTRACT);
    const result = await service.getContract('bc1pscript');
    expect(result.scriptAddress).toBe('bc1pscript');
    expect(http.get).toHaveBeenCalledWith(expect.stringContaining('bc1pscript'));
  });

  it('getTvl() returns normalized WrapTvl', async () => {
    const raw: RawWrapTvl = { ticker: 'W', remaining_locked: '5000000' };
    vi.mocked(http.get).mockResolvedValueOnce(raw);
    const result = await service.getTvl();
    expect(result.ticker).toBe('W');
    expect(result.remainingLocked).toBe('5000000');
  });

  it('getMetrics() returns normalized WrapMetrics', async () => {
    const raw: RawWrapMetrics = {
      tvl_w: '9000000',
      active_contracts: '42',
      closed_contracts: '10',
      expired_contracts: '3',
    };
    vi.mocked(http.get).mockResolvedValueOnce(raw);
    const result = await service.getMetrics();
    expect(result.tvlW).toBe('9000000');
    expect(result.activeContracts).toBe('42');
    expect(result.expiredContracts).toBe('3');
  });
});
