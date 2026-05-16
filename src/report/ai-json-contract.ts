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

const holdingSchema = z.object({
  symbol: z.string().min(1),
  quantity: finiteNumber,
  avgCost: finiteNumber,
  marketPrice: finiteNumber.optional(),
  marketValue: finiteNumber.optional(),
  unrealizedPnl: finiteNumber.optional(),
  name: z.string().optional(),
  currency: z.string().optional(),
  quoteSource: z.string().optional(),
  quoteDelay: z.enum(["realtime", "15m", "24h", "unknown"]).optional()
});

const statusInterpretationSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  zh: z.string().min(1),
  narrative: z.string().min(1)
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
    decision: z.enum(["buy_watch", "sell_watch", "avoid", "neutral"]),
    trend: z.enum(["bullish", "bearish", "neutral"]).optional(),
    monthlyTrend: z.enum(["bullish", "bearish", "neutral"]).optional(),
    weeklyTrend: z.enum(["bullish", "bearish", "neutral"]).optional(),
    pullback: z.boolean().optional(),
    trigger: z.boolean().optional(),
    score: finiteNumber.optional()
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
  warnings: z.array(z.string()),
  position: z.object({
    status: z.literal("held"),
    holding: holdingSchema,
    costBasis: finiteNumber,
    marketValue: finiteNumber.optional(),
    unrealizedPnl: finiteNumber.optional(),
    unrealizedPnlPct: finiteNumber.optional(),
    portfolioWeightPct: finiteNumber.optional(),
    priceVsCostPct: finiteNumber.optional(),
    riskToStop: finiteNumber.optional(),
    riskToStopPct: finiteNumber.optional(),
    notes: z.array(z.string())
  }).optional(),
  interpretation: z.object({
    conclusion: z.object({
      label: z.string().min(1),
      reason: z.string().min(1)
    }),
    statuses: z.object({
      marketRegime: statusInterpretationSchema,
      tripleScreen: statusInterpretationSchema,
      tradeQuality: statusInterpretationSchema,
      macdDivergence: statusInterpretationSchema,
      forceIndexDivergence: statusInterpretationSchema,
      monthlyTrend: statusInterpretationSchema.optional(),
      weeklyTrend: statusInterpretationSchema.optional(),
      riskReward: statusInterpretationSchema.optional()
    }),
    warningsZh: z.array(z.string()),
    positionNotesZh: z.array(z.string()).optional()
  }).optional()
});

export const portfolioJsonContractSchema = z.object({
  holdings: z.array(holdingSchema),
  risk: z.object({
    totalMarketValue: finiteNumber,
    totalUnrealizedPnl: finiteNumber,
    grossExposure: finiteNumber,
    maxSinglePositionPct: finiteNumber
  })
});

export type AnalyzeJsonContract = z.infer<typeof analyzeJsonContractSchema>;
export type PortfolioJsonContract = z.infer<typeof portfolioJsonContractSchema>;
