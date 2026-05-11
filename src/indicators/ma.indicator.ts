import type { KLine } from "../domain/types.js";
import { latestFinite, simpleMovingAverage } from "./math.js";

export interface MovingAverageResult {
  period: number;
  values: number[];
  latest?: number;
}

export function calculateMA(klines: KLine[], period: number): MovingAverageResult {
  const values = simpleMovingAverage(
    klines.map((kline) => kline.close),
    period
  );

  return {
    period,
    values,
    latest: latestFinite(values)
  };
}
