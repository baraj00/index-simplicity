import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { UniversalClient } from '../../src/client';
import { registerIndexerTools } from '../tools/indexer.tools';
import { registerTokenTools } from '../tools/token.tools';
import { registerAddressTools } from '../tools/address.tools';
import { registerSwapTools } from '../tools/swap.tools';
import { registerWrapTools } from '../tools/wrap.tools';
import { registerValidatorTools } from '../tools/validator.tools';

// ---------------------------------------------------------------------------
// Fake McpServer: captures tool(name, desc, schema, handler) registrations
// ---------------------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

interface CapturedTool {
  desc: string;
  schema: Record<string, z.ZodTypeAny>;
  handler: Handler;
}

function makeFakeServer() {
  const tools = new Map<string, CapturedTool>();

  const server = {
    tool: vi.fn((...args: unknown[]) => {
      // Always 4-arg: (name, desc, schema, handler)
      const [name, desc, schema, handler] = args as [
        string,
        string,
        Record<string, z.ZodTypeAny>,
        Handler,
      ];
      tools.set(name, { desc, schema, handler });
    }),
  } as unknown as McpServer;

  return { server, tools };
}

// ---------------------------------------------------------------------------
// Mock UniversalClient
// ---------------------------------------------------------------------------

function makeMockClient(): UniversalClient {
  return {
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    status: vi.fn().mockResolvedValue({ networkBlockHeight: 845000, lastIndexedBlock: 844999, lastBrc20OpBlock: 844990 }),
    listTokens: vi.fn().mockResolvedValue([{ ticker: 'ORDI', holders: 100 }]),
    getToken: vi.fn().mockResolvedValue({ ticker: 'ORDI', holders: 100, supply: '21000000', limit: '1000' }),
    getTokenHolders: vi.fn().mockResolvedValue([{ address: 'bc1ptest', overallBalance: '1000' }]),
    getTokenHistory: vi.fn().mockResolvedValue([]),
    getTokenHistoryByTx: vi.fn().mockResolvedValue([]),
    getHistoryByHeight: vi.fn().mockResolvedValue([]),
    getBalance: vi.fn().mockResolvedValue({ address: 'bc1ptest', ticker: 'ORDI', overallBalance: '1000', availableBalance: '800', blockHeight: 845000 }),
    getTokens: vi.fn().mockResolvedValue([{ ticker: 'ORDI', overallBalance: '500' }]),
    getActivity: vi.fn().mockResolvedValue([]),
    getAddressTickerHistory: vi.fn().mockResolvedValue([]),
    checkPending: vi.fn().mockResolvedValue({ address: 'bc1ptest', ticker: 'ORDI', hasPendingTransfer: false }),
    listPools: vi.fn().mockResolvedValue([{ src: 'ORDI', dst: 'W' }]),
    getSwapTvl: vi.fn().mockResolvedValue({ ticker: 'ORDI', tvlEstimate: '9000000' }),
    listSwapPositions: vi.fn().mockResolvedValue([]),
    getOwnerSwapPositions: vi.fn().mockResolvedValue([]),
    getSwapPosition: vi.fn().mockResolvedValue({ id: 1, status: 'active', src: 'ORDI', dst: 'W' }),
    getExpiringSwapPositions: vi.fn().mockResolvedValue([]),
    listWrapContracts: vi.fn().mockResolvedValue([]),
    getWrapContract: vi.fn().mockResolvedValue({ scriptAddress: 'bc1pscript', status: 'active' }),
    getWrapTvl: vi.fn().mockResolvedValue({ ticker: 'W', remainingLocked: '5000000' }),
    getWrapMetrics: vi.fn().mockResolvedValue({ tvlW: '9000000', activeContracts: '42' }),
    validateWrapMint: vi.fn().mockResolvedValue({ isValid: true, reason: 'VALID' }),
    validateAddressFromWitness: vi.fn().mockResolvedValue({ isValid: false, reason: 'MISMATCH' }),
  } as unknown as UniversalClient;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSchema(schema: Record<string, z.ZodTypeAny>, input: Record<string, unknown>) {
  return z.object(schema).parse(input);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MCP — Indexer tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerIndexerTools(fake.server, client);
  });

  it('registers health and status', () => {
    expect(tools.has('health')).toBe(true);
    expect(tools.has('status')).toBe(true);
    expect(tools.size).toBe(2);
  });

  it('health returns MCP text content wrapping the status object', async () => {
    const { handler } = tools.get('health')!;
    const result = await handler({});
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual({ status: 'ok' });
  });

  it('status returns the sync state object', async () => {
    const { handler } = tools.get('status')!;
    const result = await handler({});
    const body = JSON.parse(result.content[0].text);
    expect(body.networkBlockHeight).toBe(845000);
    expect(body.lastIndexedBlock).toBe(844999);
  });

  it('health returns isError:true when the client throws', async () => {
    (client.health as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network timeout'));
    const { handler } = tools.get('health')!;
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network timeout');
  });
});

describe('MCP — Token tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerTokenTools(fake.server, client);
  });

  it('registers all 6 token tools', () => {
    const expected = ['list_tokens', 'get_token', 'get_token_holders', 'get_token_history', 'get_token_history_by_tx', 'get_history_by_height'];
    expected.forEach(name => expect(tools.has(name)).toBe(true));
    expect(tools.size).toBe(6);
  });

  it('get_token returns token info wrapped in content', async () => {
    const { handler } = tools.get('get_token')!;
    const result = await handler({ ticker: 'ORDI' });
    const body = JSON.parse(result.content[0].text);
    expect(body.ticker).toBe('ORDI');
    expect(body.holders).toBe(100);
    expect(result.isError).toBeUndefined();
  });

  it('get_token returns isError:true when client throws', async () => {
    (client.getToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));
    const { handler } = tools.get('get_token')!;
    const result = await handler({ ticker: 'UNKNOWN' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Not found');
  });

  it('get_token schema rejects empty ticker', () => {
    const { schema } = tools.get('get_token')!;
    expect(() => parseSchema(schema, { ticker: '' })).toThrow();
  });

  it('get_history_by_height schema rejects non-integer height', () => {
    const { schema } = tools.get('get_history_by_height')!;
    expect(() => parseSchema(schema, { height: 1.5 })).toThrow();
  });

  it('list_tokens forwards pagination args to client', async () => {
    const { handler } = tools.get('list_tokens')!;
    await handler({ limit: 50, skip: 10 });
    expect(client.listTokens).toHaveBeenCalledWith({ limit: 50, skip: 10 });
  });
});

describe('MCP — Address tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerAddressTools(fake.server, client);
  });

  it('registers all 5 address tools', () => {
    const expected = ['get_balance', 'get_tokens', 'get_activity', 'get_address_ticker_history', 'check_pending'];
    expected.forEach(name => expect(tools.has(name)).toBe(true));
    expect(tools.size).toBe(5);
  });

  it('get_balance returns balance data', async () => {
    const { handler } = tools.get('get_balance')!;
    const result = await handler({ address: 'bc1ptest', ticker: 'ORDI' });
    const body = JSON.parse(result.content[0].text);
    expect(body.overallBalance).toBe('1000');
    expect(body.availableBalance).toBe('800');
  });

  it('get_balance schema rejects empty address', () => {
    const { schema } = tools.get('get_balance')!;
    expect(() => parseSchema(schema, { address: '', ticker: 'ORDI' })).toThrow();
  });

  it('check_pending returns hasPendingTransfer', async () => {
    const { handler } = tools.get('check_pending')!;
    const result = await handler({ address: 'bc1ptest', ticker: 'ORDI' });
    const body = JSON.parse(result.content[0].text);
    expect(body.hasPendingTransfer).toBe(false);
  });

  it('get_activity returns isError:true when client throws', async () => {
    (client.getActivity as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Bad address'));
    const { handler } = tools.get('get_activity')!;
    const result = await handler({ address: 'bc1bad' });
    expect(result.isError).toBe(true);
  });
});

describe('MCP — Swap tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerSwapTools(fake.server, client);
  });

  it('registers all 6 swap tools', () => {
    const expected = ['list_pools', 'get_swap_tvl', 'list_swap_positions', 'get_owner_swap_positions', 'get_swap_position', 'get_expiring_swap_positions'];
    expected.forEach(name => expect(tools.has(name)).toBe(true));
    expect(tools.size).toBe(6);
  });

  it('get_swap_position returns position by id', async () => {
    const { handler } = tools.get('get_swap_position')!;
    const result = await handler({ id: 1 });
    const body = JSON.parse(result.content[0].text);
    expect(body.id).toBe(1);
    expect(body.status).toBe('active');
    expect(client.getSwapPosition).toHaveBeenCalledWith(1);
  });

  it('get_swap_position schema rejects float id', () => {
    const { schema } = tools.get('get_swap_position')!;
    expect(() => parseSchema(schema, { id: 1.5 })).toThrow();
  });

  it('list_swap_positions schema rejects invalid status', () => {
    const { schema } = tools.get('list_swap_positions')!;
    expect(() => parseSchema(schema, { status: 'pending' })).toThrow();
  });

  it('get_expiring_swap_positions schema rejects negative height_lte', () => {
    const { schema } = tools.get('get_expiring_swap_positions')!;
    expect(() => parseSchema(schema, { height_lte: -1 })).toThrow();
  });

  it('get_swap_tvl returns isError:true when client throws', async () => {
    (client.getSwapTvl as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Ticker not found'));
    const { handler } = tools.get('get_swap_tvl')!;
    const result = await handler({ ticker: 'NOPE' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Ticker not found');
  });
});

describe('MCP — Wrap tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerWrapTools(fake.server, client);
  });

  it('registers all 4 wrap tools', () => {
    const expected = ['list_wrap_contracts', 'get_wrap_contract', 'get_wrap_tvl', 'get_wrap_metrics'];
    expected.forEach(name => expect(tools.has(name)).toBe(true));
    expect(tools.size).toBe(4);
  });

  it('get_wrap_tvl returns TVL data', async () => {
    const { handler } = tools.get('get_wrap_tvl')!;
    const result = await handler({});
    const body = JSON.parse(result.content[0].text);
    expect(body.ticker).toBe('W');
    expect(body.remainingLocked).toBe('5000000');
  });

  it('get_wrap_metrics returns global metrics', async () => {
    const { handler } = tools.get('get_wrap_metrics')!;
    const result = await handler({});
    const body = JSON.parse(result.content[0].text);
    expect(body.activeContracts).toBe('42');
    expect(client.getWrapMetrics).toHaveBeenCalledOnce();
  });

  it('get_wrap_contract returns isError:true when client throws', async () => {
    (client.getWrapContract as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Contract not found'));
    const { handler } = tools.get('get_wrap_contract')!;
    const result = await handler({ script_address: 'bc1pbad' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Contract not found');
  });
});

describe('MCP — Validator tools', () => {
  let tools: Map<string, CapturedTool>;
  let client: UniversalClient;

  beforeEach(() => {
    const fake = makeFakeServer();
    tools = fake.tools;
    client = makeMockClient();
    registerValidatorTools(fake.server, client);
  });

  it('registers validate_wrap_mint and validate_address_from_witness', () => {
    expect(tools.has('validate_wrap_mint')).toBe(true);
    expect(tools.has('validate_address_from_witness')).toBe(true);
    expect(tools.size).toBe(2);
  });

  it('validate_wrap_mint returns validation result', async () => {
    const { handler } = tools.get('validate_wrap_mint')!;
    const result = await handler({ raw_tx_hex: 'deadbeef' });
    const body = JSON.parse(result.content[0].text);
    expect(body.isValid).toBe(true);
    expect(body.reason).toBe('VALID');
    expect(client.validateWrapMint).toHaveBeenCalledWith('deadbeef');
  });

  it('validate_address_from_witness returns validation result', async () => {
    const { handler } = tools.get('validate_address_from_witness')!;
    const result = await handler({ raw_tx_hex: 'cafebabe' });
    const body = JSON.parse(result.content[0].text);
    expect(body.isValid).toBe(false);
    expect(body.reason).toBe('MISMATCH');
  });

  it('validate_wrap_mint schema rejects empty raw_tx_hex', () => {
    const { schema } = tools.get('validate_wrap_mint')!;
    expect(() => parseSchema(schema, { raw_tx_hex: '' })).toThrow();
  });
});
