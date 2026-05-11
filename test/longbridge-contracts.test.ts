import { describe, expect, it } from "vitest";
import {
  longbridgeHoldingsSchema,
  longbridgeKLinesSchema,
  longbridgeQuoteSchema
} from "../src/adapters/longbridge.schemas.js";

describe("Longbridge payload contracts", () => {
  describe("quote normalization", () => {
    it.each([
      {
        name: "array payload with last",
        payload: [{ symbol: "NVDA.US", last: "215.20", change_rate: "0.0123" }],
        expected: {
          symbol: "NVDA.US",
          price: 215.2,
          changeRate: 0.0123
        }
      },
      {
        name: "wrapped data payload with last_done",
        payload: {
          data: {
            symbol: "AMZN.US",
            last_done: "272.68",
            volume: "1234567",
            turnover: "9876543.21"
          }
        },
        expected: {
          symbol: "AMZN.US",
          price: 272.68,
          volume: 1234567,
          turnover: 9876543.21
        }
      },
      {
        name: "camelCase lastDone payload",
        payload: {
          data: [{ symbol: "AAPL.US", lastDone: 293.32, changeRate: "0.004" }]
        },
        expected: {
          symbol: "AAPL.US",
          price: 293.32,
          changeRate: 0.004
        }
      }
    ])("parses $name", ({ payload, expected }) => {
      expect(longbridgeQuoteSchema.parse(payload)).toMatchObject(expected);
    });

    it("rejects quotes without a usable price field", () => {
      expect(() => longbridgeQuoteSchema.parse({ symbol: "MSFT.US" })).toThrow(
        /missing price/
      );
    });
  });

  describe("kline normalization", () => {
    it.each([
      {
        name: "data.candlesticks with ISO date",
        payload: {
          data: {
            candlesticks: [
              {
                date: "2026-05-08",
                open: "208",
                high: "212",
                low: "207.5",
                close: "211",
                volume: "980000"
              }
            ]
          }
        },
        expectedTimestamp: Date.parse("2026-05-08")
      },
      {
        name: "data.list with numeric timestamp strings",
        payload: {
          data: {
            list: [
              {
                timestamp: "1767225600000",
                open: "100.1",
                high: "103.2",
                low: "99.8",
                close: "102.4",
                volume: "12345"
              }
            ]
          }
        },
        expectedTimestamp: 1767225600000
      },
      {
        name: "data.items with time field",
        payload: {
          data: {
            items: [
              {
                time: "2026-01-02T00:00:00.000Z",
                open: 10,
                high: 12,
                low: 9,
                close: 11,
                volume: 1000
              }
            ]
          }
        },
        expectedTimestamp: Date.parse("2026-01-02T00:00:00.000Z")
      }
    ])("parses $name", ({ payload, expectedTimestamp }) => {
      const [kline] = longbridgeKLinesSchema.parse(payload);

      expect(kline).toMatchObject({
        timestamp: expectedTimestamp,
        open: expect.any(Number),
        high: expect.any(Number),
        low: expect.any(Number),
        close: expect.any(Number),
        volume: expect.any(Number)
      });
    });

    it("rejects klines without a timestamp-like field", () => {
      expect(() =>
        longbridgeKLinesSchema.parse([
          { open: 10, high: 12, low: 9, close: 11, volume: 1000 }
        ])
      ).toThrow(/missing timestamp/);
    });
  });

  describe("holding normalization", () => {
    it.each([
      {
        name: "live positions payload without market fields",
        payload: {
          data: {
            holdings: [
              {
                symbol: "XPEV.US",
                name: "XPeng",
                currency: "USD",
                quantity: "100",
                cost_price: "18.737"
              }
            ]
          }
        },
        expected: {
          symbol: "XPEV.US",
          name: "XPeng",
          currency: "USD",
          quantity: 100,
          avgCost: 18.737,
          marketPrice: undefined,
          marketValue: undefined,
          unrealizedPnl: undefined
        }
      },
      {
        name: "fixture-style payload with market fields",
        payload: {
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
        },
        expected: {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190,
          marketPrice: 210,
          marketValue: 2100,
          unrealizedPnl: 200
        }
      },
      {
        name: "camelCase payload",
        payload: [
          {
            symbol: "VOO.US",
            quantity: 1.9023,
            avgCost: 626.068,
            marketPrice: 678.04,
            marketValue: 1289.835492,
            unrealizedPnl: 98.8663356
          }
        ],
        expected: {
          symbol: "VOO.US",
          quantity: 1.9023,
          avgCost: 626.068,
          marketPrice: 678.04,
          marketValue: 1289.835492,
          unrealizedPnl: 98.8663356
        }
      }
    ])("parses $name", ({ payload, expected }) => {
      expect(longbridgeHoldingsSchema.parse(payload)[0]).toEqual(expected);
    });

    it("rejects holdings without quantity or cost basis", () => {
      expect(() =>
        longbridgeHoldingsSchema.parse([{ symbol: "AAPL.US", quantity: "10" }])
      ).toThrow(/avgCost/);
    });
  });
});

