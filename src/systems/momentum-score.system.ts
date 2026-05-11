import type { KLine } from "../domain/types.js";
import { calculateATR } from "../indicators/atr.indicator.js";
import { calculateForceIndex } from "../indicators/force-index.indicator.js";
import { calculateMA } from "../indicators/ma.indicator.js";
import { latestFinite } from "../indicators/math.js";
import type { TripleScreenResult } from "./triple-screen.system.js";

export interface MomentumScore {
  score: number;
  factors: {
    maStructure: number;
    relativeStrength: number;
    forceIndex: number;
    breakout: number;
    atr: number;
    tripleScreen: number;
  };
}

export function calculateMomentumScore(
  klines: KLine[],
  tripleScreen: TripleScreenResult
): MomentumScore {
  const latest = klines.at(-1);
  if (!latest) {
    return emptyScore();
  }

  const ma20 = calculateMA(klines, Math.min(20, klines.length)).latest ?? latest.close;
  const ma50 = calculateMA(klines, Math.min(50, klines.length)).latest ?? ma20;
  const ma200 = calculateMA(klines, Math.min(200, klines.length)).latest ?? ma50;
  const force = calculateForceIndex(klines);
  const atr = latestFinite(calculateATR(klines, Math.min(14, klines.length))) ?? 0;
  const previousHigh = Math.max(...klines.slice(0, -1).slice(-20).map((kline) => kline.high));

  const factors = {
    maStructure: latest.close > ma20 && ma20 >= ma50 && ma50 >= ma200 ? 20 : 8,
    relativeStrength: latest.close >= klines[0].close ? 20 : 6,
    forceIndex: (latestFinite(force.ema13) ?? 0) > 0 ? 20 : 6,
    breakout: latest.close > previousHigh ? 15 : 5,
    atr: atr / latest.close < 0.05 ? 10 : 4,
    tripleScreen: Math.round((tripleScreen.score / 100) * 15)
  };

  return {
    score: Object.values(factors).reduce((sum, value) => sum + value, 0),
    factors
  };
}

function emptyScore(): MomentumScore {
  return {
    score: 0,
    factors: {
      maStructure: 0,
      relativeStrength: 0,
      forceIndex: 0,
      breakout: 0,
      atr: 0,
      tripleScreen: 0
    }
  };
}
