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

export const bearishFixtureKLines: KLine[] = Array.from({ length: 60 }, (_, index) => {
  const close = 180 - index * 1.15 + Math.sin(index / 4) * 1.2;
  return {
    timestamp: Date.UTC(2026, 1, index + 1),
    open: close + 0.8,
    high: close + 1.7,
    low: close - 1.4,
    close,
    volume: 1400 + index * 12
  };
});

export const rangeFixtureKLines: KLine[] = Array.from({ length: 60 }, (_, index) => {
  const close = 120 + Math.sin(index / 2.5) * 1.8;
  return {
    timestamp: Date.UTC(2026, 3, index + 1),
    open: close - Math.cos(index / 3) * 0.4,
    high: close + 1.2,
    low: close - 1.2,
    close,
    volume: 1100 + (index % 6) * 25
  };
});

export const volatileFixtureKLines: KLine[] = Array.from({ length: 60 }, (_, index) => {
  const trend = 130 + index * 0.1;
  const shock = index % 2 === 0 ? 9 : -9;
  const close = trend + shock + Math.sin(index) * 2;
  return {
    timestamp: Date.UTC(2026, 5, index + 1),
    open: trend - shock * 0.5,
    high: Math.max(close, trend) + 7,
    low: Math.min(close, trend) - 7,
    close,
    volume: 1800 + (index % 5) * 300
  };
});
