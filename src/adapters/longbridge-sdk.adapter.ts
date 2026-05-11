import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as longbridge from "longbridge";
import type { Holding, KLine, Quote } from "../domain/types.js";
import type { KLineRequest, TradeLivingDataProvider } from "./data-provider.js";

type SdkQuoteContext = {
  quote(symbols: string[]): Promise<unknown[]>;
  candlesticks(
    symbol: string,
    period: unknown,
    count: number,
    adjustType: unknown,
    tradeSessions: unknown
  ): Promise<unknown[]>;
  historyCandlesticksByDate(
    symbol: string,
    period: unknown,
    adjustType: unknown,
    start: unknown,
    end: unknown,
    tradeSessions: unknown
  ): Promise<unknown[]>;
};

type SdkTradeContext = {
  stockPositions(symbols?: string[] | null): Promise<unknown>;
};

export interface LongbridgeSdkAdapterOptions {
  quoteContext?: SdkQuoteContext;
  tradeContext?: SdkTradeContext;
  configFactory?: () => unknown;
  region?: "cn" | "global";
}

export class LongbridgeSdkAdapter implements TradeLivingDataProvider {
  private quoteContext?: SdkQuoteContext;
  private tradeContext?: SdkTradeContext;
  private config?: Promise<longbridge.Config>;

  constructor(private readonly options: LongbridgeSdkAdapterOptions = {}) {
    this.quoteContext = options.quoteContext;
    this.tradeContext = options.tradeContext;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const [quote] = await (await this.getQuoteContext()).quote([symbol]);
    if (!quote) {
      throw new Error(`Longbridge SDK returned no quote for ${symbol}`);
    }

    const lastDone = numberFromPath(quote, "lastDone");
    const prevClose = optionalNumberFromPath(quote, "prevClose");
    const change =
      prevClose !== undefined ? roundSdkNumber(lastDone - prevClose) : undefined;

    return {
      symbol: stringFromPath(quote, "symbol", symbol),
      price: lastDone,
      change,
      changeRate:
        prevClose && prevClose !== 0 ? roundSdkNumber(change! / prevClose) : undefined,
      volume: optionalNumberFromPath(quote, "volume"),
      turnover: optionalNumberFromPath(quote, "turnover")
    };
  }

  async getKLines(symbol: string, request: KLineRequest = {}): Promise<KLine[]> {
    const ctx = await this.getQuoteContext();
    const period = toSdkPeriod(request.period ?? "day");
    const adjustType = toSdkAdjustType(request.adjust);
    const tradeSessions = longbridge.TradeSessions.All;
    const candles = request.start
      ? await ctx.historyCandlesticksByDate(
          symbol,
          period,
          adjustType,
          toNaiveDate(request.start),
          undefined,
          tradeSessions
        )
      : await ctx.candlesticks(symbol, period, 200, adjustType, tradeSessions);

    return candles.map((candle) => ({
      timestamp: dateFromPath(candle, "timestamp").getTime(),
      open: numberFromPath(candle, "open"),
      high: numberFromPath(candle, "high"),
      low: numberFromPath(candle, "low"),
      close: numberFromPath(candle, "close"),
      volume: numberFromPath(candle, "volume")
    }));
  }

  async getHoldings(): Promise<Holding[]> {
    const response = await (await this.getTradeContext()).stockPositions();
    const channels = arrayFromPath(response, "channels");
    return channels.flatMap((channel) =>
      arrayFromPath(channel, "positions").map((position): Holding => ({
        symbol: stringFromPath(position, "symbol"),
        name: optionalStringFromPath(position, "symbolName"),
        currency: optionalStringFromPath(position, "currency"),
        quantity: numberFromPath(position, "quantity"),
        avgCost: numberFromPath(position, "costPrice")
      }))
    );
  }

  async getEnrichedHoldings(): Promise<Holding[]> {
    const holdings = await this.getHoldings();
    const enriched: Holding[] = [];
    for (const holding of holdings) {
      try {
        const quote = await this.getQuote(holding.symbol);
        const marketPrice = quote.price;
        const marketValue = marketPrice * holding.quantity;
        const unrealizedPnl = (marketPrice - holding.avgCost) * holding.quantity;
        enriched.push({ ...holding, marketPrice, marketValue, unrealizedPnl });
      } catch {
        enriched.push(holding);
      }
    }
    return enriched;
  }

  private async getQuoteContext(): Promise<SdkQuoteContext> {
    if (!this.quoteContext) {
      this.quoteContext = longbridge.QuoteContext.new(
        await this.getConfig()
      ) as SdkQuoteContext;
    }
    return this.quoteContext;
  }

  private async getTradeContext(): Promise<SdkTradeContext> {
    if (!this.tradeContext) {
      this.tradeContext = longbridge.TradeContext.new(
        await this.getConfig()
      ) as SdkTradeContext;
    }
    return this.tradeContext;
  }

  private async getConfig(): Promise<longbridge.Config> {
    if (this.config) return this.config;

    if (this.options.configFactory) {
      this.config = Promise.resolve(this.options.configFactory() as longbridge.Config);
      return this.config;
    }

    const region = this.options.region ?? regionFromEnv();
    if (
      region === "cn" &&
      process.env.LONGBRIDGE_APP_KEY &&
      process.env.LONGBRIDGE_APP_SECRET &&
      process.env.LONGBRIDGE_ACCESS_TOKEN
    ) {
      this.config = Promise.resolve(longbridge.Config.fromApikey(
        process.env.LONGBRIDGE_APP_KEY,
        process.env.LONGBRIDGE_APP_SECRET,
        process.env.LONGBRIDGE_ACCESS_TOKEN,
        sdkExtraConfig(region)
      ));
      return this.config;
    }

    const oauthClientId = process.env.LONGBRIDGE_OAUTH_CLIENT_ID ?? discoverOAuthClientId();
    if (oauthClientId) {
      this.config = longbridge.OAuth.build(oauthClientId, (error, url) => {
        if (error) {
          console.error(`Longbridge OAuth error: ${error.message}`);
          return;
        }
        console.error(`Open this URL to authorize Longbridge OpenAPI: ${url}`);
      }).then((oauth) => longbridge.Config.fromOAuth(oauth, sdkExtraConfig(region)));
      return this.config;
    }

    this.config = Promise.resolve(longbridge.Config.fromApikeyEnv());
    return this.config;
  }
}

function sdkExtraConfig(region: "cn" | "global"): longbridge.ExtraConfigParams {
  if (region !== "cn") {
    return { enablePrintQuotePackages: false };
  }

  return {
    httpUrl: "https://openapi.longbridge.cn",
    quoteWsUrl: "wss://openapi-quote.longbridge.cn/v2",
    tradeWsUrl: "wss://openapi-trade.longbridge.cn/v2",
    enablePrintQuotePackages: false
  };
}

function regionFromEnv(): "cn" | "global" {
  return process.env.LONGBRIDGE_REGION === "cn" ? "cn" : "global";
}

function discoverOAuthClientId(): string | undefined {
  try {
    const tokenDir = join(homedir(), ".longbridge", "openapi", "tokens");
    const entries = readdirSync(tokenDir).filter((entry) => !entry.startsWith("."));
    return entries.length === 1 ? entries[0] : undefined;
  } catch {
    return undefined;
  }
}

function toSdkPeriod(period: KLineRequest["period"]): unknown {
  if (period === "week") return longbridge.Period.Week;
  if (period === "month") return longbridge.Period.Month;
  if (period === "minute") return longbridge.Period.Min_1;
  return longbridge.Period.Day;
}

function toSdkAdjustType(adjust: KLineRequest["adjust"]): unknown {
  return adjust === "forward"
    ? longbridge.AdjustType.ForwardAdjust
    : longbridge.AdjustType.NoAdjust;
}

function toNaiveDate(value: string): longbridge.NaiveDate {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Expected YYYY-MM-DD date for Longbridge SDK, received ${value}`);
  }
  return new longbridge.NaiveDate(year, month, day);
}

function arrayFromPath(value: unknown, key: string): unknown[] {
  const child = readPath(value, key);
  return Array.isArray(child) ? child : [];
}

function stringFromPath(value: unknown, key: string, fallback?: string): string {
  const child = readPath(value, key);
  if (typeof child === "string") return child;
  if (fallback !== undefined) return fallback;
  throw new Error(`Longbridge SDK value is missing string field: ${key}`);
}

function optionalStringFromPath(value: unknown, key: string): string | undefined {
  const child = readPath(value, key);
  return typeof child === "string" ? child : undefined;
}

function numberFromPath(value: unknown, key: string): number {
  const child = readPath(value, key);
  const parsed = parseSdkNumber(child);
  if (parsed === undefined) {
    throw new Error(`Longbridge SDK value is missing numeric field: ${key}`);
  }
  return parsed;
}

function optionalNumberFromPath(value: unknown, key: string): number | undefined {
  return parseSdkNumber(readPath(value, key));
}

function dateFromPath(value: unknown, key: string): Date {
  const child = readPath(value, key);
  if (child instanceof Date) return child;
  if (typeof child === "string" || typeof child === "number") {
    const date = new Date(child);
    if (Number.isFinite(date.getTime())) return date;
  }
  throw new Error(`Longbridge SDK value is missing date field: ${key}`);
}

function readPath(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const direct = record[key];
  if (direct !== undefined) return direct;

  const maybeJson = "toJSON" in record && typeof record.toJSON === "function"
    ? (record.toJSON as () => unknown)()
    : undefined;
  if (maybeJson && typeof maybeJson === "object") {
    return (maybeJson as Record<string, unknown>)[key];
  }

  return undefined;
}

function parseSdkNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function roundSdkNumber(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
