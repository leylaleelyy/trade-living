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
      interpretation: {
        conclusion: {
          label: expect.any(String),
          reason: expect.any(String)
        },
        statuses: {
          marketRegime: {
            zh: expect.any(String),
            narrative: expect.any(String)
          },
          tripleScreen: {
            zh: expect.any(String),
            narrative: expect.any(String)
          },
          tradeQuality: {
            zh: expect.any(String),
            narrative: expect.any(String)
          },
          monthlyTrend: {
            zh: expect.any(String),
            narrative: expect.any(String)
          },
          weeklyTrend: {
            zh: expect.any(String),
            narrative: expect.any(String)
          },
          riskReward: {
            zh: expect.any(String),
            narrative: expect.any(String)
          }
        }
      },
      momentum: {
        score: expect.any(Number)
      },
      tradePlan: {
        entryZone: [expect.any(Number), expect.any(Number)],
        stop: expect.any(Number)
      }
    });
    expect(parsed.interpretation.statuses.marketRegime.label).toContain("（");
    expect(parsed.interpretation.statuses.riskReward.label).toContain("（");
    expect(parsed.interpretation.conclusion.reason).toContain("。");
  });

  it("validates analyze JSON output with optional position context", () => {
    const parsed = analyzeJsonContractSchema.parse({
      ...analyzeKLines("AAPL.US", fixtureKLines),
      position: {
        status: "held",
        holding: {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190,
          marketPrice: 210,
          marketValue: 2100,
          unrealizedPnl: 200
        },
        costBasis: 1900,
        marketValue: 2100,
        unrealizedPnl: 200,
        unrealizedPnlPct: 10.53,
        portfolioWeightPct: 15.2,
        priceVsCostPct: 10.53,
        riskToStop: 120,
        riskToStopPct: 5.71,
        notes: ["Existing holding detected; evaluate this as position management."]
      }
    });

    expect(parsed.position?.status).toBe("held");
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
