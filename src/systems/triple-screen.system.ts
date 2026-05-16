import type { KLine } from "../domain/types.js";
import { calculateForceIndex } from "../indicators/force-index.indicator.js";
import { calculateMACD } from "../indicators/macd.indicator.js";
import { latestFinite } from "../indicators/math.js";
import { calculateRSI } from "../indicators/rsi.indicator.js";

export interface TripleScreenResult {
  trend: "bullish" | "bearish" | "neutral";
  monthlyTrend: "bullish" | "bearish" | "neutral";
  weeklyTrend: "bullish" | "bearish" | "neutral";
  pullback: boolean;
  trigger: boolean;
  decision: "buy_watch" | "sell_watch" | "avoid" | "neutral";
  score: number;
}

export function evaluateTripleScreen(
  weeklyKLines: KLine[],
  dailyKLines: KLine[],
  monthlyKLines = weeklyKLines
): TripleScreenResult {
  const monthlyTrend = detectTrend(monthlyKLines);
  const weeklyTrend = detectTrend(weeklyKLines);
  const dailyForce = calculateForceIndex(dailyKLines);
  const dailyRsi = calculateRSI(dailyKLines, Math.min(14, Math.max(2, dailyKLines.length - 1)));

  const dailyForce2 = latestFinite(dailyForce.ema2) ?? 0;
  const latestRsi = latestFinite(dailyRsi) ?? 50;
  const latest = dailyKLines.at(-1);
  const previousHigh = Math.max(...dailyKLines.slice(-6, -1).map((kline) => kline.high));
  const previousLow = Math.min(...dailyKLines.slice(-6, -1).map((kline) => kline.low));
  const averageVolume =
    dailyKLines.slice(-6, -1).reduce((sum, kline) => sum + kline.volume, 0) /
    Math.max(1, Math.min(5, dailyKLines.length - 1));

  const trend =
    monthlyTrend === "bullish" && weeklyTrend === "bullish"
      ? "bullish"
      : monthlyTrend === "bearish" && weeklyTrend === "bearish"
        ? "bearish"
        : "neutral";
  const pullback =
    trend === "bullish"
      ? latestRsi < 45 && dailyForce2 < 0
      : trend === "bearish"
        ? latestRsi > 55 && dailyForce2 > 0
        : false;
  const trigger =
    trend === "bullish"
      ? Boolean(latest && latest.close > previousHigh && latest.volume > averageVolume)
      : trend === "bearish"
        ? Boolean(latest && latest.close < previousLow && latest.volume > averageVolume)
        : false;

  let score = 0;
  if (monthlyTrend !== "neutral") score += 20;
  if (weeklyTrend !== "neutral") score += 20;
  if (pullback) score += 30;
  if (trigger) score += 30;
  const conflictingTrends =
    monthlyTrend !== "neutral" && weeklyTrend !== "neutral" && monthlyTrend !== weeklyTrend;

  return {
    trend,
    monthlyTrend,
    weeklyTrend,
    pullback,
    trigger,
    decision:
      trend === "bullish" && (pullback || trigger)
        ? "buy_watch"
        : trend === "bearish" && (pullback || trigger)
          ? "sell_watch"
          : conflictingTrends
            ? "avoid"
            : "neutral",
    score
  };
}

function detectTrend(klines: KLine[]): TripleScreenResult["trend"] {
  const macd = calculateMACD(klines);
  const force = calculateForceIndex(klines);
  const histogram = macd.at(-1)?.histogram ?? 0;
  const force13 = latestFinite(force.ema13) ?? 0;

  if (histogram > 0 && force13 > 0) return "bullish";
  if (histogram < 0 && force13 < 0) return "bearish";
  return "neutral";
}
