---
name: trade-living-cli
description: Use when an AI agent needs to call the Trade Living CLI for portfolio, quote, indicator, momentum, Triple Screen, risk, or report analysis; especially before live Longbridge calls, SDK provider calls, option quote enrichment, or AI-facing JSON output validation.
metadata:
  short-description: Safely call Trade Living CLI with preflight checks
---

# Trade Living CLI

Trade Living CLI is analysis-only. Never place orders or add automatic trade execution.

## Preflight

Before live analysis or portfolio queries:

1. Confirm repository root is `/Users/bytedance/Documents/trade-living`.
2. Run the project baseline:
   ```bash
   ./init.sh
   ```
3. Run the bundled preflight script:
   ```bash
   bash .agents/skills/trade-living-cli/scripts/verify-longbridge-env.sh
   ```
4. If shell sandboxing blocks Longbridge logs, rerun the same command with approval/escalation.

## Provider Selection

- Offline deterministic analysis: omit `--live` and `--data-provider`.
- Longbridge Terminal live mode: use `--live` or `--data-provider cli`.
- Longbridge Node SDK mode: use `--data-provider sdk --longbridge-region cn`.
- Option holding enrichment: add `--option-quote-provider tradier`, `marketdata`, or `auto` only when the relevant token is configured.

## AI Output Rules

- Use `--json` for tool calls and automation.
- Use `--markdown` when the user wants an interpreted report.
- JSON contracts are documented in `docs/AI_JSON_CONTRACT.md`.
- If option quotes are enriched, inspect `quoteSource` and `quoteDelay` before drawing conclusions.
- If Longbridge returns `no quote access` for options, report that OPRA access is missing and use optional delayed providers only if configured.

## Common Commands

```bash
npm run dev -- --live portfolio --json
npm run dev -- --live --start 2026-01-01 analyze NVDA.US --json
npm run dev -- --live --start 2026-01-01 report NVDA.US --markdown
npm run dev -- --data-provider sdk --longbridge-region cn portfolio --json
npm run dev -- --live portfolio --option-quote-provider auto --json
```

## Failure Handling

- If `longbridge check` reports global timeout but CN OK, continue with `--longbridge-region cn`.
- If SDK mode lacks API key env vars, it can reuse a single OAuth token cache under `~/.longbridge/openapi/tokens`.
- If no option provider token is configured, leave option holdings cost-only and say so.
- Keep Longbridge access behind adapters; do not import Longbridge SDK in domain, systems, indicators, or risk modules.

