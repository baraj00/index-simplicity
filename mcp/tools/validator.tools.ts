import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniversalClient } from '../../src/client';
import { ok, fail } from '../utils';

export function registerValidatorTools(server: McpServer, client: UniversalClient): void {
  server.tool(
    'validate_wrap_mint',
    'Validate a Wrap Mint transaction (W token creation) against Universal Protocol rules. Returns isValid and a reason code.',
    {
      raw_tx_hex: z.string().min(1).describe('Raw Bitcoin transaction in hexadecimal format'),
    },
    async ({ raw_tx_hex }) => {
      try {
        return ok(await client.validateWrapMint(raw_tx_hex));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    'validate_address_from_witness',
    'Reconstruct and validate a Taproot address from the witness data of a raw Bitcoin transaction.',
    {
      raw_tx_hex: z.string().min(1).describe('Raw Bitcoin transaction in hexadecimal format'),
    },
    async ({ raw_tx_hex }) => {
      try {
        return ok(await client.validateAddressFromWitness(raw_tx_hex));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
