import type { KLine } from "../domain/types.js";
import { exponentialMovingAverage, round } from "./math.js";

export interface ForceIndexResult {
  raw: number[];
  ema2: number[];
  ema13: number[];
}

export function calculateForceIndex(klines: KLine[]): ForceIndexResult {
  const raw = klines.map((kline, index) => {
    if (index === 0) return 0;
    return round(kline.volume * (kline.close - klines[index - 1].close));
  });

  return {
    raw,
    ema2: exponentialMovingAverage(raw, 2),
    ema13: exponentialMovingAverage(raw, 13)
  };
}
