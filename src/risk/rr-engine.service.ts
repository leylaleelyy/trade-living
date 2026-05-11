export type RrGrade = "Avoid" | "Watch" | "Good" | "Excellent";

export function calculateRiskReward(entry: number, stop: number, target: number): number {
  const risk = entry - stop;
  if (risk <= 0) {
    throw new Error("Entry must be greater than stop for long risk/reward calculation.");
  }

  return (target - entry) / risk;
}

export function gradeRiskReward(rr: number): RrGrade {
  if (rr > 3) return "Excellent";
  if (rr > 2) return "Good";
  if (rr >= 1.5) return "Watch";
  return "Avoid";
}
