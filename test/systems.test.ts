import { describe, expect, it } from "vitest";
import { detectMarketRegime } from "../src/market/regime-detection.service.js";
import { findSupportResistanceLevels } from "../src/market/support-resistance.service.js";
import { calculatePositionSize } from "../src/risk/position-sizing.service.js";
import { calculateTradeQuality } from "../src/systems/trade-quality.engine.js";
import { evaluateTripleScreen } from "../src/systems/triple-screen.system.js";
import { analyzeKLines } from "../src/systems/setup-engine.js";
import { fixtureKLines } from "./fixtures.js";

describe("analysis systems", () => {
  it("detects market regime from trend data", () => {
    expect(detectMarketRegime(fixtureKLines)).toBe("trending_bull");
  });

  it("finds structure levels", () => {
    const levels = findSupportResistanceLevels(fixtureKLines);

    expect(levels.supports.length).toBeGreaterThan(0);
  });

  it("evaluates triple screen", () => {
    expect(evaluateTripleScreen(fixtureKLines, fixtureKLines).trend).toBe("bullish");
  });

  it("calculates position sizing", () => {
    expect(calculatePositionSize({ entry: 110, stop: 100, equity: 10000 })).toMatchObject({
      accountRisk: 200,
      perShareRisk: 10,
      quantity: 20
    });
  });

  it("grades trade quality", () => {
    expect(
      calculateTradeQuality({
        tripleScreen: {
          trend: "bullish",
          pullback: true,
          trigger: true,
          decision: "buy_watch",
          score: 100
        },
        momentum: {
          score: 90,
          factors: {
            maStructure: 20,
            relativeStrength: 20,
            forceIndex: 20,
            breakout: 15,
            atr: 10,
            tripleScreen: 15
          }
        },
        forceIndexPositive: true,
        structureScore: 15,
        hasBearishDivergence: false,
        rr: 3.2
      }).grade
    ).toBe("A+");
  });

  it("produces complete analysis output", () => {
    const analysis = analyzeKLines("AAPL.US", fixtureKLines);

    expect(analysis.symbol).toBe("AAPL.US");
    expect(analysis.tradePlan.targets.length).toBeGreaterThan(0);
    expect(analysis.tradeQuality.score).toBeGreaterThan(0);
  });
});
