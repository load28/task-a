import { readFileSync, realpathSync, existsSync } from "node:fs"
import { isAbsolute, resolve, dirname } from "node:path"
import { createHash } from "node:crypto"
import { tmpdir, homedir } from "node:os"
export interface HostConfig {
  autoDiscover?: boolean
  version: 1
  database: string
  directory: string
  socket: string
  workspaces: Array<{ path: string; verifyCommand?: string }>
  opencodeUrl?: string
  graphMcpUrl?: string
  model?: string
  autoContinue: boolean
  maxRuns: number
}
export function socketPath(directory: string): string {
  return resolve(
    tmpdir(),
    `task-agent-${process.getuid?.() ?? "user"}-${createHash("sha256").update(directory).digest("hex").slice(0, 16)}.sock`,
  )
}
export function loadConfig(path: string): HostConfig {
  const c = JSON.parse(readFileSync(path, "utf8")) as HostConfig
  if (
    c.version !== 1 ||
    !isAbsolute(c.database) ||
    !isAbsolute(c.directory) ||
    !isAbsolute(c.socket) ||
    !Array.isArray(c.workspaces) ||
    (!c.workspaces.length && !c.autoDiscover)
  )
    throw new Error("Invalid automatic host configuration")
  if (c.graphMcpUrl && c.workspaces.length !== 1)
    throw new Error("A remote Graph MCP URL requires a single workspace per host configuration")
  for (const w of c.workspaces) {
    if (!isAbsolute(w.path)) throw new Error("Workspace must be absolute")
    w.path = realpathSync(w.path)
  }
  if (!Number.isInteger(c.maxRuns) || c.maxRuns < 1 || c.maxRuns > 1000) throw new Error("Invalid maxRuns")
  return c
}
export function workspaceFor(config: HostConfig, cwd: string): HostConfig["workspaces"][number] | undefined {
  const canonical = realpathSync(cwd)
  const registered = config.workspaces
    .filter((w) => canonical === w.path || canonical.startsWith(w.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0]
  if (registered) return registered
  if (!config.autoDiscover || config.graphMcpUrl) return
  const path = discoverWorkspace(canonical)
  return path ? { path } : undefined
}

/** Prefer the nearest git boundary (including worktrees); otherwise use project markers or cwd. */
export function discoverWorkspace(cwd: string): string | undefined {
  const canonical = realpathSync(cwd)
  const home = realpathSync(homedir())
  if (canonical === home || canonical === dirname(canonical)) return
  let marker: string | undefined
  for (let path = canonical; path !== dirname(path) && path !== home; path = dirname(path)) {
    if (existsSync(resolve(path, ".git"))) return path
    if (
      !marker &&
      ["package.json", "pyproject.toml", "Cargo.toml", "go.mod"].some((file) => existsSync(resolve(path, file)))
    )
      marker = path
  }
  return marker ?? canonical
}
