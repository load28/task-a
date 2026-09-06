import { fileURLToPath } from "node:url"
import type { OpencodeClient, PermissionRequest, QuestionRequest, Session } from "@opencode-ai/sdk/v2"
import { OpenCodeConnection } from "./index.ts"
import { agentConfig } from "./agents.ts"
import { executionProgress } from "../../host-integration/src/presentation.ts"
import type { HostConfig } from "../../host-integration/src/config.ts"

export interface ServerBinding {
  control?: string
  sessionID: string
  messageID: string
  workspace: string
}
export interface ServerState {
  progress?: ReturnType<typeof executionProgress> & { workers?: ReturnType<typeof executionProgress>[] }
  state: "running" | "waiting" | "completed" | "failed" | "interrupted"
  text: string
  questions: QuestionRequest[]
  permissions: PermissionRequest[]
  activity: Array<{ tool: string; status: string }>
}
export interface HarnessServer {
  prepare(workspace: string, database: string): Promise<void>
  createSession(workspace: string, key: string): Promise<string>
  submit(binding: ServerBinding, text: string, plan: boolean, verifyCommand?: string): Promise<void>
  hasMessage(binding: ServerBinding): Promise<boolean>
  inspect(binding: ServerBinding): Promise<ServerState>
  reply(
    binding: ServerBinding,
    input: { requestID: string; kind: "question" | "permission"; answers?: string[][]; reply?: "once" | "reject" },
  ): Promise<void>
  cancel(binding: ServerBinding): Promise<void>
  readiness(): Promise<unknown>
  close(): void | Promise<void>
}

/** Transport for native OpenCode sessions. This class never interprets task decisions. */
export class OpenCodeServer implements HarnessServer {
  private connection: OpenCodeConnection
  private projects = new Set<string>()
  private prepared = new Map<string, OpencodeClient>()
  private config: HostConfig
  constructor(config: HostConfig) {
    this.config = config
    this.connection = new OpenCodeConnection({
      baseUrl: config.opencodeUrl,
      model: config.model,
      directory: config.directory,
      serverConfig: agentConfig(config.maxRuns, config.maxWorkers),
    })
  }
  async prepare(workspace: string, database: string): Promise<void> {
    this.projects.add(workspace)
    const client = await this.connection.client()
    if (this.prepared.get(workspace) === client) return
    if (this.config.opencodeUrl) {
      const desired = agentConfig(this.config.maxRuns, this.config.maxWorkers)
      const current = (await client.config.get({ directory: workspace })).data
      const contains = (actual: any, expected: any): boolean =>
        expected && typeof expected === "object" && !Array.isArray(expected)
          ? Object.entries(expected).every(([key, value]) => contains(actual?.[key], value))
          : JSON.stringify(actual) === JSON.stringify(expected)
      // Do not dispose an unchanged external instance on relay restart.
      if (!contains(current?.agent, desired.agent))
        await client.config.update({ directory: workspace, config: desired })
    }
    const status = await client.mcp.add({
      directory: workspace,
      name: "task_graph",
      config: this.config.graphMcpUrl
        ? {
            type: "remote",
            url: this.config.graphMcpUrl,
            enabled: true,
          }
        : {
            type: "local",
            command: [
              process.execPath,
              fileURLToPath(new URL("../../../scripts/graph-mcp.ts", import.meta.url)),
              database,
            ],
            environment: { TASK_AGENT_INTERNAL: "1", TASK_AGENT_MAX_WORKERS: String(this.config.maxWorkers ?? 3), TASK_AGENT_WORKSPACE: workspace },
            enabled: true,
          },
    })
    if (status.data?.task_graph?.status !== "connected")
      throw new Error(`OpenCode Task Graph MCP failed: ${JSON.stringify(status.data?.task_graph ?? status.error)}`)
    this.prepared.set(workspace, client)
  }
  private async model(workspace: string) {
    const client = await this.connection.client()
    const providers = (await client.provider.list({ directory: workspace })).data
    let selected = this.config.model ?? "claude"
    if (selected === "claude") {
      if (!providers?.connected.includes("anthropic") || !providers.default.anthropic)
        throw new Error("OpenCode 서버에서 Claude(anthropic) 인증과 기본 모델을 설정해야 합니다")
      selected = `anthropic/${providers.default.anthropic}`
    }
    const slash = selected.indexOf("/")
    if (slash < 1 || !selected.slice(slash + 1)) throw new Error("Model must be provider/model")
    const model = { providerID: selected.slice(0, slash), modelID: selected.slice(slash + 1) }
    if (!providers?.connected.includes(model.providerID))
      throw new Error(`OpenCode provider is not connected: ${model.providerID}`)
    // The public catalog includes models removed by the active authentication plugin.
    const available = (await client.config.providers({ directory: workspace })).data
    if (!available?.providers.find((p) => p.id === model.providerID)?.models[model.modelID])
      throw new Error(`OpenCode model is not available with current authentication: ${selected}`)
    return model
  }
  async createSession(workspace: string, key: string): Promise<string> {
    const client = await this.connection.client()
    // Recover the create-ack crash window using a stable title; no task semantics here.
    const title = `Task Agent ${key}`
    const existing = (await client.session.list({ directory: workspace, search: title, roots: true })).data?.find(
      (s) => s.title === title && s.directory === workspace,
    )
    if (existing) return existing.id
    const model = await this.model(workspace)
    const session = await client.session.create({
      directory: workspace,
      title,
      agent: "task-manager",
      model: { id: model.modelID, providerID: model.providerID },
    })
    return session.data!.id
  }
  async submit(binding: ServerBinding, text: string, plan: boolean, verifyCommand?: string): Promise<void> {
    const client = await this.connection.client()
    const model = await this.model(binding.workspace)
    await client.session.promptAsync({
      directory: binding.workspace,
      sessionID: binding.sessionID,
      messageID: binding.messageID,
      model,
      agent: plan ? "task-planner" : "task-manager",
      system: `${binding.control === "steer" ? "The prior native turn and its workers were explicitly interrupted to apply this user correction. Inspect the current graph and workspace, recover tasks left running by that interrupted turn using graph fail/reopen as needed, then revise and continue the original objective. Do not discard earlier requirements or claim interrupted work was verified." : ""} Host request transport. The following user message is the original request. ${verifyCommand ? `Required verification command: ${verifyCommand}. Execute it in OpenCode and record evidence.` : ""}`,
      parts: [{ type: "text", text }],
    })
  }
  private async sessions(binding: ServerBinding): Promise<Set<string>> {
    const client = await this.connection.client()
    const ids = new Set([binding.sessionID])
    const queue = [binding.sessionID]
    while (queue.length) {
      const children: Session[] =
        (await client.session.children({ directory: binding.workspace, sessionID: queue.shift()! })).data ?? []
      for (const child of children)
        if (!ids.has(child.id)) {
          ids.add(child.id)
          queue.push(child.id)
        }
    }
    return ids
  }
  async inspect(binding: ServerBinding): Promise<ServerState> {
    const client = await this.connection.client()
    const directory = binding.workspace
    const [messages, status, questions, permissions, ids] = await Promise.all([
      client.session.messages({ directory, sessionID: binding.sessionID }),
      client.session.status({ directory }),
      client.question.list({ directory }),
      client.permission.list({ directory }),
      this.sessions(binding),
    ])
    const answers = (messages.data ?? []).filter(
      (m) => m.info.role === "assistant" && m.info.parentID === binding.messageID,
    )
    const pendingQuestions = (questions.data ?? []).filter((q) => ids.has(q.sessionID))
    const pendingPermissions = (permissions.data ?? []).filter((p) => ids.has(p.sessionID))
    const active = [...ids].some((id) => status.data?.[id] && status.data[id]!.type !== "idle")
    const last = answers.at(-1)
    const info = last?.info.role === "assistant" ? last.info : undefined
    // Idle is not success: a tool-only response or missing terminal assistant message is interrupted.
    const terminal = info?.time.completed && info.finish === "stop"
    const state =
      pendingQuestions.length || pendingPermissions.length
        ? "waiting"
        : active
          ? "running"
          : info?.error
            ? "failed"
            : terminal
              ? "completed"
              : "interrupted"
    const workers = await Promise.all([...ids].filter((id) => id !== binding.sessionID && status.data?.[id]?.type !== undefined && status.data[id]!.type !== "idle").map(async (id) => {
      const workerMessages = (await client.session.messages({ directory, sessionID: id })).data
      const parts = Array.isArray(workerMessages) ? workerMessages.flatMap((m) => m.parts) : []
      return executionProgress(parts)
    }))
    return {
      state,
      progress: { ...executionProgress(answers.flatMap((m) => m.parts)), workers },
      text: info?.error
        ? JSON.stringify(info.error)
        : answers.flatMap((m) => m.parts.filter((p) => p.type === "text").map((p) => p.text)).join("\n"),
      questions: pendingQuestions,
      permissions: pendingPermissions,
      activity: answers.flatMap((m) =>
        m.parts.filter((p) => p.type === "tool").map((p) => ({ tool: p.tool, status: p.state.status })),
      ),
    }
  }
  async hasMessage(binding: ServerBinding): Promise<boolean> {
    const messages =
      (
        await (
          await this.connection.client()
        ).session.messages({ directory: binding.workspace, sessionID: binding.sessionID })
      ).data ?? []
    return messages.some((m) => m.info.id === binding.messageID)
  }
  async reply(
    binding: ServerBinding,
    input: { requestID: string; kind: "question" | "permission"; answers?: string[][]; reply?: "once" | "reject" },
  ): Promise<void> {
    const client = await this.connection.client()
    const state = await this.inspect(binding)
    if (input.kind === "question") {
      if (!state.questions.some((q) => q.id === input.requestID))
        throw new Error("Question is not pending in this session")
      if (
        !Array.isArray(input.answers) ||
        !input.answers.every((a) => Array.isArray(a) && a.every((s) => typeof s === "string"))
      )
        throw new Error("Question answers must be string[][]")
      await client.question.reply({ directory: binding.workspace, requestID: input.requestID, answers: input.answers })
    } else {
      if (!["once", "reject"].includes(input.reply ?? "")) throw new Error("Only once or reject is allowed")
      if (!state.permissions.some((p) => p.id === input.requestID))
        throw new Error("Permission is not pending in this session")
      await client.permission.reply({ directory: binding.workspace, requestID: input.requestID, reply: input.reply })
    }
  }
  async cancel(binding: ServerBinding): Promise<void> {
    const client = await this.connection.client()
    const ids = await this.sessions(binding)
    await Promise.all(
      [...ids].reverse().map((sessionID) => client.session.abort({ directory: binding.workspace, sessionID })),
    )
  }
  async readiness(): Promise<unknown> {
    const base = await this.connection.readiness()
    const workspaces = []
    for (const path of new Set([...this.config.workspaces.map((w) => w.path), ...this.projects])) {
      const w = { path }
      const client = await this.connection.client()
      let model: unknown
      try {
        model = await this.model(w.path)
      } catch (e) {
        model = { error: e instanceof Error ? e.message : String(e) }
      }
      workspaces.push({
        workspace: w.path,
        model,
        mcp: (await client.mcp.status({ directory: w.path })).data,
        agents: (await client.app.agents({ directory: w.path })).data
          ?.filter((a) => ["task-manager", "task-worker", "task-planner"].includes(a.name))
          .map((a) => ({ name: a.name, mode: a.mode })),
      })
    }
    return { ...(base as object), workspaces }
  }
  async close(): Promise<void> {
    await this.connection.close()
  }
}
