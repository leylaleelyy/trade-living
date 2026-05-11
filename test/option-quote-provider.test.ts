import { describe, expect, it } from "vitest";
import { MarketDataOptionQuoteAdapter, toMarketDataSymbol } from "../src/adapters/marketdata-option.adapter.js";
import {
  CompositeOptionQuoteProvider,
  optionMark
} from "../src/adapters/option-quote-provider.js";
import { TradierOptionQuoteAdapter, toOccSymbol } from "../src/adapters/tradier-option.adapter.js";
import { enrichOptionHoldings } from "../src/portfolio/option-enrichment.service.js";

function jsonResponse(value: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => value
  } as Response;
}

describe("option quote providers", () => {
  it("converts Longbridge option symbols to OCC symbols for Tradier", () => {
    expect(toOccSymbol("PLTR270115C150000.US")).toBe("PLTR270115C00150000");
    expect(toOccSymbol("BRKB270115C500000.US")).toBe("BRKB270115C00500000");
  });

  it("converts Longbridge option symbols to MarketData symbols", () => {
    expect(toMarketDataSymbol("PLTR270115C150000.US")).toBe("PLTR270115C150");
    expect(toMarketDataSymbol("XPEV270115C27000.US")).toBe("XPEV270115C27");
  });

  it("normalizes Tradier option quotes", async () => {
    const adapter = new TradierOptionQuoteAdapter({
      token: "test-token",
      fetchFn: async () =>
        jsonResponse({
          quotes: {
            quote: {
              symbol: "PLTR270115C00150000",
              bid: 21.1,
              ask: 21.8,
              last: 21.45,
              volume: 12,
              open_interest: 1200,
              greeks: {
                mid_iv: 0.55,
                delta: 0.62,
                gamma: 0.01,
                theta: -0.02,
                vega: 0.3
              }
            }
          }
        }) as unknown as Promise<Response>
    });

    await expect(adapter.getOptionQuote("PLTR270115C150000.US")).resolves.toMatchObject({
      symbol: "PLTR270115C150000.US",
      bid: 21.1,
      ask: 21.8,
      last: 21.45,
      openInterest: 1200,
      impliedVolatility: 0.55,
      delta: 0.62,
      source: "tradier",
      delay: "15m"
    });
  });

  it("normalizes MarketData option quotes", async () => {
    const adapter = new MarketDataOptionQuoteAdapter({
      fetchFn: async () =>
        jsonResponse({
          symbol: ["PLTR270115C150"],
          bid: [21.1],
          ask: [21.8],
          mid: [21.45],
          last: [21.4],
          volume: [12],
          openInterest: [1200],
          iv: [0.55],
          delta: [0.62],
          updated: [1767225600]
        }) as unknown as Promise<Response>
    });

    await expect(adapter.getOptionQuote("PLTR270115C150000.US")).resolves.toMatchObject({
      symbol: "PLTR270115C150",
      bid: 21.1,
      ask: 21.8,
      mark: 21.45,
      openInterest: 1200,
      impliedVolatility: 0.55,
      source: "marketdata",
      delay: "24h"
    });
  });

  it("falls back across providers", async () => {
    const provider = new CompositeOptionQuoteProvider([
      {
        getOptionQuote: async () => {
          throw new Error("first failed");
        }
      },
      {
        getOptionQuote: async (symbol) => ({
          symbol,
          last: 2.5,
          source: "marketdata",
          delay: "24h"
        })
      }
    ]);

    await expect(provider.getOptionQuote("XPEV270115C27000.US")).resolves.toMatchObject({
      last: 2.5,
      source: "marketdata"
    });
  });

  it("uses bid/ask midpoint before last price", () => {
    expect(optionMark({ symbol: "A", bid: 2, ask: 3, last: 9, source: "tradier", delay: "15m" })).toBe(2.5);
    expect(optionMark({ symbol: "A", last: 9, source: "tradier", delay: "15m" })).toBe(9);
  });

  it("enriches option holdings with contract multiplier", async () => {
    const holdings = await enrichOptionHoldings(
      [
        {
          symbol: "PLTR270115C150000.US",
          quantity: 1,
          avgCost: 21.45
        }
      ],
      {
        getOptionQuote: async (symbol) => ({
          symbol,
          bid: 22,
          ask: 24,
          source: "tradier",
          delay: "15m"
        })
      }
    );

    expect(holdings[0].marketPrice).toBe(23);
    expect(holdings[0].marketValue).toBe(2300);
    expect(holdings[0].unrealizedPnl).toBeCloseTo(155);
    expect(holdings[0].quoteSource).toBe("tradier");
    expect(holdings[0].quoteDelay).toBe("15m");
  });
});
