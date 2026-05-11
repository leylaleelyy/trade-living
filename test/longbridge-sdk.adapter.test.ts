import { describe, expect, it } from "vitest";
import { LongbridgeSdkAdapter } from "../src/adapters/longbridge-sdk.adapter.js";

const decimal = (value: number | string) => ({
  toString: () => String(value)
});

describe("LongbridgeSdkAdapter", () => {
  it("normalizes SDK quotes", async () => {
    const adapter = new LongbridgeSdkAdapter({
      quoteContext: {
        quote: async () => [
          {
            symbol: "NVDA.US",
            lastDone: decimal("215.20"),
            prevClose: decimal("210.00"),
            volume: 123456,
            turnover: decimal("26500000")
          }
        ],
        candlesticks: async () => [],
        historyCandlesticksByDate: async () => []
      }
    });

    await expect(adapter.getQuote("NVDA.US")).resolves.toEqual({
      symbol: "NVDA.US",
      price: 215.2,
      change: 5.2,
      changeRate: 0.024762,
      volume: 123456,
      turnover: 26500000
    });
  });

  it("normalizes SDK historical candlesticks", async () => {
    const calls: unknown[][] = [];
    const adapter = new LongbridgeSdkAdapter({
      quoteContext: {
        quote: async () => [],
        candlesticks: async () => [],
        historyCandlesticksByDate: async (...args) => {
          calls.push(args);
          return [
            {
              timestamp: new Date("2026-01-02T00:00:00.000Z"),
              open: decimal("100"),
              high: decimal("103"),
              low: decimal("99"),
              close: decimal("102"),
              volume: 1000
            }
          ];
        }
      }
    });

    await expect(adapter.getKLines("NVDA.US", { start: "2026-01-01" })).resolves.toEqual([
      {
        timestamp: Date.parse("2026-01-02T00:00:00.000Z"),
        open: 100,
        high: 103,
        low: 99,
        close: 102,
        volume: 1000
      }
    ]);
    expect(calls[0][0]).toBe("NVDA.US");
  });

  it("normalizes and enriches SDK stock positions", async () => {
    const adapter = new LongbridgeSdkAdapter({
      quoteContext: {
        quote: async ([symbol]) => [
          {
            symbol,
            lastDone: decimal("215.20"),
            prevClose: decimal("210.00")
          }
        ],
        candlesticks: async () => [],
        historyCandlesticksByDate: async () => []
      },
      tradeContext: {
        stockPositions: async () => ({
          channels: [
            {
              positions: [
                {
                  symbol: "NVDA.US",
                  symbolName: "NVIDIA",
                  quantity: decimal("5"),
                  costPrice: decimal("180.97"),
                  currency: "USD"
                }
              ]
            }
          ]
        })
      }
    });

    await expect(adapter.getEnrichedHoldings()).resolves.toEqual([
      {
        symbol: "NVDA.US",
        name: "NVIDIA",
        currency: "USD",
        quantity: 5,
        avgCost: 180.97,
        marketPrice: 215.2,
        marketValue: 1076,
        unrealizedPnl: 171.14999999999995
      }
    ]);
  });
});

