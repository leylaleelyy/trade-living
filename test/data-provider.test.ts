import { describe, expect, it } from "vitest";
import { createDataProvider } from "../src/adapters/data-provider.factory.js";
import { LongbridgeCliAdapter } from "../src/adapters/longbridge-cli.adapter.js";
import { LongbridgeSdkAdapter } from "../src/adapters/longbridge-sdk.adapter.js";
import { OfflineDataProvider } from "../src/adapters/offline-data.adapter.js";

describe("data provider factory", () => {
  it("uses the offline provider by default", async () => {
    const provider = createDataProvider({});

    await expect(provider.getKLines("AAPL.US")).resolves.toHaveLength(60);
    await expect(provider.getEnrichedHoldings()).resolves.toEqual([
      {
        symbol: "AAPL.US",
        quantity: 10,
        avgCost: 190,
        marketPrice: 210,
        marketValue: 2100,
        unrealizedPnl: 200
      }
    ]);
    expect(provider).toBeInstanceOf(OfflineDataProvider);
  });

  it("uses Longbridge CLI when live mode is enabled", () => {
    const provider = createDataProvider({
      live: true,
      longbridgeCli: "/opt/homebrew/bin/longbridge"
    });

    expect(provider).toBeInstanceOf(LongbridgeCliAdapter);
  });

  it("uses Longbridge SDK when requested", () => {
    const provider = createDataProvider({
      live: true,
      provider: "sdk",
      longbridgeRegion: "cn"
    });

    expect(provider).toBeInstanceOf(LongbridgeSdkAdapter);
  });
});
