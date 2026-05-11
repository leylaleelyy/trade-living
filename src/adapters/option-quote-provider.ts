import type { OptionQuote } from "../domain/types.js";

export interface OptionQuoteProvider {
  getOptionQuote(symbol: string): Promise<OptionQuote>;
}

export function isOptionSymbol(symbol: string): boolean {
  return /\d{6}[CP]\d+\./.test(symbol);
}

export function optionMark(quote: OptionQuote): number | undefined {
  if (quote.mark !== undefined) return quote.mark;
  if (quote.bid !== undefined && quote.ask !== undefined) {
    return (quote.bid + quote.ask) / 2;
  }
  return quote.last;
}

export class CompositeOptionQuoteProvider implements OptionQuoteProvider {
  constructor(private readonly providers: OptionQuoteProvider[]) {}

  async getOptionQuote(symbol: string): Promise<OptionQuote> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      try {
        return await provider.getOptionQuote(symbol);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error(`No option quote provider returned ${symbol}: ${errors.join("; ")}`);
  }
}

