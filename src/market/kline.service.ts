import type {
  KLineRequest,
  LongbridgeCliAdapter
} from "../adapters/longbridge-cli.adapter.js";
import type { KLine } from "../domain/types.js";

export class KLineService {
  constructor(private readonly longbridge: LongbridgeCliAdapter) {}

  getDailyKLines(symbol: string, request?: KLineRequest): Promise<KLine[]> {
    return this.longbridge.getKLines(symbol, request);
  }
}
