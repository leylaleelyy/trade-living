import type { Holding, KLine, Quote } from "../domain/types.js";
import {
  createSampleHoldings,
  createSampleKLines,
  createSampleQuote
} from "../market/sample-data.js";
import type { KLineRequest, TradeLivingDataProvider } from "./data-provider.js";

export class OfflineDataProvider implements TradeLivingDataProvider {
  async getQuote(symbol: string): Promise<Quote> {
    return createSampleQuote(symbol);
  }

  async getKLines(_symbol: string, _request: KLineRequest = {}): Promise<KLine[]> {
    return createSampleKLines();
  }

  async getHoldings(): Promise<Holding[]> {
    return createSampleHoldings();
  }

  async getEnrichedHoldings(): Promise<Holding[]> {
    return this.getHoldings();
  }
}

