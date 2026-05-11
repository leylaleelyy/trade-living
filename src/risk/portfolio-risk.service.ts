import type { Holding } from "../domain/types.js";

export interface PortfolioRisk {
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  grossExposure: number;
  maxSinglePositionPct: number;
}

export function calculatePortfolioRisk(holdings: Holding[], equity?: number): PortfolioRisk {
  const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue ?? h.quantity * (h.marketPrice ?? h.avgCost)), 0);
  const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + (h.unrealizedPnl ?? (h.marketPrice !== undefined ? (h.marketPrice - h.avgCost) * h.quantity : 0)), 0);
  const denominator = equity ?? totalMarketValue;
  const maxPosition = holdings.reduce(
    (max, h) => Math.max(max, h.marketValue ?? h.quantity * (h.marketPrice ?? h.avgCost)),
    0
  );

  return {
    totalMarketValue,
    totalUnrealizedPnl,
    grossExposure: denominator > 0 ? totalMarketValue / denominator : 0,
    maxSinglePositionPct: denominator > 0 ? (maxPosition / denominator) * 100 : 0
  };
}
