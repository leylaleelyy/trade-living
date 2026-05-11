# Session Handoff

## Restart Path

1. Run `pwd` and confirm the repository is `/Users/bytedance/Documents/trade-living`.
2. Read `AGENTS.md`, `docs/PRODUCT.md`, and `docs/ARCHITECTURE.md`.
3. Run `./init.sh` (expects: 9 test files / 34 tests pass, build succeeds).
4. Open `feature_list.json` — original 7 features plus `feat-008`, `feat-010`, and `feat-012` are done.
5. Check this file and `progress.md` for context.

## Current State

**All original planned features are complete and validated against live Longbridge data. The provider abstraction, adapter contract matrix, and Markdown interpretation template are also complete.**

The CLI supports 7 commands (`analyze`, `momentum`, `triple`, `force`, `risk`, `portfolio`, `report`), all working in both offline (sample data) and live (`--live`) modes.

Longbridge CLI is now behind `TradeLivingDataProvider`/`MarketDataProvider`/`PortfolioDataProvider` contracts, so command and service code no longer depends directly on Longbridge CLI implementation details.

`report --markdown` and `analyze --markdown` now render structured AI-facing interpretation reports with highlighted conclusions, colored signal badges, icon markers, visual score bars, price ladder, risk warnings, and a trade-plan checklist.

## What Was Done This Session (2026-05-11 adapter contracts)

### Adapter Contract Test Matrix

Completed `feat-010` to lock Longbridge external payload variants into stable internal domain models before adding more providers.

1. **Quote contracts** — Covered array payloads, wrapped `data`, `last`, `last_done`, `lastDone`, `change_rate`, and `changeRate`.
2. **K-line contracts** — Covered `data.candlesticks`, `data.list`, `data.items`, ISO dates, and numeric timestamp strings.
3. **Holding contracts** — Covered live positions without market fields, fixture-style market fields, and camelCase internal-like payloads.
4. **Failure contracts** — Added rejection cases for missing quote price, missing K-line timestamp, and missing holding cost basis.

### Verification

- `npm run check` — pass.
- `npm test` — pass, 9 test files / 34 tests.
- `npm run build` — pass.
- `./init.sh` — pass.

## What Was Done This Session (2026-05-11 report template)

### Markdown Interpretation Template

Added `feat-012` after the AMZN analysis flow showed that returned interpretation content should be reusable, visually prioritized, and easier for AI/user consumption.

1. **Structured template** — `AnalyzeResult` Markdown output now uses sections for key conclusion, signal overview, visual scores, price map, divergence/risk, and trade plan.
2. **Visual priority** — Added colored HTML span badges, icon markers, score bars, and a text price ladder.
3. **Fallback preserved** — Generic Markdown rows still use the existing fallback path for non-analysis outputs.
4. **Tests** — Added regression coverage to ensure analysis Markdown is structured and no longer rendered as raw JSON.

### Verification

- `npm run dev -- report AMZN.US --markdown` — produced structured template output.
- `./init.sh` — pass, 8 test files / 22 tests.

## What Was Done This Session (2026-05-11 evening)

### Data Provider Decoupling

Added the first prioritized optimization from the Longbridge CLI coupling discussion:

1. **Requirement tracking** — Added `feat-008` through `feat-011` to `feature_list.json`.
   - `feat-008` Data Provider Abstraction — done.
   - `feat-009` Longbridge SDK Or API Provider — todo.
   - `feat-010` Adapter Contract Test Matrix — todo.
   - `feat-011` AI JSON Output Contract — todo.

2. **Stable provider contracts** — Added `src/adapters/data-provider.ts` with market, portfolio, enriched portfolio, and combined data provider interfaces.

3. **Provider implementations** — Added `OfflineDataProvider` and `createDataProvider()`. `LongbridgeCliAdapter` now implements the combined provider interface.

4. **Command/service decoupling** — Updated `src/cli.ts`, `src/market/quote.service.ts`, `src/market/kline.service.ts`, and `src/portfolio/holdings.service.ts` to depend on provider interfaces instead of `LongbridgeCliAdapter`.

5. **Offline sample data ownership** — Moved reusable sample K-line/quote/holding data into `src/market/sample-data.ts`.

### Verification

- `npm run check` — pass.
- `npm test` — pass, 7 test files / 21 tests.
- `npm run build` — pass.

## What Was Done This Session (2026-05-11 afternoon)

### Bug Fixes for Live Environment

Three bugs were discovered and fixed when running `--live portfolio` against the real Longbridge API:

1. **Schema mismatch** — `longbridge positions --format json` returns only `symbol`, `quantity`, `cost_price`, `name`, `currency`, `available`, `market`. It does NOT include `marketPrice`, `marketValue`, or `unrealizedPnl`. The Zod schema previously required these fields and threw a ZodError for all 24 holdings.
   - **Fix:** Made `marketPrice`, `marketValue`, `unrealizedPnl` optional in `Holding` type and schema. Added `name` and `currency` fields.

2. **Missing market data** — With the fields now optional, holdings lacked real-time pricing.
   - **Fix:** Added `getEnrichedHoldings()` in `LongbridgeCliAdapter`. It fetches `longbridge quote <symbol>` for each holding and computes `marketPrice`, `marketValue`, and `unrealizedPnl`.

3. **API rate limiting** — The initial implementation used `Promise.all` to fetch 24 quotes concurrently. Longbridge's API silently dropped ~40% of requests under concurrent load.
   - **Fix:** Changed to sequential `for...of` loop. All 15 stock/ETF quotes now succeed consistently.

4. **Option symbols unsupported** — LEAPS options (e.g., `PLTR270115C150000.US`) return empty arrays from the quote API.
   - **Fix:** Added `isOptionSymbol()` regex detector. Options are skipped during enrichment and show cost-only data.

### Files Changed

| File | Change |
|------|--------|
| `src/domain/types.ts` | `marketPrice`/`marketValue`/`unrealizedPnl` → optional; added `name`, `currency` |
| `src/adapters/longbridge.schemas.ts` | Schema accepts missing market fields; parses `name`/`currency` |
| `src/adapters/longbridge-cli.adapter.ts` | Added `getEnrichedHoldings()`, `isOptionSymbol()` |
| `src/cli.ts` | Portfolio uses `getEnrichedHoldings()` |
| `src/risk/portfolio-risk.service.ts` | Fallback math for optional fields |
| `src/portfolio/account.service.ts` | Fallback math for optional fields |

### Live Test Results

All 6 CLI commands tested against authenticated Longbridge Terminal:

| Command | Result |
|---------|--------|
| `--live analyze AAPL.US --start 2024-01-01` | Pass — trending_bull, momentum 79, quality A |
| `--live momentum AAPL.US --start 2024-01-01` | Pass — score 79, all factors |
| `--live triple AAPL.US --start 2024-01-01` | Pass — bullish, neutral decision |
| `--live force AAPL.US --start 2024-01-01` | Pass — EMA2/EMA13 values |
| `--live report AAPL.US --start 2024-01-01` | Pass — full analysis report |
| `--live portfolio` | Pass — 15/15 stocks enriched, 9 options cost-only |

## Known External Requirements

- `longbridge` CLI installed at `/opt/homebrew/bin/longbridge` and authenticated (token valid, CN region).
- Global connectivity to `openapi.longbridge.com` times out; CN endpoint `openapi.longbridge.cn` works (20ms).
- npm reported 5 moderate vulnerabilities in dev dependencies; `npm audit --omit=dev` found 0.

## Next Good Tasks

Priority order:

1. **Longbridge SDK/API provider (`feat-009`)** — Add a non-CLI provider implementation behind the new provider contracts.
2. **AI JSON output contract (`feat-011`)** — Document and test stable machine-consumable JSON for AI callers.
3. **Bearish/volatile fixture suites** — All current test fixtures model bullish scenarios. Add fixture data for bear markets, range-bound, and high-volatility regimes to improve coverage.
4. **Portfolio Markdown template** — Extend the visual template approach to `portfolio --markdown`.
