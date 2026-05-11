import type { KLine } from "../domain/types.js";
import { calculateForceIndex } from "../indicators/force-index.indicator.js";
import { calculateMACD } from "../indicators/macd.indicator.js";
import { latestFinite } from "../indicators/math.js";
import { calculateRSI } from "../indicators/rsi.indicator.js";

export interface TripleScreenResult {
  trend: "bullish" | "bearish" | "neutral";
  pullback: boolean;
  trigger: boolean;
  decision: "buy_watch" | "sell_watch" | "avoid" | "neutral";
  score: number;
}

export function evaluateTripleScreen(
  weeklyKLines: KLine[],
  dailyKLines: KLine[]
): TripleScreenResult {
  const weeklyMacd = calculateMACD(weeklyKLines);
  const weeklyForce = calculateForceIndex(weeklyKLines);
  const dailyForce = calculateForceIndex(dailyKLines);
  const dailyRsi = calculateRSI(dailyKLines, Math.min(14, Math.max(2, dailyKLines.length - 1)));

  const weeklyHistogram = weeklyMacd.at(-1)?.histogram ?? 0;
  const weeklyForce13 = latestFinite(weeklyForce.ema13) ?? 0;
  const dailyForce2 = latestFinite(dailyForce.ema2) ?? 0;
  const latestRsi = latestFinite(dailyRsi) ?? 50;
  const latest = dailyKLines.at(-1);
  const previousHigh = Math.max(...dailyKLines.slice(-6, -1).map((kline) => kline.high));
  const averageVolume =
    dailyKLines.slice(-6, -1).reduce((sum, kline) => sum + kline.volume, 0) /
    Math.max(1, Math.min(5, dailyKLines.length - 1));

  const trend =
    weeklyHistogram > 0 && weeklyForce13 > 0
      ? "bullish"
      : weeklyHistogram < 0 && weeklyForce13 < 0
        ? "bearish"
        : "neutral";
  const pullback = latestRsi < 45 && dailyForce2 < 0;
  const trigger = Boolean(latest && latest.close > previousHigh && latest.volume > averageVolume);

  let score = 0;
  if (trend !== "neutral") score += 40;
  if (pullback) score += 30;
  if (trigger) score += 30;

  return {
    trend,
    pullback,
    trigger,
    decision: trend === "bullish" && (pullback || trigger) ? "buy_watch" : "neutral",
    score
  };
}
