import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ChannelKind, InitWizardOptions, ModelProviderKind } from "./init-wizard.js";

export type AskFn = (question: string) => Promise<string>;

export async function promptInitWizardOptions(
  defaults: InitWizardOptions = {},
  ask: AskFn = createReadlineAsk()
): Promise<InitWizardOptions> {
  const longbridgeCli = await askString(
    ask,
    "Longbridge CLI path",
    defaults.longbridgeCli ?? "longbridge"
  );
  const channel = await askChoice<ChannelKind>(
    ask,
    "Notification channel",
    ["none", "telegram"],
    defaults.channel ?? "telegram"
  );
  const telegramBotTokenEnv =
    channel === "telegram"
      ? await askString(
          ask,
          "Telegram bot token env name",
          defaults.telegramBotTokenEnv ?? "TELEGRAM_BOT_TOKEN"
        )
      : defaults.telegramBotTokenEnv;
  const telegramChatId =
    channel === "telegram"
      ? await askString(ask, "Telegram chat id", defaults.telegramChatId ?? "")
      : defaults.telegramChatId;
  const modelProvider = await askChoice<ModelProviderKind>(
    ask,
    "Model provider",
    ["codex", "openai", "none"],
    defaults.modelProvider ?? "codex"
  );
  const model =
    modelProvider === "none"
      ? undefined
      : await askString(ask, "Model name", defaults.model ?? defaultModel(modelProvider));
  const daemon = await askBoolean(ask, "Enable background daemon", defaults.daemon ?? true);
  const daemonCommand = daemon
    ? await askString(
        ask,
        "Daemon command",
        defaults.daemonCommand ?? "trade-living portfolio --json"
      )
    : defaults.daemonCommand;
  const daemonIntervalSeconds = daemon
    ? await askNumber(
        ask,
        "Daemon interval seconds",
        defaults.daemonIntervalSeconds ?? 300
      )
    : defaults.daemonIntervalSeconds;
  const logDir = daemon
    ? await askString(ask, "Daemon log directory", defaults.logDir ?? ".trade-living/logs")
    : defaults.logDir;
  const configPath = await askString(
    ask,
    "Config file path",
    defaults.configPath ?? ".trade-living/config.json"
  );

  return {
    ...defaults,
    configPath,
    longbridgeCli,
    channel,
    telegramBotTokenEnv,
    telegramChatId,
    modelProvider,
    model,
    daemon,
    daemonCommand,
    daemonIntervalSeconds,
    logDir
  };
}

function createReadlineAsk(): AskFn {
  const rl = createInterface({ input, output });
  return async (question: string) => {
    try {
      return await rl.question(question);
    } finally {
      if (question.includes("Config file path")) {
        rl.close();
      }
    }
  };
}

async function askString(ask: AskFn, label: string, defaultValue: string): Promise<string> {
  const answer = (await ask(`${label} [${defaultValue}]: `)).trim();
  return answer || defaultValue;
}

async function askChoice<T extends string>(
  ask: AskFn,
  label: string,
  choices: T[],
  defaultValue: T
): Promise<T> {
  const answer = (await ask(`${label} (${choices.join("/")}) [${defaultValue}]: `)).trim();
  const value = (answer || defaultValue) as T;
  if (choices.includes(value)) {
    return value;
  }
  return defaultValue;
}

async function askBoolean(ask: AskFn, label: string, defaultValue: boolean): Promise<boolean> {
  const suffix = defaultValue ? "Y/n" : "y/N";
  const answer = (await ask(`${label} (${suffix}): `)).trim().toLowerCase();
  if (!answer) {
    return defaultValue;
  }
  return ["y", "yes", "true", "1"].includes(answer);
}

async function askNumber(ask: AskFn, label: string, defaultValue: number): Promise<number> {
  const answer = (await ask(`${label} [${defaultValue}]: `)).trim();
  const value = Number(answer || defaultValue);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function defaultModel(provider: ModelProviderKind): string {
  if (provider === "openai") {
    return "gpt-4.1";
  }
  if (provider === "codex") {
    return "codex";
  }
  return "none";
}
