import type { KLine } from "../domain/types.js";
import { round } from "./math.js";

export function calculateRSI(klines: KLine[], period = 14): number[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("Period must be a positive integer.");
  }

  const closes = klines.map((kline) => kline.close);
  return closes.map((close, index) => {
    if (index === 0 || index < period) return Number.NaN;

    const window = closes.slice(index + 1 - period, index + 1);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < window.length; i += 1) {
      const change = window[i] - window[i - 1];
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }

    if (losses === 0) return 100;
    const rs = gains / losses;
    return round(100 - 100 / (1 + rs));
  });
}
