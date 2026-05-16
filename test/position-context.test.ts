import { describe, expect, it } from "vitest";
import { buildPositionContext } from "../src/portfolio/position-context.service.js";
import { analyzeKLines } from "../src/systems/setup-engine.js";
import { fixtureKLines } from "./fixtures.js";

describe("position context", () => {
  it("adds holding-aware context for an existing position", () => {
    const analysis = analyzeKLines("AAPL.US", fixtureKLines);
    const position = buildPositionContext(analysis, [
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
    ]);

    expect(position).toMatchObject({
      status: "held",
      holding: {
        symbol: "AAPL.US",
        quantity: 10
      },
      costBasis: 1900,
      marketValue: 2100,
      unrealizedPnl: 200,
      portfolioWeightPct: 50
    });
    expect(position?.notes.join(" ")).toContain("Existing holding detected");
  });

  it("does not add context when the symbol is not held", () => {
    const analysis = analyzeKLines("NFLX.US", fixtureKLines);

    expect(
      buildPositionContext(analysis, [
        {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190
        }
      ])
    ).toBeUndefined();
  });
});
