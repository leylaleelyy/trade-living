import type { AnalyzeResult, Holding, PositionContext } from "../domain/types.js";
import { round } from "../indicators/math.js";

export function attachPositionContext(
  analysis: AnalyzeResult,
  holdings: Holding[]
): AnalyzeResult {
  const position = buildPositionContext(analysis, holdings);
  return position ? { ...analysis, position } : analysis;
}

export function buildPositionContext(
  analysis: AnalyzeResult,
  holdings: Holding[]
): PositionContext | undefined {
  const holding = holdings.find((candidate) => sameSymbol(candidate.symbol, analysis.symbol));
  if (!holding) return undefined;

  const costBasis = holding.avgCost * holding.quantity;
  const marketValue = holding.marketValue ?? marketValueFromPrice(holding);
  const unrealizedPnl = holding.unrealizedPnl ?? unrealizedPnlFromPrice(holding);
  const totalMarketValue = holdings.reduce(
    (sum, item) => sum + (item.marketValue ?? marketValueFromPrice(item) ?? 0),
    0
  );
  const currentPrice = holding.marketPrice;
  const riskToStop =
    currentPrice === undefined
      ? undefined
      : Math.max(0, (currentPrice - analysis.tradePlan.stop) * holding.quantity);

  return {
    status: "held",
    holding,
    costBasis: round(costBasis),
    ...(marketValue === undefined ? {} : { marketValue: round(marketValue) }),
    ...(unrealizedPnl === undefined ? {} : { unrealizedPnl: round(unrealizedPnl) }),
    ...(costBasis > 0 && unrealizedPnl !== undefined
      ? { unrealizedPnlPct: round((unrealizedPnl / costBasis) * 100) }
      : {}),
    ...(marketValue !== undefined && totalMarketValue > 0
      ? { portfolioWeightPct: round((marketValue / totalMarketValue) * 100) }
      : {}),
    ...(currentPrice !== undefined && holding.avgCost > 0
      ? { priceVsCostPct: round(((currentPrice - holding.avgCost) / holding.avgCost) * 100) }
      : {}),
    ...(riskToStop === undefined ? {} : { riskToStop: round(riskToStop) }),
    ...(riskToStop !== undefined && marketValue !== undefined && marketValue > 0
      ? { riskToStopPct: round((riskToStop / marketValue) * 100) }
      : {}),
    notes: buildPositionNotes(analysis, holding, {
      marketValue,
      unrealizedPnl,
      totalMarketValue,
      riskToStop
    })
  };
}

function sameSymbol(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

function marketValueFromPrice(holding: Holding): number | undefined {
  return holding.marketPrice === undefined ? undefined : holding.marketPrice * holding.quantity;
}

function unrealizedPnlFromPrice(holding: Holding): number | undefined {
  return holding.marketPrice === undefined
    ? undefined
    : (holding.marketPrice - holding.avgCost) * holding.quantity;
}

function buildPositionNotes(
  analysis: AnalyzeResult,
  holding: Holding,
  context: {
    marketValue?: number;
    unrealizedPnl?: number;
    totalMarketValue: number;
    riskToStop?: number;
  }
): string[] {
  const notes: string[] = [];
  const portfolioWeight =
    context.marketValue !== undefined && context.totalMarketValue > 0
      ? (context.marketValue / context.totalMarketValue) * 100
      : undefined;
  const bestRr = Math.max(...analysis.tradePlan.targets.map((target) => target.rr), 0);

  notes.push("Existing holding detected; evaluate this as position management, not a fresh idea.");

  if (context.unrealizedPnl !== undefined) {
    notes.push(
      context.unrealizedPnl >= 0
        ? "Position is currently profitable; protect against giving back gains if quality weakens."
        : "Position is currently at a loss; avoid averaging down without a fresh high-quality setup."
    );
  }

  if (holding.marketPrice !== undefined && holding.marketPrice <= analysis.tradePlan.stop) {
    notes.push("Current price is at or below the analysis stop; the existing plan is already invalidated.");
  } else if (context.riskToStop !== undefined) {
    notes.push("Risk-to-stop is calculated from current holding size and the analysis stop.");
  }

  if (portfolioWeight !== undefined && portfolioWeight >= 20) {
    notes.push("Portfolio weight is high; concentration risk matters more than a standalone signal.");
  }

  if (analysis.tradeQuality.grade === "Avoid" || bestRr < 1.5) {
    notes.push("Trade quality or RR is weak; prioritize hold/reduce discipline over adding exposure.");
  }

  return notes;
}
