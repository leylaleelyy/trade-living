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

## SDK Later

The official Node.js SDK package is `longbridge`. It should be added later when the project needs WebSocket subscriptions, lower-level quote contexts, or richer account APIs. Keep the SDK behind the existing adapter boundary.

## Done Criteria

- Adapter uses official Longbridge Terminal command names.
- Schemas parse official quote-style JSON fixtures.
- CLI supports `--live`, `--longbridge-cli`, and `--start`.
- Offline mode remains deterministic and testable.
- `npm run check`, `npm test`, and `npm run build` pass.
