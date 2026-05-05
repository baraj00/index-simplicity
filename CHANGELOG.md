# Changelog

All notable changes to `@universal-protocol/sdk` are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.1.1] — 2026-05-05

### Changed
- Build tool migrated from `tsc` to `tsup` — dual CJS + ESM output (`dist/index.js` / `dist/index.mjs`)
- `package.json` now exposes correct `exports` map with `types`, `import`, `require` conditions
- `tsconfig.json` `rootDir` changed from `"."` to `"src"` — consistent with tsup entry point

### Added
- **Timeout**: all HTTP requests abort after `timeoutMs` ms (default 10 000 ms) via `AbortController`
- **Retry**: exponential backoff on 5xx responses — 200ms / 400ms / 800ms (configurable via `maxRetries`)
- **Input validation**: `src/utils/validate.ts` — `assertTicker`, `assertAddress`, `assertPositiveInt`, `assertNonEmptyString`
- **`UniversalClientOptions`**: new fields `timeoutMs` and `maxRetries` (passed through to `HttpClient`)
- `README.md` — correct install instructions, full API table, error handling section, Node.js ≥ 18 requirement
- `CHANGELOG.md` — this file
- `examples/basic-usage.ts` — TypeScript usage example
- Unit tests with Vitest (`validate.test.ts`, `http.test.ts`)

### Fixed
- `getTokens()` — replaced unbounded `Promise.allSettled` with chunked concurrency (10 at a time)
- Timeout detection now uses `err.name === 'AbortError'` instead of fragile string matching
- `assertAddress` no longer rejects Taproot (`bc1p`) or testnet (`tb1`) addresses
- All error messages and JSDoc comments translated to English

### Security
- `tsup` build excludes `examples/` — previously could pollute compilation scope

---

## [0.1.0] — 2026-04-15

### Added
- Initial release
- 7 services: `IndexerService`, `TokenService`, `AddressService`, `SwapService`, `MempoolService`, `ValidatorService`, `WrapService`
- Full type coverage from `indexer.yaml` (openapi spec)
- `UniversalClient` facade — single entry point for all services
- `ApiError`, `NotFoundError`, `ConfigError` error hierarchy
- snake_case → camelCase normalization layer
- Mock server + test script in `examples/`
