# Trade Living CLI

Trade Living CLI is a TypeScript command-line trading analysis workbench based on the Triple Screen Trading System.

It is designed for analysis and risk control only. It does not place trades.

## Quick Start

```bash
npm install
npm run check
npm test
npm run build
npm run dev -- analyze AAPL.US --pretty
```

## Commands

```bash
trade-living portfolio
trade-living analyze AAPL.US
trade-living momentum AAPL.US
trade-living triple AAPL.US
trade-living force AAPL.US
trade-living risk AAPL.US --entry 210 --stop 201 --equity 100000
trade-living report
```

All commands are expected to support `--json`, `--markdown`, `--pretty`, and `--debug` as the implementation matures.
