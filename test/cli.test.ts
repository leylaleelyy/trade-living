import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli.js";

describe("trade-living cli", () => {
  it("registers the expected command surface", () => {
    const program = createProgram();
    const commandNames = program.commands.map((command) => command.name());

    expect(commandNames).toEqual([
      "init",
      "daemon",
      "portfolio",
      "analyze",
      "momentum",
      "triple",
      "force",
      "risk",
      "report"
    ]);
    expect(program.options.map((option) => option.long).sort()).toContain("--live");
    expect(program.options.map((option) => option.long).sort()).toContain("--notify-channel");
  });
});
