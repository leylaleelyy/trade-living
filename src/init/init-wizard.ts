import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type ChannelKind = "none" | "telegram";
export type ModelProviderKind = "none" | "openai" | "codex";

export type InitWizardOptions = {
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
};

export type CommandProbe = {
  exists(command: string): boolean;
  succeeds(command: string, args: string[]): boolean;
};

export type InitWizardPlan = {
  configPath: string;
  longbridge: {
    cliPath: string;
    installed: boolean;
    authenticated: boolean;
    nextSteps: string[];
  };
  channel: {
    type: ChannelKind;
    configured: boolean;
    telegram?: {
      botTokenEnv: string;
      chatId?: string;
    };
    nextSteps: string[];
  };
  model: {
    provider: ModelProviderKind;
    model: string;
    available: boolean;
    nextSteps: string[];
  };
  daemon: {
    enabled: boolean;
    logDir: string;
    pidFile: string;
    logFile: string;
    command: string;
    intervalSeconds: number;
    nextSteps: string[];
  };
};

export const defaultCommandProbe: CommandProbe = {
  exists(command: string): boolean {
    const result = spawnSync(command, ["--version"], { stdio: "ignore" });
    return !result.error;
  },
  succeeds(command: string, args: string[]): boolean {
    const result = spawnSync(command, args, { stdio: "ignore" });
    return result.status === 0;
  }
};

export function buildInitWizardPlan(
  options: InitWizardOptions = {},
  env: NodeJS.ProcessEnv = process.env,
  probe: CommandProbe = defaultCommandProbe
): InitWizardPlan {
  const configPath = resolve(options.configPath ?? ".trade-living/config.json");
  const longbridgeCli = options.longbridgeCli ?? env.LONGBRIDGE_CLI_PATH ?? "longbridge";
  const longbridgeInstalled = probe.exists(longbridgeCli);
  const longbridgeAuthenticated =
    longbridgeInstalled && probe.succeeds(longbridgeCli, ["check"]);
  const channelType = options.channel ?? "none";
  const telegramBotTokenEnv = options.telegramBotTokenEnv ?? "TELEGRAM_BOT_TOKEN";
  const telegramChatId = options.telegramChatId ?? env.TELEGRAM_CHAT_ID;
  const modelProvider = options.modelProvider ?? "codex";
  const model = options.model ?? defaultModelForProvider(modelProvider);
  const logDir = resolve(options.logDir ?? ".trade-living/logs");
  const daemonCommand = options.daemonCommand ?? "trade-living portfolio --json";
  const daemonIntervalSeconds = options.daemonIntervalSeconds ?? 300;
  const daemonEnabled = options.daemon ?? false;
  const logFile = resolve(logDir, "trade-living.log");
  const pidFile = resolve(logDir, "trade-living.pid");

  return {
    configPath,
    longbridge: {
      cliPath: longbridgeCli,
      installed: longbridgeInstalled,
      authenticated: longbridgeAuthenticated,
      nextSteps: getLongbridgeNextSteps(longbridgeInstalled, longbridgeAuthenticated, longbridgeCli)
    },
    channel: {
      type: channelType,
      configured:
        channelType === "none" ||
        Boolean(env[telegramBotTokenEnv] && telegramChatId),
      telegram:
        channelType === "telegram"
          ? {
              botTokenEnv: telegramBotTokenEnv,
              chatId: telegramChatId
            }
          : undefined,
      nextSteps: getChannelNextSteps(channelType, telegramBotTokenEnv, telegramChatId, env)
    },
    model: {
      provider: modelProvider,
      model,
      available: getModelAvailability(modelProvider, env, probe),
      nextSteps: getModelNextSteps(modelProvider, env, probe)
    },
    daemon: {
      enabled: daemonEnabled,
      logDir,
      pidFile,
      logFile,
      command: `trade-living daemon start --command "${daemonCommand}" --interval ${daemonIntervalSeconds} --log-file ${logFile} --pid-file ${pidFile}`,
      intervalSeconds: daemonIntervalSeconds,
      nextSteps: daemonEnabled
        ? []
        : ["Run init with --daemon to write daemon log and pid locations into config."]
    }
  };
}

export function writeInitWizardConfig(plan: InitWizardPlan): void {
  mkdirSync(dirname(plan.configPath), { recursive: true });
  mkdirSync(plan.daemon.logDir, { recursive: true });
  writeFileSync(`${plan.configPath}`, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
}

export function formatInitWizardPlan(plan: InitWizardPlan): string {
  const lines = [
    "# Trade Living Init",
    "",
    section("Longbridge", [
      statusLine("Installed", plan.longbridge.installed),
      statusLine("Authenticated", plan.longbridge.authenticated),
      `CLI: ${plan.longbridge.cliPath}`,
      ...nextStepLines(plan.longbridge.nextSteps)
    ]),
    section("Channel", [
      `Type: ${plan.channel.type}`,
      statusLine("Configured", plan.channel.configured),
      ...(plan.channel.telegram
        ? [
            `Telegram token env: ${plan.channel.telegram.botTokenEnv}`,
            `Telegram chat id: ${plan.channel.telegram.chatId ?? "(missing)"}`
          ]
        : []),
      ...nextStepLines(plan.channel.nextSteps)
    ]),
    section("Model", [
      `Provider: ${plan.model.provider}`,
      `Model: ${plan.model.model}`,
      statusLine("Available", plan.model.available),
      ...nextStepLines(plan.model.nextSteps)
    ]),
    section("Daemon", [
      statusLine("Enabled", plan.daemon.enabled),
      `Log file: ${plan.daemon.logFile}`,
      `PID file: ${plan.daemon.pidFile}`,
      `Interval seconds: ${plan.daemon.intervalSeconds}`,
      `Start command: ${plan.daemon.command}`,
      ...nextStepLines(plan.daemon.nextSteps)
    ]),
    section("Config", [`Path: ${plan.configPath}`])
  ];

  return lines.join("\n");
}

function defaultModelForProvider(provider: ModelProviderKind): string {
  if (provider === "openai") {
    return "gpt-4.1";
  }
  if (provider === "codex") {
    return "codex";
  }
  return "none";
}

function getLongbridgeNextSteps(installed: boolean, authenticated: boolean, cliPath: string): string[] {
  if (!installed) {
    return [
      "Install Longbridge CLI or set LONGBRIDGE_CLI_PATH to the executable path.",
      `Run ${cliPath} login after installation.`
    ];
  }
  if (!authenticated) {
    return [`Run ${cliPath} login, then verify with ${cliPath} check.`];
  }
  return [];
}

function getChannelNextSteps(
  channel: ChannelKind,
  tokenEnv: string,
  chatId: string | undefined,
  env: NodeJS.ProcessEnv
): string[] {
  if (channel === "none") {
    return ["Use --channel telegram to configure Telegram notifications."];
  }

  const steps: string[] = [];
  if (!env[tokenEnv]) {
    steps.push(`Export ${tokenEnv} with the Telegram bot token from BotFather.`);
  }
  if (!chatId) {
    steps.push("Pass --telegram-chat-id or set TELEGRAM_CHAT_ID.");
  }
  return steps;
}

function getModelAvailability(
  provider: ModelProviderKind,
  env: NodeJS.ProcessEnv,
  probe: CommandProbe
): boolean {
  if (provider === "none") {
    return true;
  }
  if (provider === "openai") {
    return Boolean(env.OPENAI_API_KEY);
  }
  return Boolean(env.CODEX_HOME || probe.exists("codex"));
}

function getModelNextSteps(
  provider: ModelProviderKind,
  env: NodeJS.ProcessEnv,
  probe: CommandProbe
): string[] {
  if (provider === "none") {
    return [];
  }
  if (provider === "openai" && !env.OPENAI_API_KEY) {
    return ["Export OPENAI_API_KEY before enabling OpenAI model calls."];
  }
  if (provider === "codex" && !env.CODEX_HOME && !probe.exists("codex")) {
    return ["Install or run inside Codex so the codex provider is available."];
  }
  return [];
}

function statusLine(label: string, ok: boolean): string {
  return `${label}: ${ok ? "PASS" : "WARN"}`;
}

function section(title: string, lines: string[]): string {
  return [`## ${title}`, ...lines].join("\n");
}

function nextStepLines(steps: string[]): string[] {
  if (steps.length === 0) {
    return [];
  }
  return ["Next steps:", ...steps.map((step) => `- ${step}`)];
}
