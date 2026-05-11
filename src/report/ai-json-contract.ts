import { z } from "zod";

const finiteNumber = z.number().finite();

const supportResistanceLevelSchema = z.object({
  price: finiteNumber,
  type: z.enum(["swing_high", "swing_low", "weekly_level", "ma50", "ma200"]),
  strength: finiteNumber
});

const targetSchema = z.object({
  price: finiteNumber,
  rr: finiteNumber
});

export const analyzeJsonContractSchema = z.object({
  symbol: z.string().min(1),
  marketRegime: z.enum([
    "trending_bull",
    "trending_bear",
    "range",
    "volatile",
    "compression"
  ]),
  tripleScreen: z.object({
    decision: z.enum(["buy_watch", "sell_watch", "avoid", "neutral"])
  }),
  momentum: z.object({
    score: finiteNumber
  }),
  supports: z.array(supportResistanceLevelSchema),
  resistances: z.array(supportResistanceLevelSchema),
  divergence: z.object({
    macd: z.enum(["bullish", "bearish", "none"]),
    forceIndex: z.enum(["bullish", "bearish", "bearish_hidden", "none"])
  }),
  tradePlan: z.object({
    entryZone: z.tuple([finiteNumber, finiteNumber]),
    stop: finiteNumber,
    targets: z.array(targetSchema)
  }),
  tradeQuality: z.object({
    score: finiteNumber,
    grade: z.enum(["A+", "A", "B", "C", "Avoid"])
  }),
  warnings: z.array(z.string())
});

export const portfolioJsonContractSchema = z.object({
  holdings: z.array(
    z.object({
      symbol: z.string().min(1),
      quantity: finiteNumber,
      avgCost: finiteNumber,
      marketPrice: finiteNumber.optional(),
      marketValue: finiteNumber.optional(),
      unrealizedPnl: finiteNumber.optional(),
      name: z.string().optional(),
      currency: z.string().optional()
    })
  ),
  risk: z.object({
    totalMarketValue: finiteNumber,
    totalUnrealizedPnl: finiteNumber,
    grossExposure: finiteNumber,
    maxSinglePositionPct: finiteNumber
  })
});

export type AnalyzeJsonContract = z.infer<typeof analyzeJsonContractSchema>;
export type PortfolioJsonContract = z.infer<typeof portfolioJsonContractSchema>;

