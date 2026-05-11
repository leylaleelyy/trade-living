import type { LongbridgeCliAdapter } from "../adapters/longbridge-cli.adapter.js";
import type { Holding } from "../domain/types.js";

export class HoldingsService {
  constructor(private readonly longbridge: LongbridgeCliAdapter) {}

  getHoldings(): Promise<Holding[]> {
    return this.longbridge.getHoldings();
  }
}
