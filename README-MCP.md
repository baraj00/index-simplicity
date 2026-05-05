# Universal Protocol MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that exposes the Universal Protocol Simplicity Indexer API as AI-accessible tools. Use it with Claude Desktop, Cursor, or any MCP-compatible AI client.

---

## Quick Start

### Build

```bash
npm run build:mcp
# output: dist-mcp/index.js
```

### Run locally

```bash
INDEXER_URL=https://your-indexer node dist-mcp/index.js
```

---

## Installation

> **Note — not yet on npm.** Once `@universal-protocol/sdk` is published you can replace the `node` invocation below with `npx -y @universal-protocol/sdk`. For now, clone the repo and build locally first.

### 1. Build locally

```bash
git clone https://github.com/baraj00/index-simplicity.git universal-sdk
cd universal-sdk
npm install
npm run build:mcp
# → dist-mcp/index.js
```

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "universal-protocol": {
      "command": "node",
      "args": ["/path/to/universal-sdk/dist-mcp/index.js"],
      "env": {
        "INDEXER_URL": "https://your-indexer-url",
        "INDEXER_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Once published to npm**, replace the above with:

```json
{
  "mcpServers": {
    "universal-protocol": {
      "command": "npx",
      "args": ["-y", "@universal-protocol/sdk"],
      "env": {
        "INDEXER_URL": "https://your-indexer-url",
        "INDEXER_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "universal-protocol": {
      "command": "node",
      "args": ["/path/to/universal-sdk/dist-mcp/index.js"],
      "env": {
        "INDEXER_URL": "http://localhost:8080"
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `INDEXER_URL` | `http://localhost:8080` | Base URL of the Simplicity indexer |
| `INDEXER_API_KEY` | — | API key sent as `X-API-Key` header (optional) |
| `INDEXER_TIMEOUT_MS` | `10000` | Request timeout in milliseconds |
| `INDEXER_MAX_RETRIES` | `3` | Max retries on 5xx responses (exponential backoff) |

---

## Available Tools (25)

### Indexer (2)

| Tool | Description |
|---|---|
| `health` | Check if the indexer is operational — returns `{ status: "ok" }` |
| `status` | Get sync state: network block height vs. last indexed block |

### Token (6)

| Tool | Key Parameters | Description |
|---|---|---|
| `list_tokens` | `limit?`, `skip?` | List all deployed BRC-20 tokens |
| `get_token` | `ticker` | Get token details (supply, holders, deploy info) |
| `get_token_holders` | `ticker`, `limit?`, `skip?` | List all holders with balances |
| `get_token_history` | `ticker`, `op_type?`, `limit?`, `skip?` | Operation history (deploy / mint / transfer) |
| `get_token_history_by_tx` | `ticker`, `txid` | Operations linked to a specific TXID |
| `get_history_by_height` | `height`, `limit?`, `skip?` | All operations at a Bitcoin block height |

### Address (5)

| Tool | Key Parameters | Description |
|---|---|---|
| `get_balance` | `address`, `ticker` | BRC-20 balance for an address |
| `get_tokens` | `address` | All tokens held by an address |
| `get_activity` | `address`, `ticker?`, `op_type?`, `limit?` | Operation history for an address |
| `get_address_ticker_history` | `address`, `ticker`, `limit?`, `skip?` | History scoped to a single token |
| `check_pending` | `address`, `ticker` | Check for unconfirmed mempool transfers |

### Swap (6)

| Tool | Key Parameters | Description |
|---|---|---|
| `list_pools` | `src?`, `dst?` | List active swap pools |
| `get_swap_tvl` | `ticker` | TVL for a token in the swap module |
| `list_swap_positions` | `owner?`, `src?`, `dst?`, `status?`, `limit?`, `offset?` | List positions with filters |
| `get_owner_swap_positions` | `owner`, `status?`, `limit?`, `offset?` | All positions of an address |
| `get_swap_position` | `id` | Get a position by numeric ID |
| `get_expiring_swap_positions` | `height_lte`, `limit?`, `offset?` | Positions expiring at or before a block height |

### Wrap (4)

| Tool | Key Parameters | Description |
|---|---|---|
| `list_wrap_contracts` | `status?`, `owner?`, `limit?`, `offset?` | List Wrap contracts |
| `get_wrap_contract` | `script_address` | Get a contract by its Taproot script address |
| `get_wrap_tvl` | — | Total Value Locked in the Wrap module |
| `get_wrap_metrics` | — | Global metrics: active contracts, TVL, counts |

### Validator (2)

| Tool | Key Parameters | Description |
|---|---|---|
| `validate_wrap_mint` | `raw_tx_hex` | Validate a Wrap Mint transaction |
| `validate_address_from_witness` | `raw_tx_hex` | Reconstruct address from transaction witness |

---

## Example Prompts

- _"Is the Universal Protocol indexer synced with the Bitcoin network?"_
- _"How many holders does the ORDI token have? Show me the top 10."_
- _"What BRC-20 tokens does address bc1p… hold and what are their balances?"_
- _"Are there any W token swap positions expiring before block 850000?"_
- _"Validate this raw transaction hex and tell me if it's a valid Wrap Mint: 0200000…"_

---

## Error Handling

All tools return a structured error when the indexer is unavailable or returns a non-2xx response:

```json
{
  "isError": true,
  "content": [{ "type": "text", "text": "HTTP 404 — ticker not found: XYZ" }]
}
```

The AI client will see the error message and can relay it to the user or retry with corrected parameters.

---

## Architecture

```
mcp/
  index.ts          # #!/usr/bin/env node — stdio entry point
  server.ts         # createMcpServer() — wires client + tools
  utils.ts          # ok() / fail() response helpers
  tools/
    indexer.tools.ts
    token.tools.ts
    address.tools.ts
    swap.tools.ts
    wrap.tools.ts
    validator.tools.ts
  __tests__/
    mcp.test.ts     # ~30 unit tests (fake server + mock client)
```

The MCP server is built separately from the SDK (`build:mcp`) and produces a self-contained CJS bundle in `dist-mcp/`.
