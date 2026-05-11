import type { AnalyzeResult } from "../domain/types.js";
import { calculateATR } from "../indicators/atr.indicator.js";
import { detectDivergence } from "../indicators/divergence.indicator.js";
import { calculateForceIndex } from "../indicators/force-index.indicator.js";
import { calculateMACD } from "../indicators/macd.indicator.js";
import { latestFinite, round } from "../indicators/math.js";
import { findSupportResistanceLevels } from "../market/support-resistance.service.js";
import { detectMarketRegime } from "../market/regime-detection.service.js";
import { calculateLongStop } from "../risk/stop-engine.service.js";
import { calculateTargets } from "../risk/target-engine.service.js";
import { calculateRiskReward } from "../risk/rr-engine.service.js";
import { calculateMomentumScore } from "./momentum-score.system.js";
import { calculateTradeQuality } from "./trade-quality.engine.js";
import { evaluateTripleScreen } from "./triple-screen.system.js";
import type { KLine } from "../domain/types.js";
import { createSampleKLines } from "../market/sample-data.js";

export function createOfflineAnalysis(symbol: string): AnalyzeResult {
  const dailyKLines = createSampleKLines();
  return analyzeKLines(symbol, dailyKLines, dailyKLines.filter((_, index) => index % 5 === 0));
}

export const createPlaceholderAnalysis = createOfflineAnalysis;

export function analyzeKLines(
  symbol: string,
  dailyKLines: KLine[],
  weeklyKLines = dailyKLines
): AnalyzeResult {
  const latest = dailyKLines.at(-1);
  if (!latest) {
    throw new Error("At least one kline is required for analysis.");
  }

  const tripleScreen = evaluateTripleScreen(weeklyKLines, dailyKLines);
  const momentum = calculateMomentumScore(dailyKLines, tripleScreen);
  const marketRegime = detectMarketRegime(dailyKLines);
  const structure = findSupportResistanceLevels(dailyKLines, latest.close);
  const atr = latestFinite(calculateATR(dailyKLines, Math.min(14, dailyKLines.length))) ?? 0;
  const stop = calculateLongStop(structure.supports, atr, latest.close * 0.95);
  const targets = calculateTargets(latest.close, structure.resistances, atr).map((price) => ({
    price,
    rr: round(calculateRiskReward(latest.close, stop, price), 2)
  }));
  const force = calculateForceIndex(dailyKLines);
  const macd = calculateMACD(dailyKLines);
  const closes = dailyKLines.map((kline) => kline.close);
  const macdDivergence = detectDivergence(
    closes,
    macd.map((point) => point.histogram)
  );
  const forceDivergence = detectDivergence(closes, force.ema13);
  const bestRr = Math.max(...targets.map((target) => target.rr), 0);
  const tradeQuality = calculateTradeQuality({
    tripleScreen,
    momentum,
    forceIndexPositive: (latestFinite(force.ema13) ?? 0) > 0,
    structureScore: structure.supports.length > 0 || structure.resistances.length > 0 ? 12 : 4,
    hasBearishDivergence: macdDivergence === "bearish" || forceDivergence === "bearish",
    rr: bestRr
  });

  return {
    symbol,
    marketRegime,
    tripleScreen: {
      decision: tripleScreen.decision
    },
    momentum: {
      score: momentum.score
    },
    supports: structure.supports,
    resistances: structure.resistances,
    divergence: {
      macd: macdDivergence,
      forceIndex: forceDivergence === "bearish" ? "bearish_hidden" : forceDivergence
    },
    tradePlan: {
      entryZone: [round(latest.close * 0.99), round(latest.close * 1.01)],
      stop,
      targets
    },
    tradeQuality,
    warnings: buildWarnings(bestRr, macdDivergence, forceDivergence)
  };
}

function buildWarnings(
  rr: number,
  macdDivergence: string,
  forceDivergence: string
): string[] {
  const warnings: string[] = [];
  if (rr < 1.5) warnings.push("Risk/reward is below the preferred threshold.");
  if (macdDivergence === "bearish") warnings.push("MACD bearish divergence detected.");
  if (forceDivergence === "bearish") warnings.push("Force Index momentum is weakening.");
  return warnings;
}

export { createSampleKLines };
