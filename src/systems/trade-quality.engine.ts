import type { TradeQuality } from "../domain/types.js";
import type { MomentumScore } from "./momentum-score.system.js";
import type { TripleScreenResult } from "./triple-screen.system.js";

export interface TradeQualityInput {
  tripleScreen: TripleScreenResult;
  momentum: MomentumScore;
  forceIndexPositive: boolean;
  structureScore: number;
  hasBearishDivergence: boolean;
  rr: number;
}

export function calculateTradeQuality(input: TradeQualityInput): TradeQuality {
  const score =
    Math.round((input.tripleScreen.score / 100) * 20) +
    Math.round((input.momentum.score / 100) * 20) +
    (input.forceIndexPositive ? 15 : 5) +
    Math.min(15, Math.max(0, input.structureScore)) +
    (input.hasBearishDivergence ? 2 : 10) +
    rrScore(input.rr);

  return {
    score,
    grade: gradeTradeQuality(score)
  };
}

export function gradeTradeQuality(score: number): TradeQuality["grade"] {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "Avoid";
}

function rrScore(rr: number): number {
  if (rr > 3) return 20;
  if (rr > 2) return 16;
  if (rr >= 1.5) return 10;
  return 4;
}
