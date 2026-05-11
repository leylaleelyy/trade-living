import type { PortfolioDataProvider } from "../adapters/data-provider.js";
import type { Holding } from "../domain/types.js";

export class HoldingsService {
  constructor(private readonly portfolioData: PortfolioDataProvider) {}

  getHoldings(): Promise<Holding[]> {
    return this.portfolioData.getHoldings();
  }
}
