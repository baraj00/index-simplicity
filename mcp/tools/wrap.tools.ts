import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerWrapTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'list_wrap_contracts',
    'List Wrap (W token) contracts with optional filters for status, owner, and pagination.',
    {
      status: z.string().min(1).optional().describe('Filter by contract status (e.g. "active", "closed", "expired")'),
      owner: z.string().min(1).optional().describe('Filter by initiator Bitcoin address'),
      limit: z.number().int().min(1).max(1000).optional().describe('Max contracts to return'),
      offset: z.number().int().min(0).optional().describe('Contracts to skip (pagination)'),
    },
    async ({ status, owner, limit, offset }) => {
      try {
        return ok(await client.listWrapContracts({ status, owner, limit, offset }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_wrap_contract',
    'Get details of a specific Wrap contract by its Taproot script address.',
    {
      script_address: z.string().min(1).describe('Taproot script address of the wrap contract (bc1p...)'),
    },
    async ({ script_address }) => {
      try {
        return ok(await client.getWrapContract(script_address));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_wrap_tvl',
    'Get the Total Value Locked (TVL) for the Wrap module (native W token).',
    {},
    async () => {
      try {
        return ok(await client.getWrapTvl());
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'get_wrap_metrics',
    'Get global metrics for the Wrap module: active contracts count, total TVL, closed and expired counts.',
    {},
    async () => {
      try {
        return ok(await client.getWrapMetrics());
      } catch (err) {
        return fail(err);
      }
    },
  );
}
