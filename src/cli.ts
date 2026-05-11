#!/usr/bin/env node
import { Command } from "commander";
import { pathToFileURL } from "node:url";
import { createDataProvider, type DataProviderKind } from "./adapters/data-provider.factory.js";
import type { TradeLivingDataProvider } from "./adapters/data-provider.js";
import type { KLine } from "./domain/types.js";
import { calculateForceIndex } from "./indicators/force-index.indicator.js";
import { latestFinite } from "./indicators/math.js";
import { calculatePortfolioRisk } from "./risk/portfolio-risk.service.js";
import { calculatePositionSize } from "./risk/position-sizing.service.js";
import { calculateRiskReward, gradeRiskReward } from "./risk/rr-engine.service.js";
import { analyzeKLines } from "./systems/setup-engine.js";
import { calculateMomentumScore } from "./systems/momentum-score.system.js";
import { evaluateTripleScreen } from "./systems/triple-screen.system.js";
import { toJsonReport } from "./report/json.reporter.js";
import { toMarkdownReport } from "./report/markdown.reporter.js";

type OutputOptions = {
  json?: boolean;
  markdown?: boolean;
  pretty?: boolean;
  debug?: boolean;
  live?: boolean;
  longbridgeCli?: string;
  dataProvider?: DataProviderKind;
  longbridgeRegion?: "cn" | "global";
  start?: string;
};

function printResult(value: unknown, options: OutputOptions, title = "Trade Living") {
  if (options.markdown) {
    console.log(toMarkdownReport(title, asRows(value)));
    return;
  }

  console.log(toJsonReport(value));
}

function asRows(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : { value };
}

function getDataProvider(options: OutputOptions): TradeLivingDataProvider {
  return createDataProvider({
    live: options.live,
    longbridgeCli: options.longbridgeCli,
    provider: options.dataProvider,
    longbridgeRegion: options.longbridgeRegion
  });
}

async function getDailyKLines(symbol: string, options: OutputOptions): Promise<KLine[]> {
  return getDataProvider(options).getKLines(symbol, {
    start: options.start,
    period: "day"
  });
}

function getWeeklyKLines(dailyKLines: KLine[]): KLine[] {
  return dailyKLines.filter((_, index) => index % 5 === 0);
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("trade-living")
    .description("Professional trading analysis CLI based on Triple Screen Trading System")
    .version("0.1.0")
    .option("--json", "output JSON")
    .option("--markdown", "output Markdown")
    .option("--pretty", "output human-readable text")
    .option("--debug", "include debug details")
    .option("--live", "read market and portfolio data from Longbridge CLI")
    .option("--data-provider <provider>", "data provider: offline, cli, or sdk")
    .option("--longbridge-cli <path>", "Longbridge CLI executable path", "longbridge")
    .option("--longbridge-region <region>", "Longbridge region for SDK provider: global or cn")
    .option("--start <date>", "history start date for live K-line data", "2024-01-01");

  program
    .command("portfolio")
    .description("Show portfolio exposure and risk summary")
    .action(async () => {
      const options = program.opts<OutputOptions>();
      const holdings = await getDataProvider(options).getEnrichedHoldings();
      printResult(
        {
          holdings,
          risk: calculatePortfolioRisk(holdings)
        },
        options,
        "Portfolio"
      );
    });

  program
    .command("analyze")
    .argument("<symbol>", "market symbol, for example AAPL.US")
    .description("Run full Triple Screen, momentum, structure, divergence, and risk analysis")
    .action(async (symbol: string) => {
      const options = program.opts<OutputOptions>();
      const analysis = analyzeKLines(symbol, await getDailyKLines(symbol, options));
      printResult(analysis, options, `Analysis ${symbol}`);
    });

  program
    .command("momentum")
    .argument("<symbol>", "market symbol, for example AAPL.US")
    .description("Calculate momentum score")
    .action(async (symbol: string) => {
      const options = program.opts<OutputOptions>();
      const klines = await getDailyKLines(symbol, options);
      const triple = evaluateTripleScreen(getWeeklyKLines(klines), klines);
      printResult(
        { symbol, ...calculateMomentumScore(klines, triple) },
        options,
        `Momentum ${symbol}`
      );
    });

  program
    .command("triple")
    .argument("<symbol>", "market symbol, for example AAPL.US")
    .description("Run Triple Screen analysis")
    .action(async (symbol: string) => {
      const options = program.opts<OutputOptions>();
      const klines = await getDailyKLines(symbol, options);
      printResult(
        { symbol, ...evaluateTripleScreen(getWeeklyKLines(klines), klines) },
        options,
        `Triple Screen ${symbol}`
      );
    });

  program
    .command("force")
    .argument("<symbol>", "market symbol, for example AAPL.US")
    .description("Analyze Force Index")
    .action(async (symbol: string) => {
      const options = program.opts<OutputOptions>();
      const force = calculateForceIndex(await getDailyKLines(symbol, options));
      printResult(
        {
          symbol,
          latestRaw: latestFinite(force.raw),
          latestEma2: latestFinite(force.ema2),
          latestEma13: latestFinite(force.ema13)
        },
        options,
        `Force Index ${symbol}`
      );
    });

  program
    .command("risk")
    .argument("<symbol>", "market symbol, for example AAPL.US")
    .requiredOption("--entry <number>", "entry price", Number)
    .requiredOption("--stop <number>", "stop price", Number)
    .requiredOption("--equity <number>", "account equity", Number)
    .option("--target <number>", "target price", Number)
    .description("Calculate risk/reward and position sizing inputs")
    .action((symbol: string, options: { entry: number; stop: number; equity: number; target?: number }) => {
      const target = options.target ?? options.entry + (options.entry - options.stop) * 2;
      const rr = calculateRiskReward(options.entry, options.stop, target);
      const position = calculatePositionSize({
        entry: options.entry,
        stop: options.stop,
        equity: options.equity
      });

      printResult(
        {
          symbol,
          entry: options.entry,
          stop: options.stop,
          target,
          equity: options.equity,
          rr,
          grade: gradeRiskReward(rr),
          position
        },
        program.opts<OutputOptions>(),
        `Risk ${symbol}`
      );
    });

  program
    .command("report")
    .argument("[symbol]", "market symbol, for example AAPL.US", "AAPL.US")
    .description("Generate analysis report")
    .action(async (symbol: string) => {
      const options = program.opts<OutputOptions>();
      const analysis = analyzeKLines(symbol, await getDailyKLines(symbol, options));
      printResult(
        analysis,
        { ...options, markdown: options.markdown || (!options.json && !options.pretty) },
        `Trade Living Report ${symbol}`
      );
    });

  return program;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createProgram().parse(process.argv);
}
