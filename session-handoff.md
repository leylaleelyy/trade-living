# Session Handoff

## Restart Path

1. Run `pwd` and confirm the repository is `/Users/bytedance/Documents/trade-living`.
2. Read `AGENTS.md`, `docs/PRODUCT.md`, and `docs/ARCHITECTURE.md`.
3. Run `./init.sh` (expects: 16 test files / 62 tests pass, build succeeds).
4. Open `feature_list.json` — all tracked features are done.
5. Check this file and `progress.md` for context.

## Current State

**All tracked features are complete and validated.**

The CLI supports 9 command groups (`init`, `daemon`, `analyze`, `momentum`, `triple`, `force`, `risk`, `portfolio`, `report`), with analysis commands working in both offline (sample data) and live (`--live`) modes.

Longbridge CLI is now behind `TradeLivingDataProvider`/`MarketDataProvider`/`PortfolioDataProvider` contracts, so command and service code no longer depends directly on Longbridge CLI implementation details.

`report --markdown` and `analyze --markdown` now render structured AI-facing interpretation reports with highlighted conclusions, colored signal badges, icon markers, visual score bars, price ladder, risk warnings, and a trade-plan checklist.

English report indicators and statuses include Chinese translations in parentheses, for example `Triple Screen（三重滤网）`, `RR（风险收益比）`, `MACD（移动平均收敛/发散）`, and `Force Index（强力指数）`.

The official Longbridge Node.js SDK is available through `--data-provider sdk`. JSON output contracts are documented in `docs/AI_JSON_CONTRACT.md` and tested with executable Zod schemas.

Option holdings can be enriched through external delayed quote providers when configured with `--option-quote-provider tradier|marketdata|auto`. Enriched option holdings include `quoteSource` and `quoteDelay`.

The repository now ships a project-local Codex skill at `.agents/skills/trade-living-cli` for safe AI invocation and Longbridge preflight validation.

`trade-living init` supports interactive first-run setup for Longbridge, Telegram, model provider, daemon logging, and config writing. Analysis output can be explicitly sent to Telegram with `--notify-channel telegram`.

The npm package has been published as `trade-living-cli@0.1.2`; package contents include the compiled `dist/` output.

## What Was Done This Session (2026-05-11 enhancements)

### Reliability And Portfolio Reports

Completed two enhancement features after all core requirements were done:

1. **`feat-015` Bearish Range Volatile Fixture Suites** — Added deterministic bearish, range-bound, and volatile K-line fixtures and analysis coverage.
2. **`feat-016` Portfolio Markdown Template** — Added a structured portfolio Markdown report with overview, allocation bars, holding details, concentration warning, P/L, and quote quality sections.

### Verification

- `npm run dev -- portfolio --markdown` — pass, structured portfolio report produced.
- `./init.sh` — pass, 12 test files / 52 tests.

## What Was Done This Session (2026-05-11 skill)

### Codex Skill For AI Invocation

Added `feat-014` so future agents can safely call this CLI without rediscovering environment checks.

1. **Skill instructions** — Added `SKILL.md` covering preflight, provider selection, JSON vs Markdown usage, option quote handling, and failure modes.
2. **Preflight script** — Added `verify-longbridge-env.sh` to check repository root, Node/npm, `npm run check`, build, Longbridge Terminal, SDK auth, option quote provider tokens, and offline CLI smoke.
3. **Real environment validation** — Preflight passes against the current Longbridge CN environment.

### Verification

- `bash .agents/skills/trade-living-cli/scripts/verify-longbridge-env.sh` — pass.
- `./init.sh` — pass, 12 test files / 48 tests.

## What Was Done This Session (2026-05-11 option quotes)

### Option Quote Provider Abstraction

Added `feat-013` after confirming Longbridge option quotes require OPRA access and the current account returns `no quote access`.

1. **Provider contract** — Added `OptionQuoteProvider`, `OptionQuote`, option symbol detection, mark calculation, and composite fallback behavior.
2. **Tradier adapter** — Converts Longbridge-style option symbols to OCC symbols and parses bid/ask/last, open interest, IV, and Greeks.
3. **MarketData.app adapter** — Adds 24h-delayed fallback support for option quote snapshots.
4. **Portfolio enrichment** — `portfolio` can opt into option quote enrichment with `--option-quote-provider`.
5. **Data quality markers** — Enriched holdings carry `quoteSource` and `quoteDelay`.

### Verification

- `npm run check` — pass.
- `npm test` — pass, 12 test files / 48 tests.
- External live quote calls require `TRADIER_TOKEN` or optional `MARKETDATA_TOKEN`; no provider token is configured in this session.

## What Was Done This Session (2026-05-11 completion)

### SDK Provider And AI JSON Contract

Completed the final two tracked requirements:

1. **`feat-009` Longbridge SDK/API Provider** — Added official `longbridge` SDK dependency and implemented `LongbridgeSdkAdapter` behind `TradeLivingDataProvider`.
2. **Provider selection** — Added `--data-provider <offline|cli|sdk>` and `--longbridge-region <global|cn>`.
3. **SDK auth** — Supports API key env auth and OAuth token-cache discovery from `~/.longbridge/openapi/tokens`.
4. **SDK data paths** — Uses `QuoteContext` for quotes/K-lines and `TradeContext` for positions.
5. **`feat-011` AI JSON Output Contract** — Added `docs/AI_JSON_CONTRACT.md`, `src/report/ai-json-contract.ts`, and contract tests for analyze/report plus portfolio outputs.

### Verification

- `npm run check` — pass.
- `npm test` — pass, 11 test files / 41 tests.
- `npm run build` — pass.
- `longbridge check` — token OK, active CN region, CN endpoint 22ms, global endpoint timeout.
- `npm run dev -- --data-provider sdk --longbridge-region cn --start 2026-01-01 analyze NVDA.US --json` — pass.
- `npm run dev -- --data-provider sdk --longbridge-region cn portfolio --json` — pass, 24 holdings and risk summary returned.

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
   - `feat-009` Longbridge SDK Or API Provider — done.
   - `feat-010` Adapter Contract Test Matrix — done.
   - `feat-011` AI JSON Output Contract — done.

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

1. **Credential rotation** — Rotate any npm or Telegram tokens that were pasted into chat, then store active tokens in environment variables or GitHub Secrets only.
2. **Real init run** — Run `trade-living init` in a TTY for step-by-step setup after `TELEGRAM_BOT_TOKEN` is exported, then inspect `.trade-living/config.json`.
3. **Telegram notification smoke** — With `TELEGRAM_BOT_TOKEN` and chat id configured, run `trade-living --notify-channel telegram --markdown analyze AAPL.US` and confirm the report arrives.
4. **Daemon runtime smoke** — Start a short-interval daemon in a controlled shell, inspect the log file, then stop it with `trade-living daemon stop`.
5. **Published package smoke** — Install or run `trade-living-cli@0.1.2` from npm and verify `trade-living --help`.
6. **Option quote enrichment** — Investigate additional free or user-configurable option quote sources for LEAPS/options currently shown as cost-only when no provider token is configured.
