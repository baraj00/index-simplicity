import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerTokenTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'list_tokens',
    'List deployed BRC-20 tokens on the Universal Protocol.',
    {
      limit: z.number().int().min(1).max(1000).optional().describe('Max tokens to return'),
      skip: z.number().int().min(0).optional().describe('Tokens to skip (pagination)'),
    },
    async ({ limit, skip }) => {
      try {
        return ok(await client.listTokens({ limit, skip }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_token',
    'Get detailed information about a BRC-20 token: supply, holders, deploy block, curve flag.',
    {
      ticker: z.string().min(1).describe('BRC-20 ticker symbol, e.g. "ORDI" or "W"'),
    },
    async ({ ticker }) => {
      try {
        return ok(await client.getToken(ticker));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_token_holders',
    'List all holders of a BRC-20 token with their balances, sorted by balance descending.',
    {
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max holders to return'),
      skip: z.number().int().min(0).optional().describe('Holders to skip (pagination)'),
    },
    async ({ ticker, limit, skip }) => {
      try {
        return ok(await client.getTokenHolders(ticker, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_token_history',
    'Get the operation history (deploy, mint, transfer) for a BRC-20 token.',
    {
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
      op_type: z.enum(['deploy', 'mint', 'transfer']).optional().describe('Filter by operation type'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max operations to return'),
      skip: z.number().int().min(0).optional().describe('Operations to skip (pagination)'),
    },
    async ({ ticker, op_type, limit, skip }) => {
      try {
        return ok(await client.getTokenHistory(ticker, { opType: op_type, limit, skip }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_token_history_by_tx',
    'Get BRC-20 operations linked to a specific Bitcoin transaction ID.',
    {
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
      txid: z.string().min(1).describe('Bitcoin transaction ID (TXID or wtxid)'),
    },
    async ({ ticker, txid }) => {
      try {
        return ok(await client.getTokenHistoryByTx(ticker, txid));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_history_by_height',
    'Get all BRC-20 operations indexed at a specific Bitcoin block height.',
    {
      height: z.number().int().min(0).describe('Bitcoin block height'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max operations to return'),
      skip: z.number().int().min(0).optional().describe('Operations to skip (pagination)'),
    },
    async ({ height, limit, skip }) => {
      try {
        return ok(await client.getHistoryByHeight(height, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
