import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerIndexerTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'health',
    'Check if the Simplicity indexer is operational. Returns { status: "ok" } when healthy.',
    {},
    async () => {
      try {
        return ok(await client.health());
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'status',
    'Get the sync state of the Simplicity indexer: current network block height vs the last indexed block.',
    {},
    async () => {
      try {
        return ok(await client.status());
      } catch (err) {
        return fail(err);
      }
    },
  );
}
