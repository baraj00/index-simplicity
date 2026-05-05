/**
 * basic-usage.ts — TypeScript usage example for @universal-protocol/sdk
 *
 * Run against the mock server:
 *   node examples/mock-server.js          (in one terminal)
 *   npx ts-node examples/basic-usage.ts  (in another terminal)
 */

import { UniversalClient, NotFoundError, ApiError, ConfigError } from '../src/index';

const client = new UniversalClient({
  baseUrl: 'http://localhost:8080',
  timeoutMs: 5_000,
  maxRetries: 2,
});

async function main() {
  // ── Indexer health ────────────────────────────────────────────────────────
  const health = await client.health();
  console.log('Indexer healthy:', health);

  const status = await client.status();
  console.log(`Block height: ${status.networkBlockHeight}, last indexed: ${status.lastIndexedBlock}`);

  // ── Token list ────────────────────────────────────────────────────────────
  const tokens = await client.listTokens({ limit: 5 });
  console.log(`\nFirst 5 tokens:`);
  tokens.forEach((t) => console.log(`  ${t.ticker} — supply: ${t.currentSupply}`));

  // ── Single token info ─────────────────────────────────────────────────────
  try {
    const token = await client.getToken('ORDI');
    console.log(`\nORDI holders: ${token.holders}`);
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log('ORDI not found on this indexer');
    }
  }

  // ── Address balance ───────────────────────────────────────────────────────
  const address = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297';
  try {
    const balance = await client.getBalance(address, 'ORDI');
    console.log(`\nORDI balance: ${balance.overallBalance} (available: ${balance.availableBalance})`);
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log('\nAddress/ticker not found — expected with mock server');
    }
  }

  // ── Swap pools ────────────────────────────────────────────────────────────
  const pools = await client.listPools();
  if (pools.length > 0) {
    const p = pools[0];
    console.log(`\nPool: ${p.src} → ${p.dst} | ${p.activePositions} active positions`);
  }

  // ── Input validation ──────────────────────────────────────────────────────
  try {
    await client.getToken('');
  } catch (e) {
    if (e instanceof ConfigError) {
      console.log(`\nValidation caught: ${e.message}`);
    }
  }

  // ── Error handling ────────────────────────────────────────────────────────
  try {
    await client.getToken('DOESNOTEXIST');
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log('404 — not found');
    } else if (e instanceof ApiError) {
      console.log(`API error ${e.statusCode}: ${e.message}`);
    }
  }
}

main().catch(console.error);
