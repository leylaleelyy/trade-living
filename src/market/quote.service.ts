import type { LongbridgeCliAdapter } from "../adapters/longbridge-cli.adapter.js";
import type { Quote } from "../domain/types.js";

export class QuoteService {
  constructor(private readonly longbridge: LongbridgeCliAdapter) {}

  getQuote(symbol: string): Promise<Quote> {
    return this.longbridge.getQuote(symbol);
  }
}
