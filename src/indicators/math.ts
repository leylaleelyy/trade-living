export function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function simpleMovingAverage(values: number[], period: number): number[] {
  assertPeriod(period);
  return values.map((_, index) => {
    if (index + 1 < period) return Number.NaN;
    const window = values.slice(index + 1 - period, index + 1);
    return round(window.reduce((sum, value) => sum + value, 0) / period);
  });
}

export function exponentialMovingAverage(values: number[], period: number): number[] {
  assertPeriod(period);
  if (values.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  let previous = values[0];

  for (const value of values) {
    previous = result.length === 0 ? value : value * multiplier + previous * (1 - multiplier);
    result.push(round(previous));
  }

  return result;
}

export function latestFinite(values: number[]): number | undefined {
  return [...values].reverse().find((value) => Number.isFinite(value));
}

function assertPeriod(period: number): void {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("Period must be a positive integer.");
  }
}
