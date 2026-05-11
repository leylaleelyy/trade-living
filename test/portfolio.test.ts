import { describe, expect, it } from "vitest";
import { summarizeHoldings } from "../src/portfolio/account.service.js";

describe("portfolio summary", () => {
  it("summarizes market value and unrealized pnl", () => {
    expect(
      summarizeHoldings([
        {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190,
          marketPrice: 210,
          marketValue: 2100,
          unrealizedPnl: 200
        },
        {
          symbol: "MSFT.US",
          quantity: 5,
          avgCost: 400,
          marketPrice: 420,
          marketValue: 2100,
          unrealizedPnl: 100
        }
      ])
    ).toEqual({
      totalMarketValue: 4200,
      totalUnrealizedPnl: 300,
      holdingCount: 2
    });
  });
});
