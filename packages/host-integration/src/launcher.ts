import { spawn } from "node:child_process"
import { openSync, closeSync, mkdirSync, existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import type { HostConfig } from "./config.ts"
import { callService } from "./service.ts"
export async function ensureService(path: string, config: HostConfig): Promise<void> {
  try {
    await callService(config.socket, "/health", undefined, 300)
    return
  } catch {}
  const lock = resolve(config.directory, "startup.lock")
  try {
    mkdirSync(lock)
  } catch {
    if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs > 30000) {
      const { rmdirSync } = await import("node:fs")
      try {
        rmdirSync(lock)
      } catch {}
    }
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100))
      try {
        await callService(config.socket, "/health", undefined, 300)
        return
      } catch {}
    }
    throw new Error("Automatic service startup is still pending")
  }
  try {
    const log = openSync(resolve(config.directory, "service.log"), "a", 0o600)
    try {
      const child = spawn(
        process.execPath,
        [fileURLToPath(new URL("../../../scripts/host-service.ts", import.meta.url)), path],
        {
          detached: true,
          stdio: ["ignore", log, log],
          env: { ...process.env, TASK_AGENT_INTERNAL: "1" },
        },
      )
      child.unref()
    } finally {
      closeSync(log)
    }
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100))
      try {
        await callService(config.socket, "/health", undefined, 300)
        return
      } catch {}
    }
    throw new Error("Automatic service failed to start; inspect service.log")
  } finally {
    const { rmdirSync } = await import("node:fs")
    try {
      rmdirSync(lock)
    } catch {}
  }
}
