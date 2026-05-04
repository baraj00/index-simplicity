# @universal-protocol/sdk

TypeScript SDK for the [Universal Protocol](https://whitenode.co/docs) — a BRC-20 extension on Bitcoin using `OP_RETURN`.

Wraps the [Simplicity Indexer](https://github.com/The-Universal-BRC-20-Extension/Simplicity) REST API.

## Install

```bash
npm install
npm run build
```

## Usage

```ts
import { UniversalClient } from './dist/index';

const client = new UniversalClient({
  baseUrl: 'https://your-indexer-url',
  apiKey: 'your-api-key', // optional
});

// List all deployed tokens
const tokens = await client.listTokens();
console.log(tokens[0].ticker, tokens[0].holders);

// Get token info
const token = await client.getToken('OPQT');
console.log(token.currentSupply, token.isCurve);

// Get address balance for a specific token
const balance = await client.getBalance('bc1p...', 'OPQT');
console.log(balance.overallBalance);

// Get all tokens held by an address
const held = await client.getTokens('bc1p...');

// Get address activity
const activity = await client.getActivity('bc1p...', { ticker: 'OPQT' });

// Swap — list active pools
const pools = await client.listPools();
console.log(pools[0].src, '->', pools[0].dst, '|', pools[0].activePositions, 'positions');

// Swap — TVL for a token
const tvl = await client.getSwapTvl('WTF');
console.log(tvl.tvlEstimate);

// Swap — positions for an address
const positions = await client.getOwnerSwapPositions('bc1p...', { status: 'active' });

// Indexer health & status
const health = await client.health();
const status = await client.status();
console.log(status.networkBlockHeight, status.lastIndexedBlock);
```

## Error handling

```ts
import { NotFoundError, ApiError } from './dist/index';

try {
  const token = await client.getToken('DOESNOTEXIST');
} catch (e) {
  if (e instanceof NotFoundError) {
    console.log('Token not found'); // 404
  } else if (e instanceof ApiError) {
    console.log('API error', e.statusCode, e.message);
  }
}
```

## API coverage

| Method | Endpoint |
|---|---|
| `health()` | `GET /v1/indexer/brc20/health` |
| `status()` | `GET /v1/indexer/brc20/status` |
| `listTokens()` | `GET /v1/indexer/brc20/list` |
| `getToken(ticker)` | `GET /v1/indexer/brc20/{ticker}/info` |
| `getTokenHolders(ticker)` | `GET /v1/indexer/brc20/{ticker}/holders` |
| `getTokenHistory(ticker)` | `GET /v1/indexer/brc20/{ticker}/history` |
| `getBalance(address, ticker)` | `GET /v1/indexer/address/{address}/brc20/{ticker}/info` |
| `getTokens(address)` | derived from address history |
| `getActivity(address)` | `GET /v1/indexer/address/{address}/history` |
| `listPools()` | `GET /v1/indexer/swap/pools` |
| `getSwapTvl(ticker)` | `GET /v1/indexer/swap/tvl/{ticker}` |
| `listSwapPositions()` | `GET /v1/indexer/swap/positions` |
| `getOwnerSwapPositions(owner)` | `GET /v1/indexer/swap/owner/{owner}/positions` |

## Structure

```
src/
  client.ts              # UniversalClient — main entry point
  services/
    address.service.ts   # getBalance, getTokens, getActivity
    token.service.ts     # listTokens, getToken, getHolders, getHistory
    indexer.service.ts   # health, status
    swap.service.ts      # listPools, getTvl, listPositions, getOwnerPositions
  types/
    address.types.ts
    brc20.types.ts
    swap.types.ts
    common.types.ts
  utils/
    http.ts              # fetch wrapper with error handling
    errors.ts            # UniversalSDKError, ApiError, NotFoundError, ConfigError
    normalize.ts         # snake_case → camelCase normalization
examples/
  mock-server.js         # local mock of the Simplicity API (no deps)
  test.js                # test script against the mock server
```

## Based on

- [Simplicity Indexer](https://github.com/The-Universal-BRC-20-Extension/Simplicity) — official openapi.yaml
- [Universal Protocol docs](https://whitenode.co/docs)
