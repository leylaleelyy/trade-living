import { LongbridgeCliAdapter } from "./longbridge-cli.adapter.js";
import { LongbridgeSdkAdapter } from "./longbridge-sdk.adapter.js";
import { OfflineDataProvider } from "./offline-data.adapter.js";
import type { TradeLivingDataProvider } from "./data-provider.js";

export type DataProviderKind = "offline" | "cli" | "sdk";

export interface DataProviderOptions {
  live?: boolean;
  longbridgeCli?: string;
  provider?: DataProviderKind;
  longbridgeRegion?: "cn" | "global";
}

export function createDataProvider(options: DataProviderOptions): TradeLivingDataProvider {
  const provider = options.provider ?? (options.live ? "cli" : "offline");

  if (provider === "sdk") {
    return new LongbridgeSdkAdapter({ region: options.longbridgeRegion });
  }

  if (provider === "cli") {
    return new LongbridgeCliAdapter(options.longbridgeCli ?? "longbridge");
  }

  if (provider === "offline") {
    return new OfflineDataProvider();
  }

  throw new Error(`Unsupported data provider: ${String(provider)}`);
}
