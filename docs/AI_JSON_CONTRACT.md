# AI JSON Contract

Trade Living is intended to be called by an AI agent. JSON output is the stable machine-consumable contract; Markdown output is an interpretation layer for humans and AI summaries.

## Contract Rules

- Use `--json` for tool calls and automation.
- Treat documented field names, enum values, and numeric types as stable.
- New optional fields may be added without a breaking change.
- Existing required fields must not be removed or renamed without a new contract version.
- All money, price, score, and quantity values are JSON numbers.
- The CLI remains analysis-only and must not emit trade execution instructions.

## Analyze / Report JSON

Commands:

```bash
trade-living analyze SYMBOL --json
trade-living report SYMBOL --json
```

Required top-level fields:

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | Requested market symbol. |
| `marketRegime` | enum | `trending_bull`, `trending_bear`, `range`, `volatile`, `compression`. |
| `tripleScreen.decision` | enum | `buy_watch`, `sell_watch`, `avoid`, `neutral`. |
| `momentum.score` | number | 0-100 style score. |
| `supports[]` | array | Support/resistance level objects. |
| `resistances[]` | array | Support/resistance level objects. |
| `divergence.macd` | enum | `bullish`, `bearish`, `none`. |
| `divergence.forceIndex` | enum | `bullish`, `bearish`, `bearish_hidden`, `none`. |
| `tradePlan.entryZone` | `[number, number]` | Lower and upper observation bounds. |
| `tradePlan.stop` | number | Analysis stop/invalidating level. |
| `tradePlan.targets[]` | array | Target price and RR pairs. |
| `tradeQuality.score` | number | Composite quality score. |
| `tradeQuality.grade` | enum | `A+`, `A`, `B`, `C`, `Avoid`. |
| `warnings[]` | string[] | Analysis warnings. |

## Portfolio JSON

Command:

```bash
trade-living portfolio --json
```

Required top-level fields:

| Field | Type | Notes |
|---|---|---|
| `holdings[]` | array | Normalized positions. |
| `risk.totalMarketValue` | number | Sum of priced market value. |
| `risk.totalUnrealizedPnl` | number | Sum of known unrealized P/L. |
| `risk.grossExposure` | number | Gross exposure ratio. |
| `risk.maxSinglePositionPct` | number | Largest single priced holding percentage. |

Holding fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `symbol` | string | yes | Market symbol. |
| `quantity` | number | yes | Held quantity. |
| `avgCost` | number | yes | Cost basis. |
| `marketPrice` | number | no | Missing for unsupported option quotes. |
| `marketValue` | number | no | Missing for unsupported option quotes. |
| `unrealizedPnl` | number | no | Missing for unsupported option quotes. |
| `name` | string | no | Broker-provided display name. |
| `currency` | string | no | Broker-provided currency. |

## Validation Source

The executable contract schemas live in `src/report/ai-json-contract.ts` and are covered by `test/ai-json-contract.test.ts`.

