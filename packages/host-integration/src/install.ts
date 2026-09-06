import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  copyFileSync,
  chmodSync,
  unlinkSync,
  realpathSync,
} from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { socketPath, type HostConfig } from "./config.ts"
export interface InstallOptions {
  home: string
  workspace?: string
  hosts: Array<"claude" | "codex">
  database?: string
  model?: string
  opencodeUrl?: string
  graphMcpUrl?: string
  verifyCommand?: string
  maxWorkers?: number
  autoContinue?: boolean
}
export const serviceRoot = fileURLToPath(new URL("../../../", import.meta.url))
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
function readJson(path: string): any {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {}
}
function atomic(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, content, { mode: 0o600 })
  renameSync(temp, path)
}
function saveJson(path: string, value: unknown): void {
  atomic(path, JSON.stringify(value, null, 2) + "\n")
}
function backup(path: string): void {
  if (existsSync(path)) copyFileSync(path, `${path}.task-agent-${Date.now()}.bak`)
}
function own(command: string): boolean {
  return (
    command.includes(resolve(serviceRoot, "scripts/host-hook.ts")) ||
    command.includes(resolve(serviceRoot, "scripts/host-entry.ts"))
  )
}
export function mergeHooks(document: any, host: string, config: string, remove = false): any {
  const result = structuredClone(document)
  result.hooks ??= {}
  for (const [name, entries] of Object.entries(result.hooks)) {
    result.hooks[name] = (entries as any[]).flatMap((entry) => {
      const hooks = (entry.hooks ?? []).filter((h: any) => !own(h.command ?? ""))
      return hooks.length ? [{ ...entry, hooks }] : []
    })
    if (!result.hooks[name].length) delete result.hooks[name]
  }
  if (!remove) {
    const events = [
      "SessionStart",
      "UserPromptSubmit",
      "PreToolUse",
      "Stop",
      ...(host === "codex" ? ["PostCompact"] : []),
    ]
    for (const name of events) {
      const command = [process.execPath, resolve(serviceRoot, "scripts/host-hook.ts"), config, host]
        .map(quote)
        .join(" ")
      result.hooks[name] ??= []
      result.hooks[name].push({
        hooks: [
          {
            type: "command",
            command,
            timeout: ["SessionEnd", "Interrupt"].includes(name) ? 3 : name === "Stop" ? 30 : 120,
          },
        ],
      })
    }
  }
  return result
}
function replaceToml(text: string, block: string): { text: string; previous: string } {
  const lines = text.split("\n")
  let skip = false
  const kept: string[] = []
  const removed: string[] = []
  for (const line of lines) {
    if (/^\s*\[/.test(line))
      skip = /^\s*\[mcp_servers\.(?:task-agent|"task-agent"|'task-agent')(?:\.[^\]]*)?\]\s*(?:#.*)?$/.test(line)
    if (skip) removed.push(line)
    else kept.push(line)
  }
  return { text: kept.join("\n").trimEnd() + "\n" + block, previous: removed.join("\n") }
}
export function install(options: InstallOptions): { config: string; files: string[] } {
  if (options.maxWorkers !== undefined && (!Number.isInteger(options.maxWorkers) || options.maxWorkers < 1 || options.maxWorkers > 16)) throw new Error("maxWorkers must be 1–16")
  const workspace = options.workspace ? realpathSync(options.workspace) : undefined
  const directory = resolve(options.home, ".task-agent")
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
  const configPath = resolve(directory, "host.json")
  const existing = readJson(configPath)
  const config: HostConfig = {
    version: 1,
    autoDiscover: true,
    directory,
    database: options.database
      ? resolve(options.database)
      : (existing.database ?? resolve(serviceRoot, "data/tasks-v2.db")),
    socket: socketPath(directory),
    workspaces: existing.workspaces ?? [],
    opencodeUrl: options.opencodeUrl ?? existing.opencodeUrl,
    graphMcpUrl: options.graphMcpUrl ?? existing.graphMcpUrl,
    model: options.model ?? existing.model,
    autoContinue: options.autoContinue ?? existing.autoContinue ?? true,
    maxRuns: existing.maxRuns ?? 50,
    maxWorkers: options.maxWorkers ?? existing.maxWorkers ?? 3,
  }
  if (workspace) {
    const prior = config.workspaces.find((w) => w.path === workspace)
    if (prior) {
      if (options.verifyCommand !== undefined) prior.verifyCommand = options.verifyCommand
    } else config.workspaces.push({ path: workspace, verifyCommand: options.verifyCommand })
  }
  if (config.graphMcpUrl && config.workspaces.length !== 1)
    throw new Error("A remote Graph MCP URL requires a single workspace per host configuration")
  const manifestPath = resolve(directory, "installation.json")
  const manifest = readJson(manifestPath)
  const changes = new Map<string, string>()
  changes.set(configPath, JSON.stringify(config, null, 2) + "\n")
  for (const host of options.hosts) {
    const hooksPath = resolve(options.home, host === "claude" ? ".claude/settings.json" : ".codex/hooks.json")
    changes.set(hooksPath, JSON.stringify(mergeHooks(readJson(hooksPath), host, configPath), null, 2) + "\n")
    const mcp = {
      type: "stdio",
      command: process.execPath,
      args: [resolve(serviceRoot, "scripts/host-mcp.ts"), configPath],
    }
    if (host === "claude") {
      const path = resolve(options.home, ".claude.json")
      const settings = readJson(path)
      settings.mcpServers ??= {}
      if (!manifest.claude) manifest.claude = { mcp: settings.mcpServers["task-agent"] ?? null }
      settings.mcpServers["task-agent"] = mcp
      changes.set(path, JSON.stringify(settings, null, 2) + "\n")
    } else {
      const path = resolve(options.home, ".codex/config.toml")
      const original = existsSync(path) ? readFileSync(path, "utf8") : ""
      const block = `\n[mcp_servers.task-agent]\ncommand = ${JSON.stringify(mcp.command)}\nargs = ${JSON.stringify(mcp.args)}\n`
      const replaced = replaceToml(original, block)
      if (!manifest.codex) manifest.codex = { mcp: replaced.previous }
      changes.set(path, replaced.text)
    }
  }
  changes.set(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  const original = new Map(
    [...changes.keys()].map((path) => [path, existsSync(path) ? readFileSync(path, "utf8") : undefined]),
  )
  try {
    for (const [path, content] of changes) {
      backup(path)
      atomic(path, content)
    }
  } catch (error) {
    for (const [path, content] of original) {
      if (content === undefined) {
        if (existsSync(path)) unlinkSync(path)
      } else atomic(path, content)
    }
    throw error
  }
  return { config: configPath, files: [...changes.keys()] }
}
export function uninstall(home: string, hosts: Array<"claude" | "codex">): void {
  const directory = resolve(home, ".task-agent"),
    config = resolve(directory, "host.json"),
    manifestPath = resolve(directory, "installation.json")
  const manifest = readJson(manifestPath)
  for (const host of hosts) {
    const path = resolve(home, host === "claude" ? ".claude/settings.json" : ".codex/hooks.json")
    if (existsSync(path)) {
      backup(path)
      saveJson(path, mergeHooks(readJson(path), host, config, true))
    }
    if (host === "claude" && manifest.claude) {
      const p = resolve(home, ".claude.json")
      const data = readJson(p)
      if (manifest.claude.mcp === null) delete data.mcpServers?.["task-agent"]
      else {
        data.mcpServers ??= {}
        data.mcpServers["task-agent"] = manifest.claude.mcp
      }
      backup(p)
      saveJson(p, data)
    } else if (host === "codex" && manifest.codex) {
      const p = resolve(home, ".codex/config.toml")
      backup(p)
      atomic(p, replaceToml(readFileSync(p, "utf8"), manifest.codex.mcp + "\n").text)
    }
    delete manifest[host]
  }
  saveJson(manifestPath, manifest)
}
