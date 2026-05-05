import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UniversalClient } from '../src/client';
import { registerIndexerTools } from './tools/indexer.tools';
import { registerTokenTools } from './tools/token.tools';
import { registerAddressTools } from './tools/address.tools';
import { registerSwapTools } from './tools/swap.tools';
import { registerWrapTools } from './tools/wrap.tools';
import { registerValidatorTools } from './tools/validator.tools';

export function createMcpServer(): McpServer {
  const client = new UniversalClient({
    baseUrl: process.env['INDEXER_URL'] ?? 'http://localhost:8080',
    apiKey: process.env['INDEXER_API_KEY'],
    timeoutMs: process.env['INDEXER_TIMEOUT_MS']
      ? parseInt(process.env['INDEXER_TIMEOUT_MS'], 10)
      : undefined,
    maxRetries: process.env['INDEXER_MAX_RETRIES']
      ? parseInt(process.env['INDEXER_MAX_RETRIES'], 10)
      : undefined,
  });

  const server = new McpServer({ name: 'universal-protocol-mcp', version: '0.2.0' });

  registerIndexerTools(server, client);
  registerTokenTools(server, client);
  registerAddressTools(server, client);
  registerSwapTools(server, client);
  registerWrapTools(server, client);
  registerValidatorTools(server, client);

  return server;
}
