import type { OptionQuote } from "../domain/types.js";
import type { OptionQuoteProvider } from "./option-quote-provider.js";

export interface MarketDataOptionQuoteAdapterOptions {
  token?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  delay?: OptionQuote["delay"];
}

export class MarketDataOptionQuoteAdapter implements OptionQuoteProvider {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly delay: OptionQuote["delay"];

  constructor(private readonly options: MarketDataOptionQuoteAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.marketdata.app/v1";
    this.fetchFn = options.fetchFn ?? fetch;
    this.delay = options.delay ?? "24h";
  }

  async getOptionQuote(symbol: string): Promise<OptionQuote> {
    const response = await this.fetchFn(
      `${this.baseUrl}/options/quotes/${encodeURIComponent(toMarketDataSymbol(symbol))}/`,
      {
        headers: this.authHeaders()
      }
    );
    if (!response.ok) {
      throw new Error(`MarketData option quote failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    return normalizeMarketDataQuote(symbol, payload, this.delay);
  }

  private authHeaders(): Record<string, string> {
    const token = this.options.token ?? process.env.MARKETDATA_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export function toMarketDataSymbol(symbol: string): string {
  const match = /^([A-Z.]+)(\d{6})([CP])(\d+)\.US$/.exec(symbol);
  if (!match) return symbol;

  const [, root, expiry, side, rawStrike] = match;
  const strike = (Number(rawStrike) / 1000).toFixed(3).replace(/\.?0+$/, "");
  return `${root}${expiry}${side}${strike}`;
}

function normalizeMarketDataQuote(
  requestedSymbol: string,
  payload: unknown,
  delay: OptionQuote["delay"]
): OptionQuote {
  const record = payload as Record<string, unknown>;
  const first = (key: string) => Array.isArray(record[key]) ? (record[key] as unknown[])[0] : record[key];

  return {
    symbol: String(first("symbol") ?? requestedSymbol),
    bid: optionalNumber(first("bid")),
    ask: optionalNumber(first("ask")),
    last: optionalNumber(first("last")),
    mark: optionalNumber(first("mid") ?? first("mark")),
    volume: optionalNumber(first("volume")),
    openInterest: optionalNumber(first("openInterest") ?? first("open_interest")),
    impliedVolatility: optionalNumber(first("iv") ?? first("impliedVolatility")),
    delta: optionalNumber(first("delta")),
    gamma: optionalNumber(first("gamma")),
    theta: optionalNumber(first("theta")),
    vega: optionalNumber(first("vega")),
    source: "marketdata",
    delay,
    timestamp: optionalTimestamp(first("updated"))
  };
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
