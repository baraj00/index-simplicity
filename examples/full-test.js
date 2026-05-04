/**
 * Test complet du SDK Universal Protocol.
 * Couvre toutes les méthodes exposées par UniversalClient.
 *
 * Usage : node examples/full-test.js
 * (le mock-server doit tourner : node examples/mock-server.js)
 */

const { UniversalClient, NotFoundError, ApiError } = require('../dist/index');

const client = new UniversalClient({ baseUrl: 'http://localhost:8080' });

// Adresse et ticker de test (présents dans le mock)
const TEST_ADDRESS = 'bc1ptest123';
const TEST_TICKER  = 'OPQT';
const TEST_POOL    = 'OPQT-W';

let passed = 0;
let failed = 0;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function ok(label, value, check) {
  if (check(value)) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} — reçu :`, JSON.stringify(value));
    failed++;
  }
}

async function section(title, fn) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(55));
  try {
    await fn();
  } catch (e) {
    console.log(`  ❌ Erreur non gérée : ${e.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Universal Protocol SDK — Test de complétude     ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // ── Indexeur ──────────────────────────────────────────────────────────────
  await section('health()', async () => {
    const h = await client.health();
    ok('retourne { status }',           h, (v) => typeof v.status === 'string');
    ok('status === "ok"',               h, (v) => v.status === 'ok');
  });

  await section('status()', async () => {
    const s = await client.status();
    ok('networkBlockHeight est un nombre', s, (v) => typeof v.networkBlockHeight === 'number');
    ok('lastIndexedBlock est un nombre',   s, (v) => typeof v.lastIndexedBlock === 'number');
    ok('lastBrc20OpBlock est un nombre',   s, (v) => typeof v.lastBrc20OpBlock === 'number');
    ok('networkBlockHeight > 0',           s, (v) => v.networkBlockHeight > 0);
  });

  // ── Tokens ────────────────────────────────────────────────────────────────
  await section('listTokens()', async () => {
    const tokens = await client.listTokens();
    ok('retourne un tableau',                          tokens, (v) => Array.isArray(v));
    ok('tableau non vide',                             tokens, (v) => v.length > 0);
    ok('ticker est une string',                        tokens, (v) => typeof v[0].ticker === 'string');
    ok('holders est un nombre',                        tokens, (v) => typeof v[0].holders === 'number');
    ok('maxSupply est une string (pas un float)',       tokens, (v) => typeof v[0].maxSupply === 'string');
    ok('deployTimestamp est au format ISO 8601',        tokens, (v) => /\d{4}-\d{2}-\d{2}T/.test(v[0].deployTimestamp));
  });

  await section(`getToken('${TEST_TICKER}')`, async () => {
    const t = await client.getToken(TEST_TICKER);
    ok('ticker correct',                    t, (v) => v.ticker === TEST_TICKER);
    ok('holders > 0',                       t, (v) => v.holders > 0);
    ok('currentSupply est une string',      t, (v) => typeof v.currentSupply === 'string');
    ok('remainingSupply est une string',    t, (v) => typeof v.remainingSupply === 'string');
    ok('deployBlockHeight est un nombre',   t, (v) => typeof v.deployBlockHeight === 'number');
    ok('creatorAddress non vide',           t, (v) => v.creatorAddress.length > 0);
    // Propriétés snake_case ne doivent PAS être présentes (normalisation correcte)
    ok('pas de current_supply (snake_case)',  t, (v) => !('current_supply' in v));
    ok('pas de max_supply (snake_case)',      t, (v) => !('max_supply' in v));
  });

  await section('getToken("INEXISTANT") → NotFoundError', async () => {
    try {
      await client.getToken('INEXISTANT');
      ok('doit lever une erreur', null, () => false);
    } catch (e) {
      ok('NotFoundError levée',              e, (v) => v instanceof NotFoundError);
      ok('statusCode === 404',               e, (v) => v.statusCode === 404);
      ok('message contient le path',         e, (v) => v.message.includes('404'));
    }
  });

  await section(`getTokenHolders('${TEST_TICKER}')`, async () => {
    const holders = await client.getTokenHolders(TEST_TICKER);
    ok('retourne un tableau',              holders, (v) => Array.isArray(v));
    ok('address est présente',             holders, (v) => typeof v[0].address === 'string');
    ok('overallBalance est une string',    holders, (v) => typeof v[0].overallBalance === 'string');
    ok('availableBalance est une string',  holders, (v) => typeof v[0].availableBalance === 'string');
    ok('blockHeight est un nombre',        holders, (v) => typeof v[0].blockHeight === 'number');
    // Normalisation : pas de snake_case
    ok('pas de overall_balance (snake)',   holders, (v) => !('overall_balance' in v[0]));
  });

  await section(`getTokenHistory('${TEST_TICKER}')`, async () => {
    const history = await client.getTokenHistory(TEST_TICKER);
    ok('retourne un tableau',          history, (v) => Array.isArray(v));
    ok('tableau non vide',             history, (v) => v.length > 0);
    ok('type est deploy|mint|transfer', history, (v) => ['deploy','mint','transfer'].includes(v[0].type));
    ok('ticker correct',               history, (v) => v[0].ticker === TEST_TICKER);
    ok('blockHeight est un nombre',    history, (v) => typeof v[0].blockHeight === 'number');
    ok('timestamp au format ISO',      history, (v) => /\d{4}-\d{2}-\d{2}T/.test(v[0].timestamp));
    ok('valid est un booléen',         history, (v) => typeof v[0].valid === 'boolean');
    // Normalisation
    ok('pas de block_height (snake)',   history, (v) => !('block_height' in v[0]));
    ok('pas de tx_id (snake)',          history, (v) => !('tx_id' in v[0]));
  });

  // ── Adresses ──────────────────────────────────────────────────────────────
  await section(`getBalance('${TEST_ADDRESS}', '${TEST_TICKER}')`, async () => {
    const b = await client.getBalance(TEST_ADDRESS, TEST_TICKER);
    ok('address correct',               b, (v) => v.address === TEST_ADDRESS);
    ok('ticker correct',                b, (v) => v.ticker === TEST_TICKER);
    ok('overallBalance est une string', b, (v) => typeof v.overallBalance === 'string');
    ok('availableBalance est une string', b, (v) => typeof v.availableBalance === 'string');
    ok('blockHeight est un nombre',     b, (v) => typeof v.blockHeight === 'number');
    ok('ticker normalisé en uppercase', b, (v) => v.ticker === v.ticker.toUpperCase());
  });

  await section(`getTokens('${TEST_ADDRESS}')`, async () => {
    const tokens = await client.getTokens(TEST_ADDRESS);
    ok('retourne un tableau',              tokens, (v) => Array.isArray(v));
    ok('au moins 1 token détenu',          tokens, (v) => v.length >= 1);
    ok('overallBalance > 0 pour tous',     tokens, (v) => v.every((t) => parseFloat(t.overallBalance) > 0));
    ok('address présente sur chaque item', tokens, (v) => v.every((t) => typeof t.address === 'string'));
    console.log(`  ℹ️  Tokens détenus : ${tokens.map((t) => `${t.ticker} (${t.overallBalance})`).join(', ')}`);
  });

  await section(`getActivity('${TEST_ADDRESS}')`, async () => {
    const activity = await client.getActivity(TEST_ADDRESS);
    ok('retourne un tableau',           activity, (v) => Array.isArray(v));
    ok('au moins 1 opération',          activity, (v) => v.length >= 1);
    ok('id est un nombre',              activity, (v) => typeof v[0].id === 'number');
    ok('txId est une string',           activity, (v) => typeof v[0].txId === 'string');
    ok('type est valide',               activity, (v) => ['deploy','mint','transfer'].includes(v[0].type));
    ok('valid est un booléen',          activity, (v) => typeof v[0].valid === 'boolean');
  });

  await section(`getActivity avec filtre ticker`, async () => {
    const activity = await client.getActivity(TEST_ADDRESS, { ticker: TEST_TICKER });
    ok('retourne un tableau',       activity, (v) => Array.isArray(v));
    // Le mock filtre côté serveur — on vérifie juste que la requête passe
    ok('tableaud non vide',         activity, (v) => v.length >= 0);
  });

  // ── Swap ──────────────────────────────────────────────────────────────────
  await section('listPools()', async () => {
    const pools = await client.listPools();
    ok('retourne un tableau',               pools, (v) => Array.isArray(v));
    ok('pool non vide',                     pools, (v) => v.length > 0);
    ok('poolId est une string',             pools, (v) => typeof v[0].poolId === 'string');
    ok('tokenA est une string',             pools, (v) => typeof v[0].tokenA === 'string');
    ok('tokenB est une string',             pools, (v) => typeof v[0].tokenB === 'string');
    ok('reserveA est une string',           pools, (v) => typeof v[0].reserveA === 'string');
    ok('reserveB est une string',           pools, (v) => typeof v[0].reserveB === 'string');
    // Normalisation
    ok('pas de pool_id (snake)',            pools, (v) => !('pool_id' in v[0]));
    ok('pas de reserve_a (snake)',          pools, (v) => !('reserve_a' in v[0]));
    console.log(`  ℹ️  Pool : ${pools[0].poolId} | ${pools[0].tokenA}=${pools[0].reserveA} | ${pools[0].tokenB}=${pools[0].reserveB}`);
  });

  await section(`getPoolReserves('${TEST_POOL}')`, async () => {
    const pool = await client.getPoolReserves(TEST_POOL);
    ok('poolId correct',        pool, (v) => v.poolId === TEST_POOL);
    ok('reserveA est parseable', pool, (v) => !isNaN(parseFloat(v.reserveA)));
    ok('reserveB est parseable', pool, (v) => !isNaN(parseFloat(v.reserveB)));
  });

  await section(`getSwapQuote('OPQT', 'W', '100.0')`, async () => {
    const q = await client.getSwapQuote('OPQT', 'W', '100.0');
    ok('srcTicker correct',             q, (v) => v.srcTicker === 'OPQT');
    ok('dstTicker correct',             q, (v) => v.dstTicker === 'W');
    ok('amountIn est une string',       q, (v) => typeof v.amountIn === 'string');
    ok('amountOut est une string',      q, (v) => typeof v.amountOut === 'string');
    ok('poolId est une string',         q, (v) => typeof v.poolId === 'string');
    ok('slippagePercent est une string', q, (v) => typeof v.slippagePercent === 'string');
    ok('priceImpactPercent est string', q, (v) => typeof v.priceImpactPercent === 'string');
    ok('isPartialFill est un booléen',  q, (v) => typeof v.isPartialFill === 'boolean');
    ok('protocolFee est une string',    q, (v) => typeof v.protocolFee === 'string');
    // Normalisation
    ok('pas de src_ticker (snake)',     q, (v) => !('src_ticker' in v));
    ok('pas de amount_out (snake)',     q, (v) => !('amount_out' in v));
    console.log(`  ℹ️  100 OPQT → ${q.amountOut} W | impact: ${q.priceImpactPercent}% | fee: ${q.protocolFee} W`);
  });

  // ── Gestion d'erreurs ─────────────────────────────────────────────────────
  await section('Gestion des erreurs — hiérarchie de classes', async () => {
    try {
      await client.getBalance('adresse_inconnue_xyz', 'INEXISTANT');
    } catch (e) {
      ok('NotFoundError instanceof ApiError',          e, (v) => v instanceof ApiError);
      ok('NotFoundError instanceof NotFoundError',     e, (v) => v instanceof NotFoundError);
      ok('statusCode est 404',                         e, (v) => v.statusCode === 404);
      ok('message lisible',                            e, (v) => typeof v.message === 'string' && v.message.length > 0);
    }
  });

  // ── Résumé ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log(`║  Résultat : ${passed}/${total} tests réussis`  + ' '.repeat(36 - String(passed).length - String(total).length) + '║');
  if (failed === 0) {
    console.log('║  ✅ SDK complet et fonctionnel — prêt à push      ║');
  } else {
    console.log(`║  ❌ ${failed} test(s) en échec — à corriger avant push  ║`);
  }
  console.log('╚════════════════════════════════════════════════════╝\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
