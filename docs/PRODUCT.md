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
- `trade-living analyze SYMBOL`: full analysis output.
- `trade-living momentum SYMBOL`: momentum score.
- `trade-living triple SYMBOL`: Triple Screen result.
- `trade-living force SYMBOL`: Force Index analysis.
- `trade-living risk SYMBOL --entry N --stop N --equity N`: risk/reward and position sizing inputs.
- `trade-living report`: report generation.

All commands should converge on these output modes:

- `--json`
- `--markdown`
- `--pretty`
- `--debug`

## Milestones

1. CLI foundation.
2. Longbridge data access.
3. Indicator system.
4. Triple Screen and momentum.
5. Structure and divergence.
6. Trade quality and reports.
