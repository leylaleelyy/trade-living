# Product Notes

Trade Living CLI is a professional trading decision workbench inspired by *Trading for a Living* and the Triple Screen Trading System.

## Purpose

The system helps traders:

- identify higher-quality opportunities;
- control risk;
- standardize trade planning;
- avoid emotion-driven execution.

It is a probability analysis, risk control, and trade planning system. It is not a market prediction system and must not place trades automatically.

## Command Surface

- `trade-living portfolio`: portfolio exposure and risk summary.
- `trade-living init`: interactive first-run setup guide for Longbridge, notification channels, model provider status, and daemon logging; `--yes`, `--dry-run`, and `--json` support automation.
- `trade-living daemon`: start, stop, and inspect background loops that write pid and log files.
- `trade-living analyze SYMBOL`: full analysis output. Before rendering, the command checks current holdings and adds position-aware context when the symbol is already held.
- `trade-living momentum SYMBOL`: momentum score.
- `trade-living triple SYMBOL`: Triple Screen result.
- `trade-living force SYMBOL`: Force Index analysis.
- `trade-living risk SYMBOL --entry N --stop N --equity N`: risk/reward and position sizing inputs.
- `trade-living report`: report generation. Stock reports use the same position-aware context as `analyze` when the symbol is held.

Live analysis defaults to a one-year history window from the current date unless
`--start` is provided. Analysis and report commands use real daily, weekly, and
monthly K-lines for Triple Screen analysis: monthly and weekly trends must align
before the system treats the setup as a confirmed directional trend.

All commands should converge on these output modes:

- `--json`
- `--markdown`
- `--pretty`
- `--debug`

Analysis JSON includes an optional bilingual `interpretation` layer with a
Chinese conclusion, status explanations, warning translations, and translated
position-management notes when holdings context is present.

Human-readable reports include a dedicated Triple Screen status section and an
RR analysis section so trend state, trigger state, and risk/reward quality are
explained in Chinese instead of only exposing enum labels.

Analysis commands can optionally send the generated output to Telegram with
`--notify-channel telegram` when a bot token environment variable and chat id
are configured.

When a requested symbol matches an account holding, analysis output may include
cost basis, current market value, unrealized P/L, portfolio weight, stop-risk
context, and holding-specific notes. Symbols without a matching holding keep the
normal analysis shape.

## Milestones

1. CLI foundation.
2. Longbridge data access.
3. Indicator system.
4. Triple Screen and momentum.
5. Structure and divergence.
6. Trade quality and reports.
