import type { KLine } from "../domain/types.js";
import { exponentialMovingAverage, round } from "./math.js";

export interface MacdPoint {
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  klines: KLine[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdPoint[] {
  const closes = klines.map((kline) => kline.close);
  const fast = exponentialMovingAverage(closes, fastPeriod);
  const slow = exponentialMovingAverage(closes, slowPeriod);
  const macdLine = closes.map((_, index) => round(fast[index] - slow[index]));
  const signal = exponentialMovingAverage(macdLine, signalPeriod);

  return macdLine.map((macd, index) => ({
    macd,
    signal: signal[index],
    histogram: round(macd - signal[index])
  }));
}
