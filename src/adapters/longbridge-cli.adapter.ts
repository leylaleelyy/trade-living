import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Holding, KLine, Quote } from "../domain/types.js";
import type { KLineRequest, TradeLivingDataProvider } from "./data-provider.js";
import {
  longbridgeHoldingsSchema,
  longbridgeKLinesSchema,
  longbridgeQuoteSchema
} from "./longbridge.schemas.js";

const execFileAsync = promisify(execFile);

export type LongbridgeCommandRunner = (args: string[]) => Promise<unknown>;

export class LongbridgeCliAdapter implements TradeLivingDataProvider {
  constructor(
    private readonly cliPath = "longbridge",
    private readonly commandRunner?: LongbridgeCommandRunner
  ) {}

  async run<T = unknown>(args: string[]): Promise<T> {
    if (this.commandRunner) {
      return this.commandRunner(args) as Promise<T>;
    }

    const { stdout } = await execFileAsync(this.cliPath, [
      ...args,
      "--format",
      "json"
    ]);

    return JSON.parse(stdout) as T;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const payload = await this.run(["quote", symbol]);
    return longbridgeQuoteSchema.parse(payload);
  }

  async getKLines(symbol: string, request: KLineRequest = {}): Promise<KLine[]> {
    const args = request.start
      ? ["kline", "history", symbol, "--start", request.start]
      : ["kline", symbol, "--period", request.period ?? "day"];

    if (request.adjust) {
      args.push("--adjust", request.adjust);
    }

    const payload = await this.run(args);
    return longbridgeKLinesSchema.parse(payload);
  }

  async getHoldings(): Promise<Holding[]> {
    const payload = await this.run(["positions"]);
    return longbridgeHoldingsSchema.parse(payload);
  }

  private isOptionSymbol(symbol: string): boolean {
    return /\d{6}[CP]\d+\./.test(symbol);
  }

  async getEnrichedHoldings(): Promise<Holding[]> {
    const holdings = await this.getHoldings();
    const enriched: Holding[] = [];
    for (const h of holdings) {
      if (h.marketPrice !== undefined && h.marketValue !== undefined) {
        enriched.push(h);
        continue;
      }
      if (this.isOptionSymbol(h.symbol)) {
        enriched.push(h);
        continue;
      }
      try {
        const quote = await this.getQuote(h.symbol);
        const marketPrice = quote.price;
        const marketValue = marketPrice * h.quantity;
        const unrealizedPnl = (marketPrice - h.avgCost) * h.quantity;
        enriched.push({ ...h, marketPrice, marketValue, unrealizedPnl });
      } catch {
        enriched.push(h);
      }
    }
    return enriched;
  }
}
