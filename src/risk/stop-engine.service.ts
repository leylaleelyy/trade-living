import type { SupportResistanceLevel } from "../domain/types.js";
import { round } from "../indicators/math.js";

export function calculateLongStop(
  supports: SupportResistanceLevel[],
  atr: number,
  fallbackPrice: number
): number {
  const nearestSupport = supports.at(0)?.price ?? fallbackPrice;
  return round(nearestSupport - 0.5 * atr);
}
