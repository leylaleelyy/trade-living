import type { KLine } from "../domain/types.js";
import { exponentialMovingAverage, round } from "./math.js";

export function calculateTrueRange(klines: KLine[]): number[] {
  return klines.map((kline, index) => {
    const previousClose = index === 0 ? kline.close : klines[index - 1].close;
    return round(
      Math.max(
        kline.high - kline.low,
        Math.abs(kline.high - previousClose),
        Math.abs(kline.low - previousClose)
      )
    );
  });
}

export function calculateATR(klines: KLine[], period = 14): number[] {
  return exponentialMovingAverage(calculateTrueRange(klines), period);
}
