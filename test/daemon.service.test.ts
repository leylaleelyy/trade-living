import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createDaemonLoopCommand, getDaemonStatus } from "../src/runtime/daemon.service.js";

describe("daemon service", () => {
  it("builds a recurring shell command", () => {
    expect(createDaemonLoopCommand("trade-living portfolio --json", 300)).toBe(
      "while true; do trade-living portfolio --json; sleep 300; done"
    );
  });

  it("reports stopped status when pid file is missing or invalid", () => {
    const missing = getDaemonStatus(join(tmpdir(), "trade-living-missing.pid"));
    expect(missing.running).toBe(false);
    expect(missing.pid).toBeUndefined();

    const invalidPidFile = join(tmpdir(), "trade-living-invalid.pid");
    writeFileSync(invalidPidFile, "not-a-pid\n", "utf8");
    const invalid = getDaemonStatus(invalidPidFile);
    expect(invalid.running).toBe(false);
    expect(invalid.pid).toBeUndefined();
  });
});
