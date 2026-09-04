import { createInterface } from "node:readline"
import type { TaskAgent } from "#task-agent-core"

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number | null
  method: string
  params?: Record<string, any>
}

export class TaskAgentMcpServer {
  private agent: TaskAgent
  private initialized = false
  private ready = false

  constructor(agent: TaskAgent) {
    this.agent = agent
  }

  async handle(message: JsonRpcRequest): Promise<Record<string, unknown> | undefined> {
    if (!message || typeof message !== "object" || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return failure(null, -32600, "Invalid JSON-RPC request")
    }
    if (message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number") return failure(null, -32600, "Invalid request ID")
    if (message.params !== undefined && (!message.params || typeof message.params !== "object" || Array.isArray(message.params))) return failure(message.id, -32602, "Invalid params")
    if (message.method === "notifications/initialized" && message.id === undefined && this.initialized) this.ready = true
    if (message.id === undefined) return undefined
    try {
      if (message.method !== "initialize" && message.method !== "ping" && !this.ready) throw new RpcError(-32002, "Server is not initialized")
      return response(message.id, await this.dispatch(message))
    } catch (error) {
      return failure(message.id, error instanceof RpcError ? error.code : -32603, error instanceof Error ? error.message : String(error))
    }
  }

  private async dispatch(message: JsonRpcRequest): Promise<Record<string, unknown>> {
    switch (message.method) {
      case "initialize":
        this.initialized = true
        return {
          protocolVersion: "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "task-agent", version: "0.1.0" },
        }
      case "ping":
        return {}
      case "tools/list":
        return { tools }
      case "tools/call":
        return this.callTool(message.params?.name, message.params?.arguments ?? {})
      default:
        throw new RpcError(-32601, `Method not found: ${message.method}`)
    }
  }

  private async callTool(name: unknown, input: Record<string, any>): Promise<Record<string, unknown>> {
    if (!tools.some((tool) => tool.name === name)) throw new RpcError(-32602, "Unknown tool")
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new RpcError(-32602, "Tool arguments must be an object")
    try {
      let data: unknown
      if (name === "task_context") {
        data = await this.agent.context({ taskId: input.taskId, query: input.query, mode: input.mode })
      } else if (name === "task_sync") {
        if (typeof input.conversation !== "string") throw new Error("conversation is required")
        data = await this.agent.sync(input as Parameters<TaskAgent["sync"]>[0])
      } else if (name === "task_handoff") {
        data = await this.agent.handoff(input)
      } else if (name === "task_run") {
        if (typeof input.instruction !== "string") throw new Error("instruction is required")
        data = await this.agent.run(input as Parameters<TaskAgent["run"]>[0])
      } else {
        throw new RpcError(-32602, `Unknown tool: ${String(name)}`)
      }
      return {
        content: [{ type: "text", text: typeof data === "object" && data && "text" in data ? String((data as any).text) : JSON.stringify(data) }],
        structuredContent: data as Record<string, unknown>,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      }
    }
  }
}

export async function serveStdio(server: TaskAgentMcpServer): Promise<void> {
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    let output: Record<string, unknown>
    try {
      const message = JSON.parse(line) as JsonRpcRequest
      const handled = await server.handle(message)
      if (!handled) continue
      output = handled
    } catch (error) {
      output = failure(null, -32700, error instanceof Error ? error.message : "Parse error")
    }
    process.stdout.write(`${JSON.stringify(output)}\n`)
  }
}

class RpcError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

function response(id: JsonRpcRequest["id"], result: unknown): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function failure(id: JsonRpcRequest["id"], fallbackCode: number, message: string): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, error: { code: fallbackCode, message } }
}

const tools = [
  {
    name: "task_context",
    title: "Compile task context",
    description: "Find a persistent task and compile the minimum context needed to continue work.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        query: { type: "string" },
        mode: { type: "string", enum: ["continuation", "implementation", "review", "handoff", "planning", "summary"] },
      },
    },
  },
  {
    name: "task_sync",
    title: "Sync task state",
    description: "Extract durable task state from a conversation and append it to the selected task.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        task: { type: "string" },
        conversation: { type: "string" },
        instruction: { type: "string" },
        idempotencyKey: { type: "string", minLength: 1 },
        source: { type: "object" },
      },
      required: ["conversation"],
    },
  },
  {
    name: "task_handoff",
    title: "Compile task handoff",
    description: "Compile execution-focused context so another agent can immediately continue a task.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        query: { type: "string" },
        targetAgent: { type: "string" },
      },
    },
  },
  {
    name: "task_run",
    title: "Run task management analysis",
    description: "Ask the independent Task Agent to analyze or manage one or more persistent tasks.",
    inputSchema: {
      type: "object",
      properties: {
        instruction: { type: "string" },
        taskIds: { type: "array", items: { type: "string" } },
        query: { type: "string" },
      },
      required: ["instruction"],
    },
  },
]
