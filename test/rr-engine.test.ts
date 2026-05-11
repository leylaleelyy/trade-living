import { describe, expect, it } from "vitest";
import { calculateRiskReward, gradeRiskReward } from "../src/risk/rr-engine.service.js";

describe("rr-engine", () => {
  it("calculates long risk/reward", () => {
    expect(calculateRiskReward(210, 201, 228)).toBe(2);
  });

  it("grades risk/reward according to the technical plan", () => {
    expect(gradeRiskReward(1.2)).toBe("Avoid");
    expect(gradeRiskReward(1.5)).toBe("Watch");
    expect(gradeRiskReward(2.5)).toBe("Good");
    expect(gradeRiskReward(3.1)).toBe("Excellent");
  });
});
