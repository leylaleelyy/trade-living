import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type TelegramNotifyOptions = {
  configPath?: string;
  telegramBotTokenEnv?: string;
  telegramChatId?: string;
};

export type TelegramTarget = {
  botTokenEnv: string;
  botToken: string;
  chatId: string;
};

export type FetchLike = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

type InitConfigFile = {
  channel?: {
    type?: string;
    telegram?: {
      botTokenEnv?: string;
      chatId?: string;
    };
  };
};

const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_SAFE_CHUNK_SIZE = 3800;

export function resolveTelegramTarget(
  options: TelegramNotifyOptions = {},
  env: NodeJS.ProcessEnv = process.env
): TelegramTarget {
  const config = loadInitConfig(options.configPath);
  const configuredTelegram =
    config?.channel?.type === "telegram" ? config.channel.telegram : undefined;
  const botTokenEnv =
    options.telegramBotTokenEnv ??
    configuredTelegram?.botTokenEnv ??
    "TELEGRAM_BOT_TOKEN";
  const chatId =
    options.telegramChatId ??
    env.TELEGRAM_CHAT_ID ??
    configuredTelegram?.chatId;
  const botToken = env[botTokenEnv];

  if (!botToken) {
    throw new Error(`Telegram bot token is missing. Export ${botTokenEnv}.`);
  }
  if (!chatId) {
    throw new Error("Telegram chat id is missing. Pass --telegram-chat-id or set TELEGRAM_CHAT_ID.");
  }

  return { botTokenEnv, botToken, chatId };
}

export async function sendTelegramMessage(
  target: TelegramTarget,
  text: string,
  fetchImpl: FetchLike = globalThis.fetch
): Promise<{ sent: number }> {
  const chunks = splitTelegramMessage(toTelegramPlainText(text));

  for (const chunk of chunks) {
    const response = await fetchImpl(
      `https://api.telegram.org/bot${target.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: target.chatId,
          text: chunk,
          disable_web_page_preview: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram send failed with status ${response.status}: ${await response.text()}`);
    }
  }

  return { sent: chunks.length };
}

export function toTelegramPlainText(text: string): string {
  return text
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function splitTelegramMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MESSAGE_LIMIT) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > TELEGRAM_SAFE_CHUNK_SIZE) {
    const breakAt = Math.max(
      remaining.lastIndexOf("\n", TELEGRAM_SAFE_CHUNK_SIZE),
      remaining.lastIndexOf(" ", TELEGRAM_SAFE_CHUNK_SIZE)
    );
    const index = breakAt > 0 ? breakAt : TELEGRAM_SAFE_CHUNK_SIZE;
    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }
  if (remaining) {
    chunks.push(remaining);
  }
  return chunks;
}

function loadInitConfig(configPath = ".trade-living/config.json"): InitConfigFile | undefined {
  const resolved = resolve(configPath);
  if (!existsSync(resolved)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(resolved, "utf8")) as InitConfigFile;
  } catch {
    return undefined;
  }
}
