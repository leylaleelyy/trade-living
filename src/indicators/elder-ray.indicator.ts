import type { KLine } from "../domain/types.js";
import { exponentialMovingAverage, round } from "./math.js";

export interface ElderRayPoint {
  bullPower: number;
  bearPower: number;
}

export function calculateElderRay(klines: KLine[], period = 13): ElderRayPoint[] {
  const ema = exponentialMovingAverage(
    klines.map((kline) => kline.close),
    period
  );

  return klines.map((kline, index) => ({
    bullPower: round(kline.high - ema[index]),
    bearPower: round(kline.low - ema[index])
  }));
}
