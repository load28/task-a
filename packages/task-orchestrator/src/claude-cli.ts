import { spawn } from "node:child_process"
import type { ExecutorRequest, ExecutorResponse, TaskExecutor } from "./executor.ts"
import { roleSystemPrompt } from "./instructions.ts"
import { formatRoleBriefing } from "./roles.ts"

export interface ClaudeCliExecutorOptions {
  command?: string
  model?: string
  permissionMode?: string
  maxTurns?: number
  maxBudgetUsd?: number
  timeoutMs?: number
  cwd?: string
  env?: NodeJS.ProcessEnv
  bare?: boolean
  noPermissionPrompts?: boolean
  extraArgs?: string[]
}

const READ_ONLY_TOOLS = ["Read", "Glob", "Grep", "WebFetch", "WebSearch"]

const READ_ONLY_KINDS = new Set(["plan", "integration_plan"])

export class ClaudeCliExecutor implements TaskExecutor {
  readonly name: string
  private options: Required<Omit<ClaudeCliExecutorOptions, "model" | "maxBudgetUsd" | "env" | "extraArgs">> & {
    model?: string
    maxBudgetUsd?: number
    env?: NodeJS.ProcessEnv
    extraArgs: string[]
  }

  constructor(options: ClaudeCliExecutorOptions = {}) {
    this.options = {
      command: options.command ?? process.env.TASK_AGENT_CLI ?? "claude",
      model: options.model ?? process.env.TASK_AGENT_CLI_MODEL,
      permissionMode: options.permissionMode ?? process.env.TASK_AGENT_CLI_PERMISSION_MODE ?? "acceptEdits",
      maxTurns: options.maxTurns ?? Number(process.env.TASK_AGENT_CLI_MAX_TURNS ?? 40),
      maxBudgetUsd: options.maxBudgetUsd ?? (process.env.TASK_AGENT_CLI_MAX_BUDGET_USD ? Number(process.env.TASK_AGENT_CLI_MAX_BUDGET_USD) : undefined),
      timeoutMs: options.timeoutMs ?? Number(process.env.TASK_AGENT_CLI_TIMEOUT_MS ?? 1_800_000),
      cwd: options.cwd ?? process.cwd(),
      env: options.env,
      bare: options.bare ?? process.env.TASK_AGENT_CLI_BARE === "1",
      noPermissionPrompts: options.noPermissionPrompts ?? true,
      extraArgs: options.extraArgs ?? [],
    }
    this.name = `claude-cli:${this.options.command}`
  }

  async run(request: ExecutorRequest): Promise<ExecutorResponse> {
    const args = this.buildArgs(request)
    const started = await this.spawn(args, request)
    if (!started.ok) return started
    return parseResult(started.stdout ?? "", started.stderr ?? "")
  }

  private buildArgs(request: ExecutorRequest): string[] {
    const args = ["-p", request.instruction, "--output-format", "json", "--json-schema", JSON.stringify(request.schema)]
    if (this.options.bare) args.push("--bare")
    if (this.options.model) args.push("--model", this.options.model)
    args.push("--session-id", request.sessionId)
    args.push("--permission-mode", READ_ONLY_KINDS.has(request.kind) ? "dontAsk" : this.options.permissionMode)
    if (this.options.noPermissionPrompts) args.push("--permission-prompts", "none")
    if (this.options.maxTurns > 0) args.push("--max-turns", String(this.options.maxTurns))
    if (this.options.maxBudgetUsd && this.options.maxBudgetUsd > 0) args.push("--max-budget-usd", String(this.options.maxBudgetUsd))
    const tools = this.toolsFor(request)
    if (tools.length > 0) args.push("--allowedTools", tools.join(","))
    if (READ_ONLY_KINDS.has(request.kind)) args.push("--disallowedTools", "Write,Edit,NotebookEdit")
    const systemPrompt = roleSystemPrompt(request.role, request.role ? formatRoleBriefing(request.role) : undefined)
    if (systemPrompt) args.push("--append-system-prompt", systemPrompt)
    if (request.workspace && request.workspace !== this.options.cwd) args.push("--add-dir", request.workspace)
    args.push(...this.options.extraArgs)
    return args
  }

  private toolsFor(request: ExecutorRequest): string[] {
    const declared = request.role?.allowedTools ?? []
    if (READ_ONLY_KINDS.has(request.kind)) {
      const filtered = declared.filter((tool) => READ_ONLY_TOOLS.includes(tool))
      return filtered.length > 0 ? filtered : READ_ONLY_TOOLS
    }
    return declared
  }

  private spawn(args: string[], request: ExecutorRequest): Promise<ExecutorResponse & { stdout?: string; stderr?: string }> {
    return new Promise((resolve) => {
      const child = spawn(this.options.command, args, {
        cwd: request.workspace || this.options.cwd,
        env: this.options.env ?? process.env,
        stdio: ["pipe", "pipe", "pipe"],
      })
      let stdout = ""
      let stderr = ""
      let settled = false
      const finish = (response: ExecutorResponse & { stdout?: string; stderr?: string }): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(response)
      }
      const timer = setTimeout(() => {
        child.kill("SIGTERM")
        setTimeout(() => child.kill("SIGKILL"), 5_000).unref()
        finish({ ok: false, error: `실행 하네스가 ${this.options.timeoutMs}ms 안에 끝나지 않았습니다` })
      }, this.options.timeoutMs)
      timer.unref()

      child.stdout.setEncoding("utf8")
      child.stderr.setEncoding("utf8")
      child.stdout.on("data", (chunk: string) => { stdout += chunk })
      child.stderr.on("data", (chunk: string) => { stderr += chunk })
      child.on("error", (error) => finish({ ok: false, error: `실행 하네스를 시작하지 못했습니다: ${error.message}` }))
      child.on("close", (code) => {
        if (code === 0) return finish({ ok: true, stdout, stderr })
        const detail = stderr.trim() || stdout.trim() || `exit code ${code}`
        finish({ ok: false, error: `실행 하네스가 실패했습니다 (${code}): ${detail.slice(0, 2000)}`, stdout, stderr })
      })
      child.stdin.on("error", () => undefined)
      child.stdin.end(request.context)
    })
  }
}

export function parseResult(stdout: string, stderr: string): ExecutorResponse {
  const payload = parseJsonObject(stdout)
  if (!payload) {
    return { ok: false, error: `실행 하네스 출력이 JSON이 아닙니다: ${(stderr || stdout).trim().slice(0, 2000)}` }
  }
  const sessionId = typeof payload.session_id === "string" ? payload.session_id : undefined
  const costUsd = typeof payload.total_cost_usd === "number" ? payload.total_cost_usd : undefined
  if (payload.is_error === true) {
    return { ok: false, error: describeResult(payload), sessionId, costUsd }
  }
  const structured = payload.structured_output
  if (structured !== undefined && structured !== null) {
    return { ok: true, output: structured, sessionId, costUsd }
  }
  const fromText = typeof payload.result === "string" ? parseJsonObject(payload.result) : undefined
  if (fromText) return { ok: true, output: fromText, sessionId, costUsd }
  return { ok: false, error: `구조화 출력이 없습니다: ${describeResult(payload)}`, sessionId, costUsd }
}

function describeResult(payload: Record<string, unknown>): string {
  if (typeof payload.result === "string" && payload.result.trim()) return payload.result.trim().slice(0, 2000)
  if (typeof payload.subtype === "string") return payload.subtype
  return "unknown executor error"
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim()
  if (!trimmed) return undefined
  const direct = tryParse(trimmed)
  if (direct) return direct
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) return tryParse(trimmed.slice(start, end + 1))
  return undefined
}

function tryParse(text: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(text) as unknown
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}
