import { fileURLToPath } from "node:url"
import type { OpencodeClient, PermissionRequest, QuestionRequest, Session } from "@opencode-ai/sdk/v2"
import { OpenCodeConnection } from "./index.ts"
import { agentConfig } from "./agents.ts"
import { requestMessages } from "./request-messages.ts"
import { executionProgress } from "../../host-integration/src/presentation.ts"
import type { HostConfig } from "../../host-integration/src/config.ts"

export interface ServerBinding {
  control?: string
  parentMessageID?:string
  sessionID: string
  messageID: string
  endMessageID?: string
  workspace: string
}
export interface ServerState {
  executionTaskIds?: string[]
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
  stopWorkspace?(workspace: string): Promise<{ stopped: boolean; evidence: string }>
  stopWorker?(workspace: string, sessionId: string): Promise<{ stopped: boolean; evidence: string }>
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
      serverConfig: agentConfig(config.maxRuns, config.maxWorkers, !!config.kubernetes),
    })
  }
  async prepare(workspace: string, database: string): Promise<void> {
    this.projects.add(workspace)
    const client = await this.connection.client()
    if (this.prepared.get(workspace) === client) return
    if (this.config.opencodeUrl) {
      const desired = agentConfig(this.config.maxRuns, this.config.maxWorkers, !!this.config.kubernetes)
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
            environment: { TASK_AGENT_INTERNAL: "1", TASK_AGENT_MAX_WORKERS: String(this.config.maxWorkers ?? 3), TASK_AGENT_WORKSPACE: workspace,
              ...(this.config.kubernetes ? { TASK_INSTANCE_BACKEND: "kubernetes", TASK_INSTANCE_NAMESPACE: this.config.kubernetes.namespace,
                ...(this.config.kubernetes.image ? { TASK_INSTANCE_IMAGE: this.config.kubernetes.image } : {}),
                ...(this.config.kubernetes.archiveClaim ? { TASK_INSTANCE_ARCHIVE_CLAIM: this.config.kubernetes.archiveClaim } : {}),
                ...(this.config.kubernetes.envSecret ? { TASK_INSTANCE_ENV_SECRET: this.config.kubernetes.envSecret } : {}),
                ...(this.config.kubernetes.context ? { TASK_INSTANCE_CONTEXT: this.config.kubernetes.context } : {}) } : {}),
            },
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
      parts: [{ type: "text", text: binding.control === "continue-execution" ? "Continue the existing request. Your previous response ended while graph execution was unfinished. Inspect the bound task instances, report scheduling or startup blockers, wait for actual worker results, and publish verified evidence before completing the graph tasks. Preserve the original objective and existing executions; do not create duplicate work. Original request:\n" + text : text }],
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
    const answers = requestMessages(messages.data ?? [], binding.messageID, binding.endMessageID)
    // Runtime liveness/questions belong to the current transport turn, never an older one.
    const current = !binding.endMessageID
    const pendingQuestions = current ? (questions.data ?? []).filter((q) => ids.has(q.sessionID)) : []
    const pendingPermissions = current ? (permissions.data ?? []).filter((p) => ids.has(p.sessionID)) : []
    const active = current && [...ids].some((id) => status.data?.[id] && status.data[id]!.type !== "idle")
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
    const workers = await Promise.all([...ids].filter((id) => current && id !== binding.sessionID && status.data?.[id]?.type !== undefined && status.data[id]!.type !== "idle").map(async (id) => {
      const workerMessages = (await client.session.messages({ directory, sessionID: id })).data
      const parts = Array.isArray(workerMessages) ? workerMessages.flatMap((m) => m.parts) : []
      return executionProgress(parts)
    }))
    return {
      state,
      executionTaskIds: [...new Set(answers.flatMap(m => m.parts.flatMap(p =>
        p.type === "tool" && ["task_graph_task_instance_create", "task_graph_task_instance_resume", "task_graph_task_start"].includes(p.tool)
          && p.state.status === "completed" && typeof p.state.input?.taskId === "string" ? [p.state.input.taskId] : [])))],
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
    const result = await this.stopWorker(binding.workspace, binding.sessionID)
    if (!result.stopped) throw new Error(result.evidence)
  }
  async stopWorkspace(workspace: string) {
    const client = await this.connection.client()
    const list = await client.session.list({ directory: workspace, limit: 10000 })
    if (!list.data || list.error || list.data.length >= 10000)
      return { stopped: false, evidence: "프로젝트 세션 전체 목록을 확인할 수 없습니다." }
    const sessions = list.data.filter(s => s.directory === workspace)
    for (const session of sessions) {
      const result = await this.stopWorker(workspace, session.id)
      if (!result.stopped) return result
    }
    const after = await client.session.list({ directory: workspace, limit: 10000 })
    if (!after.data || after.error || after.data.length >= 10000 || after.data.some(s => s.directory === workspace && !sessions.some(prior => prior.id === s.id)))
      return { stopped: false, evidence: "종료 중 새 세션이 발견됐습니다. 종료 확인을 재시도합니다." }
    return { stopped: true, evidence: `프로젝트의 모든 OpenCode 세션 종료 확인: ${sessions.map(s => s.id).join(", ")}` }
  }
  async stopWorker(workspace: string, sessionId: string) {
    const client = await this.connection.client()
    const session = await client.session.get({ directory: workspace, sessionID: sessionId })
    if (!session.data) return { stopped: false, evidence: "Native session cannot be located" }
    const ids = await this.sessions({ workspace, sessionID: sessionId, messageID: "" })
    for (const id of [...ids].reverse()) {
      const result = await client.session.abort({ directory: workspace, sessionID: id })
      if (result.data !== true) return { stopped: false, evidence: `Native abort was not acknowledged: ${id}` }
    }
    const response = await client.session.status({ directory: workspace })
    if (!response.data) return { stopped: false, evidence: "Native runtime status unavailable" }
    const states = response.data
    for (const id of ids) {
      if (states[id] && states[id]!.type !== "idle") return { stopped: false, evidence: "Native worker is still stopping" }
    }
    // Message/tool parts are historical records, not runtime liveness. After restart
    // they may remain unfinished. Require acknowledged aborts and authoritative idle
    // status for the entire descendant tree, independent of tool names or elapsed time.
    const after = await this.sessions({ workspace, sessionID: sessionId, messageID: "" })
    if ([...after].some(id => !ids.has(id))) return { stopped: false, evidence: "New native child detected during cancellation" }
    return { stopped: true, evidence: `OpenCode acknowledged abort and confirmed idle for all sessions: ${[...ids].join(", ")}` }
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
