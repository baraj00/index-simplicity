/**
 * Mock server simulant l'API Simplicity Indexer.
 * Zéro dépendance — Node.js pur.
 * Usage : node mock-server.js
 */

const http = require('http');

const PORT = 8080;

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

const MOCK_DATA = {
  health: { status: 'ok' },

  status: {
    current_block_height_network: 942000,
    last_indexed_block_main_chain: 941998,
    last_indexed_brc20_op_block: 941995,
  },

  tokens: [
    {
      ticker: 'OPQT',
      decimals: 18,
      max_supply: '21000000',
      limit_per_mint: '1000',
      actual_deploy_txid_for_api: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
      deploy_tx_id: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
      deploy_block_height: 800000,
      deploy_timestamp: '2024-01-01T00:00:00Z',
      creator_address: 'bc1pxyxfsv2zv0fdn433m78kkd0fcqsdhfn5k4udrr',
      remaining_supply: '15000000',
      current_supply: '6000000',
      holders: 1247,
    },
    {
      ticker: 'W',
      decimals: 8,
      max_supply: '100000000',
      limit_per_mint: '500',
      actual_deploy_txid_for_api: 'def789abc123def789abc123def789abc123def789abc123def789abc123def7',
      deploy_tx_id: 'def789abc123def789abc123def789abc123def789abc123def789abc123def7',
      deploy_block_height: 820000,
      deploy_timestamp: '2024-03-15T12:00:00Z',
      creator_address: 'bc1qw508d6qejhtbchxetphmssq2zm5v29qqfqj7lk',
      remaining_supply: '88000000',
      current_supply: '12000000',
      holders: 3892,
    },
  ],

  balances: {
    'bc1ptest123': {
      OPQT: {
        pkscript: '76a914abc123',
        ticker: 'OPQT',
        wallet: 'bc1ptest123',
        overall_balance: '5000.000000000000000000',
        available_balance: '3500.000000000000000000',
        block_height: 941995,
      },
      W: {
        pkscript: '76a914abc456',
        ticker: 'W',
        wallet: 'bc1ptest123',
        overall_balance: '12500.00000000',
        available_balance: '12500.00000000',
        block_height: 941990,
      },
    },
  },

  history: [
    {
      id: 1,
      tx_id: 'aaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee5',
      txid: 'aaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee5',
      op: 'mint',
      ticker: 'OPQT',
      amount: '1000',
      block_height: 941000,
      block_hash: '000000000000000000025c4f0c8981c7095257ce47c35b19aec03f468fce7b72',
      tx_index: 3,
      timestamp: '2026-03-01T10:00:00Z',
      from_address: null,
      to_address: 'bc1ptest123',
      valid: true,
    },
    {
      id: 2,
      tx_id: 'bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff6',
      txid: 'bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff6',
      op: 'transfer',
      ticker: 'OPQT',
      amount: '500',
      block_height: 941500,
      block_hash: '000000000000000000035c4f0c8981c7095257ce47c35b19aec03f468fce7b73',
      tx_index: 7,
      timestamp: '2026-04-01T14:30:00Z',
      from_address: 'bc1qsender000',
      to_address: 'bc1ptest123',
      valid: true,
    },
    {
      id: 3,
      tx_id: 'ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff666aaa1',
      txid: 'ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff666aaa1',
      op: 'mint',
      ticker: 'W',
      amount: '500',
      block_height: 941800,
      block_hash: '000000000000000000045c4f0c8981c7095257ce47c35b19aec03f468fce7b74',
      tx_index: 12,
      timestamp: '2026-04-20T09:15:00Z',
      from_address: null,
      to_address: 'bc1ptest123',
      valid: true,
    },
  ],

  pools: [
    {
      pool_id: 'OPQT-W',
      token_a: 'OPQT',
      token_b: 'W',
      reserve_a: '500000.000000000000000000',
      reserve_b: '250000.00000000',
      last_updated_height: 941900,
    },
  ],
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function router(url) {
  const path = url.split('?')[0];

  if (path === '/v1/indexer/brc20/health') return MOCK_DATA.health;
  if (path === '/v1/indexer/brc20/status') return MOCK_DATA.status;
  if (path === '/v1/indexer/brc20/list') return MOCK_DATA.tokens;

  const tickerInfo = path.match(/^\/v1\/indexer\/brc20\/([^/]+)\/info$/);
  if (tickerInfo) {
    const ticker = decodeURIComponent(tickerInfo[1]).toUpperCase();
    const token = MOCK_DATA.tokens.find((t) => t.ticker === ticker);
    if (!token) return null; // → 404
    return token;
  }

  const tickerHolders = path.match(/^\/v1\/indexer\/brc20\/([^/]+)\/holders$/);
  if (tickerHolders) {
    return Object.values(MOCK_DATA.balances).flatMap((addr) =>
      Object.values(addr),
    );
  }

  const tickerHistory = path.match(/^\/v1\/indexer\/brc20\/([^/]+)\/history$/);
  if (tickerHistory) {
    const ticker = decodeURIComponent(tickerHistory[1]).toUpperCase();
    return MOCK_DATA.history.filter((op) => op.ticker === ticker);
  }

  const addrBalance = path.match(
    /^\/v1\/indexer\/address\/([^/]+)\/brc20\/([^/]+)\/info$/,
  );
  if (addrBalance) {
    const address = decodeURIComponent(addrBalance[1]);
    const ticker = decodeURIComponent(addrBalance[2]).toUpperCase();
    const balance = MOCK_DATA.balances[address]?.[ticker];
    if (!balance) return null; // → 404
    return balance;
  }

  const addrHistoryAll = path.match(
    /^\/v1\/indexer\/address\/([^/]+)\/history\/all$/,
  );
  if (addrHistoryAll) {
    const address = decodeURIComponent(addrHistoryAll[1]);
    const ops = MOCK_DATA.history.filter(
      (op) => op.to_address === address || op.from_address === address,
    );
    return { data: ops, total: ops.length };
  }

  const addrHistory = path.match(
    /^\/v1\/indexer\/address\/([^/]+)\/history$/,
  );
  if (addrHistory) {
    const address = decodeURIComponent(addrHistory[1]);
    return MOCK_DATA.history.filter(
      (op) => op.to_address === address || op.from_address === address,
    );
  }

  if (path === '/v1/indexer/swap/pools') return MOCK_DATA.pools;

  const poolReserves = path.match(/^\/v1\/indexer\/swap\/pools\/([^/]+)\/reserves$/);
  if (poolReserves) {
    const poolId = decodeURIComponent(poolReserves[1]);
    const pool = MOCK_DATA.pools.find((p) => p.pool_id === poolId);
    if (!pool) return null; // → 404
    return pool;
  }

  if (path === '/v1/indexer/swap/quote') {
    return {
      src_ticker: 'OPQT',
      dst_ticker: 'W',
      amount_in: '100.0',
      amount_out: '49.851192',
      slippage_percent: '0.5',
      expected_rate: '0.5',
      actual_rate: '0.498511',
      is_partial_fill: false,
      protocol_fee: '0.149553',
      pool_id: 'OPQT-W',
      reserve_in_before: '500000.0',
      reserve_out_before: '250000.0',
      reserve_in_after: '500100.0',
      reserve_out_after: '249950.14880800',
      k_constant: '125000000000000.0',
      price_impact: '0.001',
      price_impact_percent: '0.1',
    };
  }

  if (path === '/') return { message: 'Simplicity Indexer API (mock)' };

  return undefined; // → 404
}

// ---------------------------------------------------------------------------
// Serveur HTTP
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const result = router(req.url);

  if (result === undefined || result === null) {
    res.writeHead(404);
    res.end(JSON.stringify({ detail: 'Not found' }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify(result));

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
});

server.listen(PORT, () => {
  console.log(`\n✅ Mock Simplicity Indexer démarré sur http://localhost:${PORT}`);
  console.log('   Arrêter avec Ctrl+C\n');
});
