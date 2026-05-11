import type { SupportResistanceLevel } from "../domain/types.js";
import { round } from "../indicators/math.js";

export function calculateTargets(
  entry: number,
  resistances: SupportResistanceLevel[],
  atr: number
): number[] {
  const structuralTargets = resistances.map((level) => level.price).filter((price) => price > entry);
  const atrTargets = [round(entry + 2 * atr), round(entry + 3 * atr)];
  return [...new Set([...structuralTargets, ...atrTargets])].sort((a, b) => a - b).slice(0, 3);
}
