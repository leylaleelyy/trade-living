# Architecture

## Stack

- Runtime: Node.js 20+
- Language: TypeScript
- CLI: Commander
- Validation: Zod
- Tests: Vitest
- Dev runtime: tsx
- Data source: Longbridge CLI first, SDK later

## Flow

```text
Codex / Shell / Cron
        ↓
Trade Living CLI
        ↓
Command Layer
        ↓
Analysis Engine
        ↓
Indicator Engine
        ↓
Market Data Layer
        ↓
Longbridge Adapter
```

## Module Boundaries

- `src/cli.ts`: command registration and argument parsing only.
- `src/init/`: first-run setup planning, interactive prompts, external tool probes, channel/model/daemon config generation.
- `src/adapters/`: Longbridge CLI/SDK integration; external calls stay here.
- `src/market/`: quote, kline, volume, VWAP, support/resistance, and regime services.
- `src/indicators/`: deterministic indicator calculations.
- `src/systems/`: Triple Screen, momentum score, setup engine, and trade quality orchestration.
- `src/risk/`: position sizing, stops, targets, risk/reward, and portfolio risk.
- `src/portfolio/`: holdings and account aggregation.
- `src/report/`: JSON and Markdown output formatting.
- `src/notify/`: outbound notification adapters such as Telegram.
- `src/runtime/`: local runtime helpers such as daemon process management.
- `src/domain/`: shared domain types.
- `src/config/`: runtime configuration and validation.

## Design Rules

- Keep calculations pure where possible.
- Use adapters for Longbridge data; tests should not require live market access.
- Return structured analysis objects before formatting output.
- Add tests to the module that owns the behavior.
- Do not cross import from CLI into domain, indicators, market, risk, or systems.
