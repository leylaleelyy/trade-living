import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveTelegramTarget,
  sendTelegramMessage,
  splitTelegramMessage,
  toTelegramPlainText,
  type FetchLike
} from "../src/notify/telegram.service.js";

describe("telegram notification service", () => {
  it("resolves target from init config and environment without exposing token values", () => {
    const dir = mkdtempSync(join(tmpdir(), "trade-living-telegram-"));
    const configPath = join(dir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        channel: {
          type: "telegram",
          telegram: {
            botTokenEnv: "TRADE_LIVING_TELEGRAM_TOKEN",
            chatId: "123456"
          }
        }
      }),
      "utf8"
    );

    const target = resolveTelegramTarget(
      { configPath },
      { TRADE_LIVING_TELEGRAM_TOKEN: "secret-token" }
    );

    expect(target).toEqual({
      botTokenEnv: "TRADE_LIVING_TELEGRAM_TOKEN",
      botToken: "secret-token",
      chatId: "123456"
    });
  });

  it("strips HTML spans and chunks long messages", () => {
    expect(toTelegramPlainText('<span style="color:#16a34a">OK</span> &amp; ready')).toBe("OK & ready");
    const chunks = splitTelegramMessage("a".repeat(4100));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 3800)).toBe(true);
  });

  it("sends Telegram messages through the bot API", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, body: init.body });
      return { ok: true, status: 200, text: async () => "ok" };
    };

    const result = await sendTelegramMessage(
      {
        botTokenEnv: "TELEGRAM_BOT_TOKEN",
        botToken: "token",
        chatId: "chat"
      },
      "# Report\n\n<span>重点</span>",
      fetchImpl
    );

    expect(result.sent).toBe(1);
    expect(calls[0].url).toBe("https://api.telegram.org/bottoken/sendMessage");
    expect(JSON.parse(calls[0].body)).toMatchObject({
      chat_id: "chat",
      text: "# Report\n\n重点"
    });
  });
});
