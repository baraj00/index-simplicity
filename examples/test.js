/**
 * Script de test rapide du SDK Universal Protocol.
 * Exécuter avec : node test.js
 */

const { UniversalClient, NotFoundError, ApiError } = require('./dist/index');

const BASE_URL = 'http://localhost:8080';

const client = new UniversalClient({ baseUrl: BASE_URL });

async function run() {
  console.log('=== Universal Protocol SDK — Test ===\n');
  console.log(`Indexeur : ${BASE_URL}\n`);

  // ── 1. Santé de l'indexeur ──────────────────────────────────────────────
  console.log('[ 1 ] health()');
  try {
    const h = await client.health();
    console.log('  ✅', h);
  } catch (e) {
    console.log('  ❌', e.message);
  }

  // ── 2. Statut de synchronisation ───────────────────────────────────────
  console.log('\n[ 2 ] status()');
  try {
    const s = await client.status();
    console.log('  ✅ networkBlockHeight     :', s.networkBlockHeight);
    console.log('  ✅ lastIndexedBlock       :', s.lastIndexedBlock);
    console.log('  ✅ lastBrc20OpBlock       :', s.lastBrc20OpBlock);
    const lag = s.networkBlockHeight - s.lastBrc20OpBlock;
    console.log(`  ✅ Retard indexeur        : ${lag} blocs`);
  } catch (e) {
    console.log('  ❌', e.message);
  }

  // ── 3. Liste des tokens ─────────────────────────────────────────────────
  console.log('\n[ 3 ] listTokens()');
  try {
    const tokens = await client.listTokens();
    console.log(`  ✅ ${tokens.length} token(s) trouvé(s)`);
    if (tokens.length > 0) {
      const t = tokens[0];
      console.log(`  ✅ Premier token : ${t.ticker} | supply: ${t.currentSupply}/${t.maxSupply} | holders: ${t.holders}`);
    }
  } catch (e) {
    console.log('  ❌', e.message);
  }

  // ── 4. Info d'un token spécifique ───────────────────────────────────────
  const TICKER = 'OPQT';
  console.log(`\n[ 4 ] getToken('${TICKER}')`);
  try {
    const token = await client.getToken(TICKER);
    console.log(`  ✅ ticker          : ${token.ticker}`);
    console.log(`  ✅ holders         : ${token.holders}`);
    console.log(`  ✅ currentSupply   : ${token.currentSupply}`);
    console.log(`  ✅ remainingSupply : ${token.remainingSupply}`);
    console.log(`  ✅ deployTimestamp : ${token.deployTimestamp}`);
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log(`  ⚠️  Token '${TICKER}' non trouvé sur cet indexeur`);
    } else {
      console.log('  ❌', e.message);
    }
  }

  // ── 5. Token inexistant → NotFoundError attendu ─────────────────────────
  console.log('\n[ 5 ] getToken("DOESNOTEXIST") — doit lever NotFoundError');
  try {
    await client.getToken('DOESNOTEXIST');
    console.log('  ⚠️  Aucune erreur levée (inattendu)');
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log('  ✅ NotFoundError correctement levée :', e.message);
    } else if (e instanceof ApiError) {
      console.log('  ✅ ApiError :', e.message);
    } else {
      console.log('  ❌ Erreur inattendue :', e.message);
    }
  }

  // ── 6. Pools de swap ─────────────────────────────────────────────────────
  console.log('\n[ 6 ] listPools()');
  try {
    const pools = await client.listPools();
    console.log(`  ✅ ${pools.length} pool(s) trouvé(s)`);
    if (pools.length > 0) {
      const p = pools[0];
      console.log(`  ✅ Pool : ${p.poolId} | ${p.tokenA} reserve: ${p.reserveA} | ${p.tokenB} reserve: ${p.reserveB}`);
    }
  } catch (e) {
    console.log('  ❌', e.message);
  }

  console.log('\n=== Fin des tests ===');
}

run();
