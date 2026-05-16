import { describe, expect, it } from "vitest";
import { LongbridgeCliAdapter } from "../src/adapters/longbridge-cli.adapter.js";

describe("LongbridgeCliAdapter", () => {
  it("fetches and normalizes quotes", async () => {
    const calls: string[][] = [];
    const adapter = new LongbridgeCliAdapter("longbridge", async (args) => {
      calls.push(args);
      return [
        {
          symbol: "AAPL.US",
          last: "210.25",
          volume: "1200000",
          turnover: "252300000"
        }
      ];
    });

    await expect(adapter.getQuote("AAPL.US")).resolves.toEqual({
      symbol: "AAPL.US",
      price: 210.25,
      change: undefined,
      changeRate: undefined,
      volume: 1200000,
      turnover: 252300000,
      vwap: undefined
    });
    expect(calls).toEqual([["quote", "AAPL.US"]]);
  });

  it("fetches and normalizes candlesticks", async () => {
    const calls: string[][] = [];
    const adapter = new LongbridgeCliAdapter("longbridge", async (args) => {
      calls.push(args);
      return {
        data: {
          candlesticks: [
            {
              time: "2026-05-08",
              open: "208",
              high: "212",
              low: "207.5",
              close: "211",
              volume: "980000"
            }
          ]
        }
      };
    });

    await expect(adapter.getKLines("AAPL.US", { start: "2024-01-01" })).resolves.toEqual([
      {
        timestamp: Date.parse("2026-05-08"),
        open: 208,
        high: 212,
        low: 207.5,
        close: 211,
        volume: 980000
      }
    ]);
    expect(calls).toEqual([["kline", "history", "AAPL.US", "--start", "2024-01-01", "--period", "day"]]);
  });

  it("fetches and normalizes portfolio holdings", async () => {
    const calls: string[][] = [];
    const adapter = new LongbridgeCliAdapter("longbridge", async (args) => {
      calls.push(args);
      return {
        data: {
          holdings: [
            {
              symbol: "AAPL.US",
              qty: "10",
              avg_cost: "190",
              current_price: "210",
              market_value: "2100",
              unrealized_pl: "200"
            }
          ]
        }
      };
    });

    await expect(adapter.getHoldings()).resolves.toEqual([
      {
        symbol: "AAPL.US",
        quantity: 10,
        avgCost: 190,
        marketPrice: 210,
        marketValue: 2100,
        unrealizedPnl: 200
      }
    ]);
    expect(calls).toEqual([["positions"]]);
  });
});
