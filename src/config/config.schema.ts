import { z } from "zod";

export const appConfigSchema = z.object({
  longbridgeCliPath: z.string().default("longbridge"),
  defaultOutput: z.enum(["json", "markdown", "pretty"]).default("pretty"),
  maxAccountRiskPct: z.number().positive().max(10).default(2)
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return appConfigSchema.parse({
    longbridgeCliPath: env.LONGBRIDGE_CLI_PATH ?? "longbridge",
    defaultOutput: env.TRADE_LIVING_OUTPUT ?? "pretty",
    maxAccountRiskPct: env.TRADE_LIVING_MAX_ACCOUNT_RISK_PCT
      ? Number(env.TRADE_LIVING_MAX_ACCOUNT_RISK_PCT)
      : 2
  });
}
