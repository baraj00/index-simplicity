# @universal-protocol/sdk

TypeScript SDK for the [Universal Protocol](https://whitenode.co/docs) — a BRC-20 extension on Bitcoin using `OP_RETURN`.

Wraps the [Simplicity Indexer](https://github.com/The-Universal-BRC-20-Extension/Simplicity) REST API.

## Requirements

- Node.js ≥ 18.0.0 (uses native `fetch` and `AbortController`)

## Install

```bash
npm install github:baraj00/index-simplicity
```

Or with a specific version tag:

```bash
npm install github:baraj00/index-simplicity#v0.1.0
```

## Usage

```ts
import { UniversalClient } from '@universal-protocol/sdk';

const client = new UniversalClient({
  baseUrl: 'https://your-indexer-url',
  apiKey: process.env.INDEXER_API_KEY, // optional
  timeoutMs: 10_000,  // default: 10 000 ms
  maxRetries: 3,      // default: 3 (exponential backoff on 5xx)
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

// Wrap service
const contracts = await client.listWrapContracts();
const wrapTvl   = await client.getWrapTvl();
const metrics   = await client.getWrapMetrics();

// Indexer health & status
const health = await client.health();
const status = await client.status();
console.log(status.networkBlockHeight, status.lastIndexedBlock);
```

## Error handling

```ts
import { NotFoundError, ApiError, ConfigError } from '@universal-protocol/sdk';

try {
  const token = await client.getToken('DOESNOTEXIST');
} catch (e) {
  if (e instanceof NotFoundError) {
    console.log('Token not found'); // HTTP 404
  } else if (e instanceof ApiError) {
    console.log('API error', e.statusCode, e.message);
  } else if (e instanceof ConfigError) {
    console.log('Bad input', e.message); // invalid ticker / address
  }
}
```

## API coverage

| Method | Endpoint |
|---|---|
| `health()` | `GET /v1/indexer/brc20/health` |
| `status()` | `GET /v1/indexer/brc20/status` |
| `listTokens(options?)` | `GET /v1/indexer/brc20/list` |
| `listAllTokens(options?)` | `GET /v1/indexer/brc20/list/all` |
| `getToken(ticker)` | `GET /v1/indexer/brc20/{ticker}/info` |
| `getTokenHolders(ticker, options?)` | `GET /v1/indexer/brc20/{ticker}/holders` |
| `getAllTokenHolders(ticker)` | `GET /v1/indexer/brc20/{ticker}/holders/all` |
| `getTokenHistory(ticker, options?)` | `GET /v1/indexer/brc20/{ticker}/history` |
| `getAllTokenHistory(ticker)` | `GET /v1/indexer/brc20/history/all?ticker=...` |
| `getTokenHistoryByTx(ticker, txid)` | `GET /v1/indexer/brc20/{ticker}/history/{txid}` |
| `getTokenHistoryByHeight(height, options?)` | `GET /v1/indexer/brc20/history/{height}` |
| `getAllTokenHistoryByHeight(height)` | `GET /v1/indexer/brc20/history/{height}/all` |
| `getBalance(address, ticker)` | `GET /v1/indexer/address/{address}/brc20/{ticker}/info` |
| `getTokens(address)` | derived — calls balance per held ticker |
| `getActivity(address, options?)` | `GET /v1/indexer/address/{address}/history` |
| `getTickerHistory(address, ticker, options?)` | `GET /v1/indexer/address/{address}/brc20/{ticker}/history` |
| `checkPending(address, ticker)` | `GET /v1/indexer/address/{address}/brc20/{ticker}/pending` |
| `validateWrapMint(rawTxHex)` | `POST /v1/indexer/validate/wrap-mint` |
| `validateAddressFromWitness(rawTxHex)` | `POST /v1/indexer/validate/address-from-witness` |
| `listPools(options?)` | `GET /v1/indexer/swap/pools` |
| `getSwapTvl(ticker)` | `GET /v1/indexer/swap/tvl/{ticker}` |
| `listSwapPositions(options?)` | `GET /v1/indexer/swap/positions` |
| `getSwapPosition(id)` | `GET /v1/indexer/swap/positions/{id}` |
| `getExpiringSwapPositions(heightLte, options?)` | `GET /v1/indexer/swap/positions/expiring` |
| `getOwnerSwapPositions(owner, options?)` | `GET /v1/indexer/swap/owner/{owner}/positions` |
| `listWrapContracts(options?)` | `GET /v1/indexer/wrap/contracts` |
| `getWrapContract(scriptAddress)` | `GET /v1/indexer/wrap/contracts/{scriptAddress}` |
| `getWrapTvl()` | `GET /v1/indexer/wrap/tvl` |
| `getWrapMetrics()` | `GET /v1/indexer/wrap/metrics` |

## Structure

```
src/
  client.ts              # UniversalClient — main entry point
  services/
    address.service.ts   # getBalance, getTokens, getActivity, getTickerHistory
    token.service.ts     # listTokens, getToken, getHolders, getHistory, …
    indexer.service.ts   # health, status
    swap.service.ts      # listPools, getTvl, listPositions, getOwnerPositions, …
    mempool.service.ts   # checkPending
    validator.service.ts # validateWrapMint, validateAddressFromWitness
    wrap.service.ts      # listContracts, getContract, getTvl, getMetrics
  types/
    address.types.ts
    brc20.types.ts
    swap.types.ts
    mempool.types.ts
    validator.types.ts
    wrap.types.ts
    common.types.ts
  utils/
    http.ts              # fetch wrapper — timeout, retry, error handling
    errors.ts            # UniversalSDKError, ApiError, NotFoundError, ConfigError
    normalize.ts         # snake_case → camelCase normalization
    validate.ts          # input validation helpers
examples/
  mock-server.js         # local mock of the Simplicity API (no deps)
  test.js                # test script against the mock server
```

## Based on

- [Simplicity Indexer](https://github.com/The-Universal-BRC-20-Extension/Simplicity) — official openapi.yaml
- [Universal Protocol docs](https://whitenode.co/docs)
