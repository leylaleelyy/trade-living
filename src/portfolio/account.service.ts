import type { Holding } from "../domain/types.js";

export interface PortfolioSummary {
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  holdingCount: number;
}

export function summarizeHoldings(holdings: Holding[]): PortfolioSummary {
  return {
    totalMarketValue: holdings.reduce((sum, h) => sum + (h.marketValue ?? h.quantity * (h.marketPrice ?? h.avgCost)), 0),
    totalUnrealizedPnl: holdings.reduce(
      (sum, h) => sum + (h.unrealizedPnl ?? 0),
      0
    ),
    holdingCount: holdings.length
  };
}
