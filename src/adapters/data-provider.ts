import type { Holding, KLine, Quote } from "../domain/types.js";

export interface KLineRequest {
  start?: string;
  period?: "day" | "week" | "month" | "minute";
  adjust?: "none" | "forward";
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getKLines(symbol: string, request?: KLineRequest): Promise<KLine[]>;
}

export interface PortfolioDataProvider {
  getHoldings(): Promise<Holding[]>;
}

export interface EnrichedPortfolioDataProvider extends PortfolioDataProvider {
  getEnrichedHoldings(): Promise<Holding[]>;
}

export type TradeLivingDataProvider = MarketDataProvider & EnrichedPortfolioDataProvider;

