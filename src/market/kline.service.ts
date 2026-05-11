import type { KLineRequest, MarketDataProvider } from "../adapters/data-provider.js";
import type { KLine } from "../domain/types.js";

export class KLineService {
  constructor(private readonly marketData: MarketDataProvider) {}

  getDailyKLines(symbol: string, request?: KLineRequest): Promise<KLine[]> {
    return this.marketData.getKLines(symbol, request);
  }
}
