export interface PositionSizingInput {
  entry: number;
  stop: number;
  equity: number;
  riskPct?: number;
}

export interface PositionSizingResult {
  accountRisk: number;
  perShareRisk: number;
  quantity: number;
  notional: number;
}

export function calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
  const riskPct = input.riskPct ?? 2;
  const perShareRisk = input.entry - input.stop;
  if (perShareRisk <= 0) {
    throw new Error("Entry must be greater than stop for long position sizing.");
  }

  const accountRisk = input.equity * (riskPct / 100);
  const quantity = Math.floor(accountRisk / perShareRisk);

  return {
    accountRisk,
    perShareRisk,
    quantity,
    notional: quantity * input.entry
  };
}
