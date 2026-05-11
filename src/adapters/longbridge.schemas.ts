import { z } from "zod";
import type { Holding, KLine, Quote } from "../domain/types.js";

const numeric = z.union([z.number(), z.string()]).transform((value, context) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Expected a finite number, received ${String(value)}`
    });
    return z.NEVER;
  }

  return parsed;
});

const timestamp = z.union([z.number(), z.string()]).transform((value, context) => {
  if (typeof value === "number") {
    return value;
  }

  const numericTimestamp = Number(value);
  if (Number.isFinite(numericTimestamp)) {
    return numericTimestamp;
  }

  const parsedDate = Date.parse(value);
  if (Number.isFinite(parsedDate)) {
    return parsedDate;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Expected timestamp or parseable date, received ${value}`
  });
  return z.NEVER;
});

function unwrapLongbridgeData(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: unknown }).data;
  }

  return value;
}

function parseSinglePayload(value: unknown): unknown {
  const unwrapped = unwrapLongbridgeData(value);
  if (Array.isArray(unwrapped)) {
    return unwrapped[0];
  }

  return unwrapped;
}

function parseArrayPayload(value: unknown): unknown {
  const unwrapped = unwrapLongbridgeData(value);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (unwrapped && typeof unwrapped === "object") {
    if ("list" in unwrapped) return (unwrapped as { list: unknown }).list;
    if ("items" in unwrapped) return (unwrapped as { items: unknown }).items;
    if ("candlesticks" in unwrapped) return (unwrapped as { candlesticks: unknown }).candlesticks;
    if ("holdings" in unwrapped) return (unwrapped as { holdings: unknown }).holdings;
  }

  return unwrapped;
}

function requireNumericField(
  value: number | undefined,
  fieldName: string,
  context: z.RefinementCtx
): number {
  if (value === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Holding is missing required field: ${fieldName}`
    });
    return z.NEVER;
  }

  return value;
}

const rawQuoteSchema = z
  .object({
    symbol: z.string(),
    price: numeric.optional(),
    last: numeric.optional(),
    last_done: numeric.optional(),
    lastDone: numeric.optional(),
    change: numeric.optional(),
    change_rate: numeric.optional(),
    changeRate: numeric.optional(),
    volume: numeric.optional(),
    turnover: numeric.optional(),
    vwap: numeric.optional()
  })
  .passthrough()
  .transform((quote, context): Quote => {
    const price = quote.price ?? quote.last ?? quote.last_done ?? quote.lastDone;
    if (price === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quote is missing price, last_done, or lastDone"
      });
      return z.NEVER;
    }

    return {
      symbol: quote.symbol,
      price,
      change: quote.change,
      changeRate: quote.change_rate ?? quote.changeRate,
      volume: quote.volume,
      turnover: quote.turnover,
      vwap: quote.vwap
    };
  });

const rawKLineSchema = z
  .object({
    timestamp: timestamp.optional(),
    time: timestamp.optional(),
    date: timestamp.optional(),
    open: numeric,
    high: numeric,
    low: numeric,
    close: numeric,
    volume: numeric
  })
  .passthrough()
  .transform((kline, context): KLine => {
    const parsedTimestamp = kline.timestamp ?? kline.time ?? kline.date;
    if (parsedTimestamp === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "KLine is missing timestamp, time, or date"
      });
      return z.NEVER;
    }

    return {
      timestamp: parsedTimestamp,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume
    };
  });

const rawHoldingSchema = z
  .object({
    symbol: z.string(),
    name: z.string().optional(),
    currency: z.string().optional(),
    quantity: numeric.optional(),
    qty: numeric.optional(),
    avgCost: numeric.optional(),
    avg_cost: numeric.optional(),
    cost_price: numeric.optional(),
    marketPrice: numeric.optional(),
    market_price: numeric.optional(),
    current_price: numeric.optional(),
    marketValue: numeric.optional(),
    market_value: numeric.optional(),
    unrealizedPnl: numeric.optional(),
    unrealized_pnl: numeric.optional(),
    unrealized_pl: numeric.optional()
  })
  .passthrough()
  .transform((holding, context): Holding => {
    const quantity = holding.quantity ?? holding.qty;
    const avgCost = holding.avgCost ?? holding.avg_cost ?? holding.cost_price;
    const marketPrice =
      holding.marketPrice ?? holding.market_price ?? holding.current_price;
    const marketValue = holding.marketValue ?? holding.market_value;
    const unrealizedPnl =
      holding.unrealizedPnl ?? holding.unrealized_pnl ?? holding.unrealized_pl;

    return {
      symbol: holding.symbol,
      name: holding.name,
      currency: holding.currency,
      quantity: requireNumericField(quantity, "quantity", context),
      avgCost: requireNumericField(avgCost, "avgCost", context),
      marketPrice,
      marketValue,
      unrealizedPnl
    };
  });

export const longbridgeQuoteSchema = z.preprocess(
  parseSinglePayload,
  rawQuoteSchema
);

export const longbridgeKLinesSchema = z.preprocess(
  parseArrayPayload,
  z.array(rawKLineSchema)
);

export const longbridgeHoldingsSchema = z.preprocess(
  parseArrayPayload,
  z.array(rawHoldingSchema)
);
