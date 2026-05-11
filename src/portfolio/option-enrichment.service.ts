import type { Holding } from "../domain/types.js";
import {
  isOptionSymbol,
  optionMark,
  type OptionQuoteProvider
} from "../adapters/option-quote-provider.js";

export async function enrichOptionHoldings(
  holdings: Holding[],
  provider?: OptionQuoteProvider
): Promise<Holding[]> {
  if (!provider) return holdings;

  const enriched: Holding[] = [];
  for (const holding of holdings) {
    if (!isOptionSymbol(holding.symbol) || holding.marketPrice !== undefined) {
      enriched.push(holding);
      continue;
    }

    try {
      const quote = await provider.getOptionQuote(holding.symbol);
      const marketPrice = optionMark(quote);
      if (marketPrice === undefined) {
        enriched.push(holding);
        continue;
      }
      enriched.push({
        ...holding,
        marketPrice,
        marketValue: marketPrice * holding.quantity * 100,
        unrealizedPnl: (marketPrice - holding.avgCost) * holding.quantity * 100,
        quoteSource: quote.source,
        quoteDelay: quote.delay
      });
    } catch {
      enriched.push(holding);
    }
  }

  return enriched;
}

