import { spawn, type ChildProcess } from "node:child_process"
import { randomBytes, createHash } from "node:crypto"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  existsSync,
  unlinkSync,
  openSync,
  closeSync,
} from "node:fs"
import { createOpencodeClient, type OpencodeClient, type Config } from "@opencode-ai/sdk/v2"

export interface OpenCodeOptions {
  baseUrl?: string
  username?: string
  password?: string
  model?: string
  directory?: string
  serverConfig?: Config
}
interface ManagedServer {
  url: string
  password: string
  pid: number
  configHash: string
}

/** Native server connection; persists managed connection details so relay crashes do not launch duplicate harnesses. */
export class OpenCodeConnection {
  private process?: ChildProcess
  private starting?: Promise<OpencodeClient>
  private closed = false
  private options: OpenCodeOptions
  private managed?: ManagedServer
  private metadata?: string
  constructor(options: OpenCodeOptions = {}) {
    this.options = options
  }

  private makeClient(url: string, username?: string, password?: string): OpencodeClient {
    return createOpencodeClient({
      baseUrl: url,
      throwOnError: true,
      fetch: (input, init) => {
        const request = new Request(input, init)
        return fetch(request, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]) })
      },
      ...(password
        ? {
            headers: {
              Authorization: `Basic ${Buffer.from(`${username ?? "opencode"}:${password}`).toString("base64")}`,
            },
          }
        : {}),
    })
  }
  async client(): Promise<OpencodeClient> {
    if (this.closed) throw new Error("OpenCode connection is closed")
    if (!this.starting && this.options.baseUrl) {
      const url = new URL(this.options.baseUrl)
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid OpenCode server URL")
      if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        throw new Error("Remote OpenCode server requires HTTPS")
      this.starting = Promise.resolve(
        this.makeClient(
          url.href,
          this.options.username ?? process.env.OPENCODE_SERVER_USERNAME,
          this.options.password ?? process.env.OPENCODE_SERVER_PASSWORD,
        ),
      )
    }
    if (!this.starting)
      this.starting = this.launch().catch((error) => {
        this.starting = undefined
        throw error
      })
    return this.starting
  }
  private async launch(): Promise<OpencodeClient> {
    const manifest = createRequire(import.meta.url).resolve("opencode-ai/package.json")
    const directory = this.options.directory ?? resolve(dirname(manifest), "../../data/opencode")
    mkdirSync(directory, { recursive: true, mode: 0o700 })
    const metadata = resolve(directory, "opencode-server.json")
    this.metadata = metadata
    const configHash = createHash("sha256")
      .update(JSON.stringify(this.options.serverConfig ?? {}))
      .digest("hex")
    if (existsSync(metadata)) {
      const previous = JSON.parse(readFileSync(metadata, "utf8")) as ManagedServer
      if (!Number.isSafeInteger(previous.pid) || previous.pid < 1 || new URL(previous.url).hostname !== "127.0.0.1")
        throw new Error("Invalid managed OpenCode metadata")
      const client = this.makeClient(previous.url, "task-agent", previous.password)
      let alive = false
      try {
        alive = !!(await client.global.health({ signal: AbortSignal.timeout(2000) })).data?.healthy
      } catch {}
      if (alive) {
        this.managed = previous
        if (previous.configHash !== configHash)
          throw new Error("Managed OpenCode configuration changed. Stop the existing server before restarting.")
        return client
      }
      let processAlive = false
      try {
        process.kill(previous.pid, 0)
        processAlive = true
      } catch {}
      if (processAlive) throw new Error("Managed OpenCode is not responding; refusing to start a second harness")
      unlinkSync(metadata)
    }
    const binary = resolve(dirname(manifest), JSON.parse(readFileSync(manifest, "utf8")).bin.opencode)
    const password = randomBytes(24).toString("hex")
    const logPath = resolve(directory, `opencode-${randomBytes(8).toString("hex")}.log`)
    const log = openSync(logPath, "a", 0o600)
    let child: ChildProcess
    try {
      child = spawn(binary, ["serve", "--hostname=127.0.0.1", "--port=0"], {
        cwd: directory,
        detached: true,
        stdio: ["ignore", log, log],
        env: {
          ...process.env,
          OPENCODE_SERVER_USERNAME: "task-agent",
          OPENCODE_SERVER_PASSWORD: password,
          TASK_AGENT_INTERNAL: "1",
          OPENCODE_DISABLE_PROJECT_CONFIG: "true",
          OPENCODE_CONFIG_CONTENT: JSON.stringify({ plugin: [], ...this.options.serverConfig }),
        },
      })
    } finally {
      closeSync(log)
    }
    this.process = child
    let launchError: Error | undefined
    child.once("error", (error) => {
      launchError = error
    })
    child.once("exit", () => {
      if (this.process === child) {
        this.starting = undefined
        this.process = undefined
      }
    })
    child.unref()
    const deadline = Date.now() + 20000
    while (Date.now() < deadline) {
      if (launchError || child.exitCode !== null) throw launchError ?? new Error(`OpenCode exited (${child.exitCode})`)
      const output = readFileSync(logPath, "utf8").slice(-8192)
      const match = output.match(/opencode server listening on (http:\/\/[^\s]+)/)
      if (match) {
        const managed = { url: match[1]!, password, pid: child.pid!, configHash }
        const temporary = metadata + `.${process.pid}.tmp`
        writeFileSync(temporary, JSON.stringify(managed), { mode: 0o600 })
        renameSync(temporary, metadata)
        this.managed = managed
        return this.makeClient(managed.url, "task-agent", password)
      }
      await new Promise((ok) => setTimeout(ok, 100))
    }
    child.kill()
    throw new Error("OpenCode startup timed out")
  }
  async health(): Promise<unknown> {
    return (await (await this.client()).global.health()).data
  }
  async readiness(): Promise<unknown> {
    const client = await this.client()
    const health = (await client.global.health()).data
    const providers = (await client.provider.list({ directory: this.options.directory })).data
    return {
      health,
      connectedProviders: providers?.connected ?? [],
      defaultModels: Object.fromEntries((providers?.connected ?? []).map((id) => [id, providers?.default[id]])),
      model: this.options.model ?? null,
      server: this.options.baseUrl ?? "managed",
    }
  }
  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    const owned = this.managed
    if (!owned) {
      this.process?.kill("SIGTERM")
      return
    }
    // Authenticate the endpoint before signalling a recovered PID, which may otherwise have been reused.
    const client = this.makeClient(owned.url, "task-agent", owned.password)
    try {
      if ((await client.global.health({ signal: AbortSignal.timeout(2000) })).data?.healthy) {
        process.kill(owned.pid, "SIGTERM")
        const deadline = Date.now() + 5000
        while (Date.now() < deadline) {
          try {
            process.kill(owned.pid, 0)
          } catch {
            if (this.metadata && existsSync(this.metadata)) unlinkSync(this.metadata)
            return
          }
          await new Promise((ok) => setTimeout(ok, 100))
        }
      }
    } catch {
      /* Preserve metadata when shutdown was not acknowledged. */
    }
  }
}
