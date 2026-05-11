import { describe, expect, it } from "vitest";
import { calculateATR } from "../src/indicators/atr.indicator.js";
import { calculateForceIndex } from "../src/indicators/force-index.indicator.js";
import { calculateMA } from "../src/indicators/ma.indicator.js";
import { calculateMACD } from "../src/indicators/macd.indicator.js";
import { calculateRSI } from "../src/indicators/rsi.indicator.js";
import { calculateVWAP } from "../src/market/vwap.service.js";
import { fixtureKLines } from "./fixtures.js";

describe("indicator primitives", () => {
  it("calculates moving averages", () => {
    expect(calculateMA(fixtureKLines, 5).latest).toBe(127);
  });

  it("calculates MACD histogram", () => {
    expect(calculateMACD(fixtureKLines).at(-1)?.histogram).toBeGreaterThan(0);
  });

  it("calculates RSI", () => {
    expect(calculateRSI(fixtureKLines, 14).at(-1)).toBe(100);
  });

  it("calculates ATR", () => {
    expect(calculateATR(fixtureKLines, 14).at(-1)).toBeGreaterThan(1);
  });

  it("calculates Force Index", () => {
    expect(calculateForceIndex(fixtureKLines).raw.at(-1)).toBe(1290);
  });

  it("calculates VWAP", () => {
    expect(calculateVWAP(fixtureKLines)).toBeGreaterThan(114);
  });
});
