import { describe, expect, it } from "vitest";
import {
  analyzeJsonContractSchema,
  portfolioJsonContractSchema
} from "../src/report/ai-json-contract.js";
import { toJsonReport } from "../src/report/json.reporter.js";
import { calculatePortfolioRisk } from "../src/risk/portfolio-risk.service.js";
import { analyzeKLines } from "../src/systems/setup-engine.js";
import { createSampleHoldings } from "../src/market/sample-data.js";
import { fixtureKLines } from "./fixtures.js";

describe("AI JSON contract", () => {
  it("validates analyze/report JSON output", () => {
    const json = toJsonReport(analyzeKLines("AAPL.US", fixtureKLines));
    const parsed = JSON.parse(json);

    expect(() => analyzeJsonContractSchema.parse(parsed)).not.toThrow();
    expect(parsed).toMatchObject({
      symbol: "AAPL.US",
      tripleScreen: {
        decision: expect.any(String)
      },
      momentum: {
        score: expect.any(Number)
      },
      tradePlan: {
        entryZone: [expect.any(Number), expect.any(Number)],
        stop: expect.any(Number)
      }
    });
  });

  it("validates portfolio JSON output", () => {
    const holdings = createSampleHoldings();
    const json = toJsonReport({
      holdings,
      risk: calculatePortfolioRisk(holdings)
    });
    const parsed = JSON.parse(json);

    expect(() => portfolioJsonContractSchema.parse(parsed)).not.toThrow();
    expect(parsed.holdings[0]).toMatchObject({
      symbol: "AAPL.US",
      quantity: 10,
      avgCost: 190,
      marketPrice: 210
    });
  });

  it("allows holdings without market fields for unsupported instruments", () => {
    const parsed = portfolioJsonContractSchema.parse({
      holdings: [
        {
          symbol: "PLTR270115C150000.US",
          quantity: 1,
          avgCost: 21.45,
          name: "PLTR 270115 150 Call",
          currency: "USD"
        }
      ],
      risk: {
        totalMarketValue: 0,
        totalUnrealizedPnl: 0,
        grossExposure: 0,
        maxSinglePositionPct: 0
      }
    });

    expect(parsed.holdings[0].marketPrice).toBeUndefined();
  });
});

