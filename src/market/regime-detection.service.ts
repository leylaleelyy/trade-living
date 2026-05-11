import type { KLine, MarketRegime } from "../domain/types.js";
import { calculateATR } from "../indicators/atr.indicator.js";
import { calculateMA } from "../indicators/ma.indicator.js";
import { latestFinite } from "../indicators/math.js";

export function detectMarketRegime(klines: KLine[]): MarketRegime {
  if (klines.length < 3) return "range";

  const latestClose = klines[klines.length - 1].close;
  const ma20 = calculateMA(klines, Math.min(20, klines.length)).latest ?? latestClose;
  const ma50 = calculateMA(klines, Math.min(50, klines.length)).latest ?? ma20;
  const atr = latestFinite(calculateATR(klines, Math.min(14, klines.length)));

  if (atr && atr / latestClose > 0.05) return "volatile";
  if (Math.abs(ma20 - ma50) / latestClose < 0.005) return "compression";
  if (latestClose > ma20 && ma20 >= ma50) return "trending_bull";
  if (latestClose < ma20 && ma20 <= ma50) return "trending_bear";
  return "range";
}
