import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type DaemonStartOptions = {
  command: string;
  intervalSeconds: number;
  logFile: string;
  pidFile: string;
};

export type DaemonStatus = {
  pidFile: string;
  pid?: number;
  running: boolean;
};

export function createDaemonLoopCommand(command: string, intervalSeconds: number): string {
  return `while true; do ${command}; sleep ${intervalSeconds}; done`;
}

export function startDaemon(options: DaemonStartOptions): DaemonStatus {
  const logFile = resolve(options.logFile);
  const pidFile = resolve(options.pidFile);
  mkdirSync(dirname(logFile), { recursive: true });
  mkdirSync(dirname(pidFile), { recursive: true });

  const logFd = openSync(logFile, "a");
  const child = spawn("sh", ["-lc", createDaemonLoopCommand(options.command, options.intervalSeconds)], {
    detached: true,
    stdio: ["ignore", logFd, logFd]
  });
  child.unref();

  writeFileSync(pidFile, `${child.pid}\n`, "utf8");

  return {
    pidFile,
    pid: child.pid,
    running: Boolean(child.pid)
  };
}

export function getDaemonStatus(pidFilePath: string): DaemonStatus {
  const pidFile = resolve(pidFilePath);
  if (!existsSync(pidFile)) {
    return { pidFile, running: false };
  }

  const pid = Number(readFileSync(pidFile, "utf8").trim());
  if (!Number.isInteger(pid) || pid <= 0) {
    return { pidFile, running: false };
  }

  return {
    pidFile,
    pid,
    running: isProcessRunning(pid)
  };
}

export function stopDaemon(pidFilePath: string): DaemonStatus {
  const status = getDaemonStatus(pidFilePath);
  if (status.pid && status.running) {
    process.kill(status.pid, "SIGTERM");
  }
  return { ...status, running: false };
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
