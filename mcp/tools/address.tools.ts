import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerAddressTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'get_balance',
    'Get the BRC-20 token balance for a Bitcoin address. Returns overallBalance and availableBalance.',
    {
      address: z.string().min(1).describe('Bitcoin address (bc1p, bc1q, tb1, 1..., 3...)'),
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
    },
    async ({ address, ticker }) => {
      try {
        return ok(await client.getBalance(address, ticker));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_tokens',
    'Get all BRC-20 tokens held by a Bitcoin address (only tokens with balance > 0).',
    {
      address: z.string().min(1).describe('Bitcoin address'),
    },
    async ({ address }) => {
      try {
        return ok(await client.getTokens(address));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_activity',
    'Get the BRC-20 operation history for a Bitcoin address (as sender or receiver).',
    {
      address: z.string().min(1).describe('Bitcoin address'),
      ticker: z.string().min(1).optional().describe('Filter by BRC-20 ticker'),
      op_type: z.enum(['deploy', 'mint', 'transfer']).optional().describe('Filter by operation type'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max operations to return'),
    },
    async ({ address, ticker, op_type, limit }) => {
      try {
        return ok(await client.getActivity(address, { ticker, opType: op_type, limit }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_address_ticker_history',
    'Get the operation history of a Bitcoin address scoped to a single BRC-20 token.',
    {
      address: z.string().min(1).describe('Bitcoin address'),
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max operations to return'),
      skip: z.number().int().min(0).optional().describe('Operations to skip (pagination)'),
    },
    async ({ address, ticker, limit, skip }) => {
      try {
        return ok(await client.getAddressTickerHistory(address, ticker, { limit, skip }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'check_pending',
    'Check if a Bitcoin address has pending (unconfirmed mempool) BRC-20 transfers for a ticker.',
    {
      address: z.string().min(1).describe('Bitcoin address'),
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
    },
    async ({ address, ticker }) => {
      try {
        return ok(await client.checkPending(address, ticker));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
