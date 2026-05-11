import type { OptionQuote } from "../domain/types.js";
import type { OptionQuoteProvider } from "./option-quote-provider.js";

export interface TradierOptionQuoteAdapterOptions {
  token?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  delay?: OptionQuote["delay"];
}

export class TradierOptionQuoteAdapter implements OptionQuoteProvider {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly delay: OptionQuote["delay"];

  constructor(private readonly options: TradierOptionQuoteAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.TRADIER_BASE_URL ?? "https://sandbox.tradier.com/v1";
    this.fetchFn = options.fetchFn ?? fetch;
    this.delay = options.delay ?? (this.baseUrl.includes("sandbox") ? "15m" : "realtime");
  }

  async getOptionQuote(symbol: string): Promise<OptionQuote> {
    const token = this.options.token ?? process.env.TRADIER_TOKEN;
    if (!token) {
      throw new Error("TRADIER_TOKEN is required for Tradier option quotes.");
    }

    const response = await this.fetchFn(
      `${this.baseUrl}/markets/quotes?symbols=${encodeURIComponent(toOccSymbol(symbol))}&greeks=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Tradier option quote failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const quote = normalizeTradierQuote(payload);
    return {
      symbol,
      bid: optionalNumber(quote.bid),
      ask: optionalNumber(quote.ask),
      last: optionalNumber(quote.last),
      mark: optionalNumber(quote.mark),
      volume: optionalNumber(quote.volume),
      openInterest: optionalNumber(quote.open_interest ?? quote.openInterest),
      impliedVolatility: optionalNumber(quote.greeks?.mid_iv ?? quote.greeks?.iv),
      delta: optionalNumber(quote.greeks?.delta),
      gamma: optionalNumber(quote.greeks?.gamma),
      theta: optionalNumber(quote.greeks?.theta),
      vega: optionalNumber(quote.greeks?.vega),
      source: "tradier",
      delay: this.delay,
      timestamp: optionalTimestamp(quote.trade_date ?? quote.last_trade_datetime)
    };
  }
}

function normalizeTradierQuote(payload: unknown): Record<string, any> {
  const quotes = (payload as any)?.quotes?.quote;
  if (Array.isArray(quotes)) return quotes[0] ?? {};
  return quotes ?? {};
}

export function toOccSymbol(symbol: string): string {
  const match = /^([A-Z.]+)(\d{6})([CP])(\d+)\.US$/.exec(symbol);
  if (!match) return symbol;

  const [, rawRoot, expiry, side, rawStrike] = match;
  const root = rawRoot.replaceAll(".", "");
  return `${root}${expiry}${side}${rawStrike.padStart(8, "0")}`;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalTimestamp(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

