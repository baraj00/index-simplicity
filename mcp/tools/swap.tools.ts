import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerSwapTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'list_pools',
    'List all active swap pools on the Universal Protocol. Optionally filter by source or destination token.',
    {
      src: z.string().min(1).optional().describe('Filter by source token ticker'),
      dst: z.string().min(1).optional().describe('Filter by destination token ticker'),
    },
    async ({ src, dst }) => {
      try {
        return ok(await client.listPools({ src, dst }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_swap_tvl',
    'Get the Total Value Locked (TVL) for a specific token in the swap module.',
    {
      ticker: z.string().min(1).describe('BRC-20 ticker symbol'),
    },
    async ({ ticker }) => {
      try {
        return ok(await client.getSwapTvl(ticker));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'list_swap_positions',
    'List swap positions with optional filters for owner, tokens, status, and pagination.',
    {
      owner: z.string().min(1).optional().describe('Filter by owner Bitcoin address'),
      src: z.string().min(1).optional().describe('Filter by source token ticker'),
      dst: z.string().min(1).optional().describe('Filter by destination token ticker'),
      status: z.enum(['active', 'completed', 'expired']).optional().describe('Filter by position status'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max positions to return'),
      offset: z.number().int().min(0).optional().describe('Positions to skip (pagination)'),
    },
    async ({ owner, src, dst, status, limit, offset }) => {
      try {
        return ok(await client.listSwapPositions({ owner, src, dst, status, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_owner_swap_positions',
    'Get all swap positions belonging to a specific Bitcoin address.',
    {
      owner: z.string().min(1).describe('Bitcoin address of the position owner'),
      status: z.enum(['active', 'completed', 'expired']).optional().describe('Filter by position status'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max positions to return'),
      offset: z.number().int().min(0).optional().describe('Positions to skip (pagination)'),
    },
    async ({ owner, status, limit, offset }) => {
      try {
        return ok(await client.getOwnerSwapPositions(owner, { status, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_swap_position',
    'Get a specific swap position by its unique numeric ID.',
    {
      id: z.number().int().min(0).describe('Numeric position ID'),
    },
    async ({ id }) => {
      try {
        return ok(await client.getSwapPosition(id));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_expiring_swap_positions',
    'Get swap positions that expire at or before a given Bitcoin block height.',
    {
      height_lte: z.number().int().min(0).describe('Maximum block height (inclusive) — positions expiring at or before this block'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max positions to return'),
      offset: z.number().int().min(0).optional().describe('Positions to skip (pagination)'),
    },
    async ({ height_lte, limit, offset }) => {
      try {
        return ok(await client.getExpiringSwapPositions(height_lte, { limit, offset }));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
