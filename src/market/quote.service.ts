import type { MarketDataProvider } from "../adapters/data-provider.js";
import type { Quote } from "../domain/types.js";

export class QuoteService {
  constructor(private readonly marketData: MarketDataProvider) {}

  getQuote(symbol: string): Promise<Quote> {
    return this.marketData.getQuote(symbol);
  }
}
