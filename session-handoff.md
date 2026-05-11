# Session Handoff

## Restart Path

1. Run `pwd` and confirm the repository is `/Users/bytedance/Documents/trade-living`.
2. Read `AGENTS.md`, `docs/PRODUCT.md`, and `docs/ARCHITECTURE.md`.
3. Run `./init.sh` (expects: 6 test files / 19 tests pass, build succeeds).
4. Open `feature_list.json` — all 7 features are done.
5. Check this file and `progress.md` for context.

## Current State

**All planned features are complete and validated against live Longbridge data.**

The CLI supports 6 commands (`analyze`, `momentum`, `triple`, `force`, `risk`, `portfolio`, `report`), all working in both offline (sample data) and live (`--live`) modes.

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

1. **Markdown report formatting** — Current `report --markdown` outputs raw JSON values in code blocks. Upgrade to structured sections with tables, color-coded signals, and clear trade plan formatting.
2. **Bearish/volatile fixture suites** — All current test fixtures model bullish scenarios. Add fixture data for bear markets, range-bound, and high-volatility regimes to improve coverage.
3. **Option pricing** — LEAPS options currently show cost only. Could potentially use `.SYMBOL` prefix format or a different API endpoint.
4. **Portfolio summary table** — Add a concise table view for `--pretty` output (symbol, qty, price, P/L%, allocation%).
5. **Multi-symbol analysis** — Support `analyze AAPL.US NVDA.US GOOG.US` or `analyze --portfolio` to analyze all holdings.
