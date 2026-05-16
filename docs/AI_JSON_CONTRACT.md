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

When no `--start` is provided, live analysis defaults to a one-year lookback
from the current runtime date. Triple Screen fields are based on real daily,
weekly, and monthly K-lines when the selected provider supports them.

Required top-level fields:

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | Requested market symbol. |
| `marketRegime` | enum | `trending_bull`, `trending_bear`, `range`, `volatile`, `compression`. |
| `tripleScreen.decision` | enum | `buy_watch`, `sell_watch`, `avoid`, `neutral`. |
| `tripleScreen.trend` | enum | Optional. Strict Triple Screen trend after monthly and weekly confirmation: `bullish`, `bearish`, `neutral`. |
| `tripleScreen.monthlyTrend` | enum | Optional. Monthly trend filter. |
| `tripleScreen.weeklyTrend` | enum | Optional. Weekly trend filter from real weekly K-lines. |
| `tripleScreen.pullback` | boolean | Optional. Daily pullback condition. |
| `tripleScreen.trigger` | boolean | Optional. Daily trigger condition. |
| `tripleScreen.score` | number | Optional. Composite Triple Screen score. |
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
| `position` | object | Optional. Present only when the analyzed symbol matches an account holding. |
| `interpretation` | object | Optional bilingual interpretation layer for AI/user display. |

Optional `position` fields:

| Field | Type | Notes |
|---|---|---|
| `status` | enum | Currently `held`. |
| `holding` | object | The matched normalized holding. |
| `costBasis` | number | `avgCost * quantity`. |
| `marketValue` | number | Optional current holding value. |
| `unrealizedPnl` | number | Optional current unrealized P/L. |
| `unrealizedPnlPct` | number | Optional unrealized P/L divided by cost basis. |
| `portfolioWeightPct` | number | Optional current holding weight in priced portfolio value. |
| `priceVsCostPct` | number | Optional price distance from average cost. |
| `riskToStop` | number | Optional estimated loss to the analysis stop for the current quantity. |
| `riskToStopPct` | number | Optional `riskToStop` divided by current market value. |
| `notes[]` | string[] | Position-aware risk and management notes. |

Optional `interpretation` fields:

| Field | Type | Notes |
|---|---|---|
| `conclusion.label` | string | Chinese conclusion label, e.g. `回避`, `重点跟踪`, `强势但等待触发`, `普通观察`. |
| `conclusion.reason` | string | Chinese reason for the conclusion. |
| `statuses.marketRegime` | object | Original value plus bilingual label, Chinese label, and Chinese narrative. |
| `statuses.tripleScreen` | object | Original value plus bilingual label, Chinese label, and Chinese narrative. |
| `statuses.tradeQuality` | object | Original value plus bilingual label, Chinese label, and Chinese narrative. |
| `statuses.macdDivergence` | object | Original value plus bilingual label, Chinese label, and Chinese narrative. |
| `statuses.forceIndexDivergence` | object | Original value plus bilingual label, Chinese label, and Chinese narrative. |
| `statuses.monthlyTrend` | object | Optional monthly trend explanation. |
| `statuses.weeklyTrend` | object | Optional weekly trend explanation. |
| `statuses.riskReward` | object | Optional best-RR explanation. |
| `warningsZh[]` | string[] | Warnings with Chinese explanations appended. |
| `positionNotesZh[]` | string[] | Position notes with Chinese explanations appended, present when position notes exist. |

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
| `quoteSource` | string | no | External quote source when an optional quote provider enriches the holding. |
| `quoteDelay` | enum | no | `realtime`, `15m`, `24h`, or `unknown`. |

## Validation Source

The executable contract schemas live in `src/report/ai-json-contract.ts` and are covered by `test/ai-json-contract.test.ts`.
