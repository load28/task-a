import { spawn } from "node:child_process"
import { canonical } from "../contracts/canonical.ts"
import type { ProposalInput, ProposalSource } from "./index.ts"

export interface CommandProposalOptions { argv: string[]; cwd?: string; timeoutMs?: number; maxBytes?: number }

/** Explicitly trusted host command adapter; it is not a task runtime or a network sandbox. */
export class CommandProposalSource implements ProposalSource {
  private readonly options: CommandProposalOptions
  constructor(options: CommandProposalOptions) {
    if (!options.argv.length || !options.argv[0]?.trim() || options.argv.some(value => value.includes("\0"))) throw new Error("Proposal command requires explicit argv")
    if (options.timeoutMs !== undefined && (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0)) throw new Error("Proposal deadline must be positive")
    if (options.maxBytes !== undefined && (!Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0)) throw new Error("Proposal output limit must be positive")
    this.options = { ...options, argv: [...options.argv] }
  }
  async propose(input: ProposalInput): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.argv[0]!, this.options.argv.slice(1), { cwd: this.options.cwd, shell: false, detached: process.platform !== "win32", stdio: ["pipe", "pipe", "pipe"] })
      const chunks: Buffer[] = [], errors: Buffer[] = []
      let bytes = 0, settled = false
      const stop = () => {
        try { if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL"); else child.kill("SIGKILL") } catch { /* Already exited. */ }
      }
      const finish = (error?: Error, value?: unknown) => {
        if (settled) return
        settled = true; clearTimeout(timer); stop()
        if (error) reject(error); else resolve(value)
      }
      const timer = setTimeout(() => finish(new Error("Proposal command deadline exceeded")), this.options.timeoutMs ?? 30000)
      const collect = (target: Buffer[], chunk: Buffer) => {
        bytes += chunk.length
        if (bytes > (this.options.maxBytes ?? 8 * 1024 * 1024)) finish(new Error("Proposal command output limit exceeded"))
        else target.push(chunk)
      }
      child.stdout.on("data", chunk => collect(chunks, chunk))
      child.stderr.on("data", chunk => collect(errors, chunk))
      child.once("error", error => finish(error))
      child.stdin.on("error", error => finish(error))
      child.once("close", (code, signal) => {
        if (code !== 0) return finish(new Error(`Proposal command failed (${code ?? signal}): ${Buffer.concat(errors).toString("utf8").slice(0, 2000)}`))
        try { finish(undefined, JSON.parse(Buffer.concat(chunks).toString("utf8"))) } catch (error) { finish(error as Error) }
      })
      child.stdin.end(`${canonical(input)}\n`)
    })
  }
}
