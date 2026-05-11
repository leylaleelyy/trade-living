import type { KLine } from "../domain/types.js";
import { round } from "../indicators/math.js";

export function calculateVWAP(klines: KLine[]): number | undefined {
  const totalVolume = klines.reduce((sum, kline) => sum + kline.volume, 0);
  if (totalVolume === 0) return undefined;

  const totalValue = klines.reduce((sum, kline) => {
    const typicalPrice = (kline.high + kline.low + kline.close) / 3;
    return sum + typicalPrice * kline.volume;
  }, 0);

  return round(totalValue / totalVolume);
}
