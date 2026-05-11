import { LongbridgeCliAdapter } from "./longbridge-cli.adapter.js";
import { OfflineDataProvider } from "./offline-data.adapter.js";
import type { TradeLivingDataProvider } from "./data-provider.js";

export interface DataProviderOptions {
  live?: boolean;
  longbridgeCli?: string;
}

export function createDataProvider(options: DataProviderOptions): TradeLivingDataProvider {
  if (options.live) {
    return new LongbridgeCliAdapter(options.longbridgeCli ?? "longbridge");
  }

  return new OfflineDataProvider();
}

