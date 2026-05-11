import type { KLine } from "../src/domain/types.js";

export const fixtureKLines: KLine[] = Array.from({ length: 30 }, (_, index) => {
  const close = 100 + index;
  return {
    timestamp: Date.UTC(2026, 0, index + 1),
    open: close - 0.5,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000 + index * 10
  };
});
