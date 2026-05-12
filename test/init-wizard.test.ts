import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInitWizardPlan,
  formatInitWizardPlan,
  writeInitWizardConfig,
  type CommandProbe
} from "../src/init/init-wizard.js";

function fakeProbe(commands: Record<string, { exists: boolean; succeeds?: boolean }>): CommandProbe {
  return {
    exists(command: string): boolean {
      return commands[command]?.exists ?? false;
    },
    succeeds(command: string): boolean {
      return commands[command]?.succeeds ?? false;
    }
  };
}

describe("init wizard", () => {
  it("reports setup gaps for Longbridge, Telegram, and Codex", () => {
    const plan = buildInitWizardPlan(
      {
        channel: "telegram",
        telegramChatId: "12345",
        modelProvider: "codex",
        daemon: true
      },
      {},
      fakeProbe({})
    );

    expect(plan.longbridge.installed).toBe(false);
    expect(plan.longbridge.authenticated).toBe(false);
    expect(plan.longbridge.nextSteps).toContain("Install Longbridge CLI or set LONGBRIDGE_CLI_PATH to the executable path.");
    expect(plan.channel.configured).toBe(false);
    expect(plan.channel.nextSteps).toContain("Export TELEGRAM_BOT_TOKEN with the Telegram bot token from BotFather.");
    expect(plan.model.available).toBe(false);
    expect(plan.daemon.enabled).toBe(true);
    expect(plan.daemon.command).toContain("trade-living daemon start");
    expect(plan.daemon.intervalSeconds).toBe(300);
  });

  it("builds a configured plan and writes config without storing Telegram token values", () => {
    const dir = mkdtempSync(join(tmpdir(), "trade-living-init-"));
    const configPath = join(dir, "config.json");
    const plan = buildInitWizardPlan(
      {
        configPath,
        channel: "telegram",
        telegramChatId: "67890",
        modelProvider: "openai",
        daemon: true,
        logDir: join(dir, "logs")
      },
      {
        TELEGRAM_BOT_TOKEN: "secret-token",
        OPENAI_API_KEY: "secret-openai-key"
      },
      fakeProbe({
        longbridge: { exists: true, succeeds: true }
      })
    );

    expect(plan.longbridge.installed).toBe(true);
    expect(plan.longbridge.authenticated).toBe(true);
    expect(plan.channel.configured).toBe(true);
    expect(plan.model.available).toBe(true);

    writeInitWizardConfig(plan);

    const content = readFileSync(configPath, "utf8");
    expect(content).toContain("\"botTokenEnv\": \"TELEGRAM_BOT_TOKEN\"");
    expect(content).toContain("\"chatId\": \"67890\"");
    expect(content).not.toContain("secret-token");
    expect(content).not.toContain("secret-openai-key");
  });

  it("formats a human-readable setup report", () => {
    const plan = buildInitWizardPlan({}, {}, fakeProbe({}));
    const report = formatInitWizardPlan(plan);

    expect(report).toContain("# Trade Living Init");
    expect(report).toContain("## Longbridge");
    expect(report).toContain("## Channel");
    expect(report).toContain("## Model");
    expect(report).toContain("## Daemon");
  });
});
