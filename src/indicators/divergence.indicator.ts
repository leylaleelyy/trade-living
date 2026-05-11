export type DivergenceSignal = "bullish" | "bearish" | "none";

export function detectDivergence(prices: number[], indicator: number[]): DivergenceSignal {
  const paired = prices
    .map((price, index) => ({ price, indicator: indicator[index] }))
    .filter((point) => Number.isFinite(point.price) && Number.isFinite(point.indicator));

  if (paired.length < 4) return "none";

  const previous = paired.at(-4)!;
  const latest = paired.at(-1)!;

  if (latest.price > previous.price && latest.indicator < previous.indicator) {
    return "bearish";
  }

  if (latest.price < previous.price && latest.indicator > previous.indicator) {
    return "bullish";
  }

  return "none";
}
