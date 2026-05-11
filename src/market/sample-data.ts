import type { Holding, KLine, Quote } from "../domain/types.js";
import { round } from "../indicators/math.js";

export function createSampleKLines(): KLine[] {
  return Array.from({ length: 60 }, (_, index) => {
    const trend = 180 + index * 0.65;
    const wave = Math.sin(index / 3) * 2;
    const close = round(trend + wave);
    return {
      timestamp: Date.UTC(2026, 0, index + 1),
      open: round(close - 0.8),
      high: round(close + 1.6),
      low: round(close - 1.9),
      close,
      volume: 900000 + index * 8000 + (index % 7) * 30000
    };
  });
}

export function createSampleQuote(symbol: string): Quote {
  const latest = createSampleKLines().at(-1);
  return {
    symbol,
    price: latest?.close ?? 0,
    change: 1.2,
    changeRate: 0.006,
    volume: latest?.volume,
    vwap: latest?.close
  };
}

export function createSampleHoldings(): Holding[] {
  return [
    {
      symbol: "AAPL.US",
      quantity: 10,
      avgCost: 190,
      marketPrice: 210,
      marketValue: 2100,
      unrealizedPnl: 200
    }
  ];
}

