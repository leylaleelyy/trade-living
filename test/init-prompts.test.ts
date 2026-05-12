import { describe, expect, it } from "vitest";
import { promptInitWizardOptions, type AskFn } from "../src/init/init-prompts.js";

function scriptedAsk(answers: string[]): AskFn {
  let index = 0;
  return async () => answers[index++] ?? "";
}

describe("init prompts", () => {
  it("collects step-by-step Telegram, Codex, and daemon options", async () => {
    const options = await promptInitWizardOptions(
      {},
      scriptedAsk([
        "longbridge",
        "telegram",
        "TELEGRAM_BOT_TOKEN",
        "123456",
        "codex",
        "codex",
        "yes",
        "trade-living portfolio --json",
        "120",
        ".trade-living/logs",
        ".trade-living/config.json"
      ])
    );

    expect(options.longbridgeCli).toBe("longbridge");
    expect(options.channel).toBe("telegram");
    expect(options.telegramBotTokenEnv).toBe("TELEGRAM_BOT_TOKEN");
    expect(options.telegramChatId).toBe("123456");
    expect(options.modelProvider).toBe("codex");
    expect(options.model).toBe("codex");
    expect(options.daemon).toBe(true);
    expect(options.daemonCommand).toBe("trade-living portfolio --json");
    expect(options.daemonIntervalSeconds).toBe(120);
    expect(options.logDir).toBe(".trade-living/logs");
    expect(options.configPath).toBe(".trade-living/config.json");
  });

  it("uses defaults when answers are blank", async () => {
    const options = await promptInitWizardOptions({}, scriptedAsk([]));

    expect(options.longbridgeCli).toBe("longbridge");
    expect(options.channel).toBe("telegram");
    expect(options.telegramBotTokenEnv).toBe("TELEGRAM_BOT_TOKEN");
    expect(options.modelProvider).toBe("codex");
    expect(options.daemon).toBe(true);
    expect(options.daemonIntervalSeconds).toBe(300);
    expect(options.configPath).toBe(".trade-living/config.json");
  });
});
