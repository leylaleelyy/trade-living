export interface KLine {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change?: number;
  changeRate?: number;
  volume?: number;
  turnover?: number;
  vwap?: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  marketPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  name?: string;
  currency?: string;
  quoteSource?: string;
  quoteDelay?: "realtime" | "15m" | "24h" | "unknown";
}

export interface OptionQuote {
  symbol: string;
  bid?: number;
  ask?: number;
  last?: number;
  mark?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  source: "longbridge" | "tradier" | "marketdata";
  delay: "realtime" | "15m" | "24h" | "unknown";
  timestamp?: number;
}

export type MarketRegime =
  | "trending_bull"
  | "trending_bear"
  | "range"
  | "volatile"
  | "compression";

export interface SupportResistanceLevel {
  price: number;
  type: "swing_high" | "swing_low" | "weekly_level" | "ma50" | "ma200";
  strength: number;
}

export interface TradeQuality {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "Avoid";
}

export interface PositionContext {
  status: "held";
  holding: Holding;
  costBasis: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  portfolioWeightPct?: number;
  priceVsCostPct?: number;
  riskToStop?: number;
  riskToStopPct?: number;
  notes: string[];
}

export interface AnalyzeResult {
  symbol: string;
  marketRegime: MarketRegime;
  tripleScreen: {
    decision: "buy_watch" | "sell_watch" | "avoid" | "neutral";
    trend: "bullish" | "bearish" | "neutral";
    monthlyTrend: "bullish" | "bearish" | "neutral";
    weeklyTrend: "bullish" | "bearish" | "neutral";
    pullback: boolean;
    trigger: boolean;
    score: number;
  };
  momentum: {
    score: number;
  };
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
  divergence: {
    macd: "bullish" | "bearish" | "none";
    forceIndex: "bullish" | "bearish" | "bearish_hidden" | "none";
  };
  tradePlan: {
    entryZone: [number, number];
    stop: number;
    targets: Array<{
      price: number;
      rr: number;
    }>;
  };
  tradeQuality: TradeQuality;
  warnings: string[];
  position?: PositionContext;
}
