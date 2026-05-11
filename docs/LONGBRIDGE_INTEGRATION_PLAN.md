# Longbridge Integration Plan

## Current State

The project has a complete offline analysis pipeline using deterministic sample K-line data. Longbridge adapter scaffolding exists, but CLI commands still default to offline data.

## Findings To Address

1. CLI commands must support real Longbridge data, not only sample fixtures.
2. The Longbridge Terminal command for historical candles is `longbridge kline history`, not `candlesticks`.
3. Official quote JSON uses fields such as `last`, `prev_close`, `volume`, and `turnover`; schemas must accept those fields.
4. Portfolio data should use `longbridge positions --format json` for holdings.
5. `report` should respect the user's requested output mode.

## CLI-First Approach

Use the official Longbridge Terminal first because it already supports OAuth and machine-readable JSON.

Setup outside this project:

```bash
brew install --cask longbridge/tap/longbridge-terminal
longbridge auth login
longbridge check
```

Expected live commands:

```bash
longbridge quote AAPL.US --format json
longbridge kline history AAPL.US --start 2024-01-01 --format json
longbridge positions --format json
```

Project commands should expose live mode:

```bash
trade-living --live analyze AAPL.US --start 2024-01-01
trade-living --live momentum AAPL.US
trade-living --live triple AAPL.US
trade-living --live force AAPL.US
trade-living --live portfolio
trade-living --live report AAPL.US --markdown
```

## SDK Provider

The official Node.js SDK package is `longbridge`. It is available through the same provider boundary as the CLI adapter:

```bash
trade-living --data-provider sdk --longbridge-region cn analyze AAPL.US --start 2026-01-01 --json
trade-living --data-provider sdk --longbridge-region cn portfolio --json
```

Authentication order:

1. Legacy SDK API key environment variables: `LONGBRIDGE_APP_KEY`, `LONGBRIDGE_APP_SECRET`, `LONGBRIDGE_ACCESS_TOKEN`.
2. OAuth token cache discovery from `~/.longbridge/openapi/tokens/<client_id>`.

The SDK provider uses `QuoteContext` for quotes/K-lines and `TradeContext` for positions. Longbridge CLI remains the default `--live` provider and fallback data source.

## Option Quote Fallbacks

Longbridge supports real-time US option quotes through `longbridge option quote` and SDK `QuoteContext.optionQuote`, but this requires OPRA OpenAPI quote permission. When the account does not have OPRA access, Longbridge returns `no quote access`.

For cost-only option holdings, the portfolio command can optionally try delayed external providers:

```bash
trade-living --live portfolio --option-quote-provider tradier --json
trade-living --live portfolio --option-quote-provider marketdata --json
trade-living --live portfolio --option-quote-provider auto --json
```

Provider behavior:

| Provider | Env | Delay | Notes |
|---|---|---|---|
| `tradier` | `TRADIER_TOKEN` | `15m` for sandbox, `realtime` for live endpoint | Uses OCC symbols and options quote/greeks payloads. |
| `marketdata` | optional `MARKETDATA_TOKEN` | `24h` by default on free plans | Useful as a low-cost valuation fallback. |
| `auto` | provider-specific env vars | first successful provider | Tries Tradier, then MarketData.app. |

Enriched option holdings include `marketPrice`, `marketValue`, `unrealizedPnl`, `quoteSource`, and `quoteDelay`. The system keeps this optional so portfolio queries remain reliable when external quote providers are not configured.

## Done Criteria

- Adapter uses official Longbridge Terminal command names.
- Schemas parse official quote-style JSON fixtures.
- CLI supports `--live`, `--longbridge-cli`, and `--start`.
- CLI supports `--data-provider sdk` for the official Node.js SDK.
- CLI supports optional `--option-quote-provider` for delayed option holding enrichment.
- Offline mode remains deterministic and testable.
- `npm run check`, `npm test`, and `npm run build` pass.
