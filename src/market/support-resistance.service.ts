import type { KLine, SupportResistanceLevel } from "../domain/types.js";
import { calculateMA } from "../indicators/ma.indicator.js";

export function findSupportResistanceLevels(
  klines: KLine[],
  currentPrice = klines.at(-1)?.close ?? 0
): {
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
} {
  const levels: SupportResistanceLevel[] = [];

  for (let index = 1; index < klines.length - 1; index += 1) {
    const previous = klines[index - 1];
    const current = klines[index];
    const next = klines[index + 1];

    if (current.low < previous.low && current.low < next.low) {
      levels.push({ price: current.low, type: "swing_low", strength: 70 });
    }

    if (current.high > previous.high && current.high > next.high) {
      levels.push({ price: current.high, type: "swing_high", strength: 70 });
    }
  }

  const ma50 = calculateMA(klines, Math.min(50, klines.length)).latest;
  const ma200 = calculateMA(klines, Math.min(200, klines.length)).latest;
  if (ma50) levels.push({ price: ma50, type: "ma50", strength: 80 });
  if (ma200) levels.push({ price: ma200, type: "ma200", strength: 85 });

  const unique = dedupeLevels(levels);
  return {
    supports: unique
      .filter((level) => level.price <= currentPrice)
      .sort((a, b) => b.price - a.price)
      .slice(0, 5),
    resistances: unique
      .filter((level) => level.price > currentPrice)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5)
  };
}

function dedupeLevels(levels: SupportResistanceLevel[]): SupportResistanceLevel[] {
  return levels.reduce<SupportResistanceLevel[]>((result, level) => {
    const existing = result.find(
      (candidate) => Math.abs(candidate.price - level.price) / level.price < 0.003
    );

    if (!existing) {
      result.push(level);
    } else if (level.strength > existing.strength) {
      existing.strength = level.strength;
      existing.type = level.type;
    }

    return result;
  }, []);
}
