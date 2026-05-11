import {
  CompositeOptionQuoteProvider,
  type OptionQuoteProvider
} from "./option-quote-provider.js";
import { MarketDataOptionQuoteAdapter } from "./marketdata-option.adapter.js";
import { TradierOptionQuoteAdapter } from "./tradier-option.adapter.js";

export type OptionQuoteProviderKind = "none" | "tradier" | "marketdata" | "auto";

export interface OptionQuoteProviderFactoryOptions {
  provider?: OptionQuoteProviderKind;
}

export function createOptionQuoteProvider(
  options: OptionQuoteProviderFactoryOptions
): OptionQuoteProvider | undefined {
  const provider = options.provider ?? "none";
  if (provider === "none") return undefined;
  if (provider === "tradier") return new TradierOptionQuoteAdapter();
  if (provider === "marketdata") return new MarketDataOptionQuoteAdapter();
  if (provider === "auto") {
    return new CompositeOptionQuoteProvider([
      new TradierOptionQuoteAdapter(),
      new MarketDataOptionQuoteAdapter()
    ]);
  }

  throw new Error(`Unsupported option quote provider: ${String(provider)}`);
}

