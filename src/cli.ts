#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { pathToFileURL } from "node:url";
import { createDataProvider, type DataProviderKind } from "./adapters/data-provider.factory.js";
import type { TradeLivingDataProvider } from "./adapters/data-provider.js";
import {
  createOptionQuoteProvider,
  type OptionQuoteProviderKind
} from "./adapters/option-quote-provider.factory.js";
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
import { enrichOptionHoldings } from "./portfolio/option-enrichment.service.js";
import { getDaemonStatus, startDaemon, stopDaemon } from "./runtime/daemon.service.js";
import {
  buildInitWizardPlan,
  formatInitWizardPlan,
  writeInitWizardConfig,
  type ChannelKind,
  type ModelProviderKind
} from "./init/init-wizard.js";

type OutputOptions = {
  json?: boolean;
  markdown?: boolean;
  pretty?: boolean;
  debug?: boolean;
  live?: boolean;
  longbridgeCli?: string;
  dataProvider?: DataProviderKind;
  longbridgeRegion?: "cn" | "global";
  optionQuoteProvider?: OptionQuoteProviderKind;
  start?: string;
};

type InitCommandOptions = {
  json?: boolean;
  configPath?: string;
  longbridgeCli?: string;
  channel?: ChannelKind;
  telegramBotTokenEnv?: string;
  telegramChatId?: string;
  modelProvider?: ModelProviderKind;
  model?: string;
  daemon?: boolean;
  daemonCommand?: string;
  daemonIntervalSeconds?: number;
  logDir?: string;
  dryRun?: boolean;
};

type DaemonCommandOptions = {
  command?: string;
  interval?: number;
  logFile?: string;
  pidFile?: string;
  json?: boolean;
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

function parseChannel(value: string): ChannelKind {
  if (value === "none" || value === "telegram") {
    return value;
  }
  throw new InvalidArgumentError("channel must be none or telegram");
}

function parseModelProvider(value: string): ModelProviderKind {
  if (value === "none" || value === "openai" || value === "codex") {
    return value;
  }
  throw new InvalidArgumentError("model provider must be none, openai, or codex");
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
    .option("--option-quote-provider <provider>", "option quote provider: none, tradier, marketdata, or auto", "none")
    .option("--longbridge-cli <path>", "Longbridge CLI executable path", "longbridge")
    .option("--longbridge-region <region>", "Longbridge region for SDK provider: global or cn")
    .option("--start <date>", "history start date for live K-line data", "2024-01-01");

  program
    .command("init")
    .description("Guide first-time setup for Longbridge, channels, model provider, and daemon logging")
    .option("--json", "output JSON")
    .option("--config-path <path>", "config file path", ".trade-living/config.json")
    .option("--longbridge-cli <path>", "Longbridge CLI executable path", "longbridge")
    .option("--channel <channel>", "notification channel: none or telegram", parseChannel, "none")
    .option("--telegram-bot-token-env <name>", "environment variable that stores the Telegram bot token", "TELEGRAM_BOT_TOKEN")
    .option("--telegram-chat-id <id>", "Telegram chat id")
    .option("--model-provider <provider>", "model provider: none, openai, or codex", parseModelProvider, "codex")
    .option("--model <model>", "model name or alias")
    .option("--daemon", "enable daemon log and pid configuration")
    .option("--daemon-command <command>", "daemon command to run in the background", "trade-living portfolio --json")
    .option("--daemon-interval <seconds>", "daemon command interval in seconds", Number, 300)
    .option("--log-dir <path>", "daemon log directory", ".trade-living/logs")
    .option("--dry-run", "print the setup plan without writing config")
    .action((options: InitCommandOptions) => {
      const outputJson = Boolean(options.json || program.opts<OutputOptions>().json);
      const plan = buildInitWizardPlan({
        configPath: options.configPath,
        longbridgeCli: options.longbridgeCli,
        channel: options.channel,
        telegramBotTokenEnv: options.telegramBotTokenEnv,
        telegramChatId: options.telegramChatId,
        modelProvider: options.modelProvider,
        model: options.model,
        daemon: options.daemon,
        daemonCommand: options.daemonCommand,
        daemonIntervalSeconds: options.daemonIntervalSeconds,
        logDir: options.logDir
      });

      if (!options.dryRun) {
        writeInitWizardConfig(plan);
      }

      if (outputJson) {
        console.log(toJsonReport(plan));
        return;
      }

      console.log(formatInitWizardPlan(plan));
    });

  const daemon = program
    .command("daemon")
    .description("Run Trade Living commands in the background with pid and log files");

  daemon
    .command("start")
    .description("Start a background daemon loop")
    .option("--command <command>", "command to run repeatedly", "trade-living portfolio --json")
    .option("--interval <seconds>", "seconds between runs", Number, 300)
    .option("--log-file <path>", "daemon log file", ".trade-living/logs/trade-living.log")
    .option("--pid-file <path>", "daemon pid file", ".trade-living/logs/trade-living.pid")
    .option("--json", "output JSON")
    .action((options: DaemonCommandOptions) => {
      const status = startDaemon({
        command: options.command ?? "trade-living portfolio --json",
        intervalSeconds: options.interval ?? 300,
        logFile: options.logFile ?? ".trade-living/logs/trade-living.log",
        pidFile: options.pidFile ?? ".trade-living/logs/trade-living.pid"
      });
      printResult(status, { json: options.json ?? program.opts<OutputOptions>().json }, "Daemon");
    });

  daemon
    .command("status")
    .description("Show daemon status")
    .option("--pid-file <path>", "daemon pid file", ".trade-living/logs/trade-living.pid")
    .option("--json", "output JSON")
    .action((options: DaemonCommandOptions) => {
      const status = getDaemonStatus(options.pidFile ?? ".trade-living/logs/trade-living.pid");
      printResult(status, { json: options.json ?? program.opts<OutputOptions>().json }, "Daemon");
    });

  daemon
    .command("stop")
    .description("Stop a background daemon loop")
    .option("--pid-file <path>", "daemon pid file", ".trade-living/logs/trade-living.pid")
    .option("--json", "output JSON")
    .action((options: DaemonCommandOptions) => {
      const status = stopDaemon(options.pidFile ?? ".trade-living/logs/trade-living.pid");
      printResult(status, { json: options.json ?? program.opts<OutputOptions>().json }, "Daemon");
    });

  program
    .command("portfolio")
    .description("Show portfolio exposure and risk summary")
    .action(async () => {
      const options = program.opts<OutputOptions>();
      const holdings = await enrichOptionHoldings(
        await getDataProvider(options).getEnrichedHoldings(),
        createOptionQuoteProvider({ provider: options.optionQuoteProvider })
      );
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
