import { createInterface } from "node:readline"
import { dispatchOperation, type TaskAgent } from "#task-agent-core"

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number | null
  method: string
  params?: Record<string, any>
}

export const AGENT_INSTRUCTIONS = `Task Agent is an orchestrator over a persistent recursive task graph.
A prompt becomes a root task (task_create); tasks decompose progressively via proposals (task_propose_decomposition) that the graph engine validates and applies.
Sessions are workers: resume work by searching (task_search), loading (task_load), asking for runnable leaf tasks (task_get_runnable) and compiling graph-based context (task_get_context).
Execute one atomic task at a time: task_start, do the work, then task_complete with a summary, published artifacts and local verification. The engine, not the agent, decides state transitions.
Task results are versioned artifacts (artifact_publish) with lineage and contracts (contract_define). Upstream changes mark downstream artifacts, bundles and integrations stale; impact_analyze reports the blast radius.
Combinations of artifacts are verified separately: integration_propose defines integration sets and scenarios along architecture boundaries, integration_run pins exact artifact versions, and integration_report records scenario results. Passing runs promote Verified Bundles that parents consume instead of raw artifacts; failures classify causes and can spawn diagnostic tasks.
The system self-improves: record what you learn while completing tasks (task_complete learnings, learning_record) — insights, pitfalls, conventions, failure patterns, each with an importance score. The engine feeds relevant learnings back into every task context (ranked by relevance, recency, importance and graph proximity), so the second run on a topic is better than the first.
Keep the memory coherent: learning_record returns semantically similar existing learnings — when the new lesson contradicts or replaces one, mark the old one with learning_supersede (history is kept, retrieval excludes it). When failure patterns accumulate, the engine creates a reflection task to synthesize them into higher-level learnings.`

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
          serverInfo: { name: "task-agent", version: "1.0.0" },
          instructions: AGENT_INSTRUCTIONS,
        }
      case "ping":
        return {}
      case "tools/list":
        return { tools }
      case "tools/call":
        return this.callTool(message.params?.name, message.params?.arguments ?? {})
    }
    throw new RpcError(-32601, `Method not found: ${message.method}`)
  }

  private async callTool(name: unknown, input: Record<string, any>): Promise<Record<string, unknown>> {
    if (typeof name !== "string" || !tools.some((tool) => tool.name === name)) throw new RpcError(-32602, "Unknown tool")
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new RpcError(-32602, "Tool arguments must be an object")
    try {
      const data = await dispatchOperation(this.agent, name, input)
      return {
        content: [{ type: "text", text: typeof data === "object" && data && "text" in (data as object) ? String((data as any).text) : JSON.stringify(data) }],
        structuredContent: wrapResult(data),
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      }
    }
  }
}

function wrapResult(data: unknown): Record<string, unknown> {
  return Array.isArray(data) ? { items: data } : data as Record<string, unknown>
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

export const READ_ONLY_TOOLS = ["task_search", "task_load", "task_get_runnable", "task_get_context", "impact_analyze", "learning_search"]

const artifactVersionRef = {
  type: "object",
  properties: { artifactId: { type: "string" }, version: { type: "number" } },
  required: ["artifactId", "version"],
}

const publishableArtifact = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: { type: "string", enum: ["research", "architecture", "code", "test", "decision", "note"] },
    contentRef: { type: "string" },
    content: { type: "string" },
    inputs: { type: "array", items: artifactVersionRef },
    contractVersionRefs: { type: "array", items: { type: "object", properties: { contractId: { type: "string" }, version: { type: "number" } }, required: ["contractId", "version"] } },
    compatibility: { type: "string", enum: ["compatible", "breaking"] },
  },
  required: ["name", "type"],
}

const taskFields = {
  title: { type: "string" },
  goal: { type: "string" },
  category: { type: "string", enum: ["requirement", "research", "architecture", "implementation", "qa", "integration", "diagnostic", "general"] },
  dependencies: { type: "array", items: { type: "string" }, description: "Task IDs (or sibling keys inside a decomposition) that must be verified first" },
  acceptanceCriteria: { type: "array", items: { type: "string" } },
  requirements: { type: "array", items: { type: "object", properties: { description: { type: "string" }, kind: { type: "string", enum: ["requirement", "constraint"] } }, required: ["description"] } },
  integrationPolicy: { type: "string", enum: ["none", "contract", "targeted", "full"] },
  assignedRole: { type: "string" },
}

export const tools = [
  {
    name: "task_create",
    title: "Create a task",
    description: "Turn a request into a persistent task (root task, or child of parentId). The task graph, not the conversation, is the durable state.",
    inputSchema: { type: "object", properties: { ...taskFields, parentId: { type: "string" } }, required: ["title", "goal"] },
  },
  {
    name: "task_search",
    title: "Search tasks",
    description: "Find persistent tasks by title or goal to continue earlier work.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] },
  },
  {
    name: "task_load",
    title: "Load a task",
    description: "Load a task with children, dependencies, requirements, output artifacts, completion evaluation and roll-up summary.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] },
  },
  {
    name: "task_get_runnable",
    title: "Resolve runnable tasks",
    description: "List atomic leaf tasks whose dependencies are satisfied, in dependency order. Optionally scoped to a root task's subtree.",
    inputSchema: { type: "object", properties: { rootId: { type: "string" } } },
  },
  {
    name: "task_propose_decomposition",
    title: "Propose a decomposition",
    description: "Propose child tasks for a task. The engine validates cycles, duplicate responsibilities and dependencies before applying. Decompose progressively, only to the level current knowledge supports.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        children: { type: "array", items: { type: "object", properties: { ...taskFields, key: { type: "string" } }, required: ["title", "goal"] } },
      },
      required: ["taskId", "children"],
    },
  },
  {
    name: "task_start",
    title: "Start a task",
    description: "Claim a ready atomic task for execution in this session.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" }, agent: { type: "string" }, sessionId: { type: "string" }, role: { type: "string" } }, required: ["taskId"] },
  },
  {
    name: "task_complete",
    title: "Submit task results",
    description: "Submit a result for a running task: summary, produced artifacts and local verification. The engine decides the state transition (implemented, then verified when verification passed and acceptance criteria are satisfied).",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        summary: { type: "string" },
        artifacts: { type: "array", items: publishableArtifact },
        verification: {
          type: "object",
          properties: { passed: { type: "boolean" }, evidence: { type: "string" }, criteriaSatisfied: { type: "array", items: { type: "string" } } },
          required: ["passed"],
        },
        learnings: {
          type: "array",
          description: "Durable lessons from this task (insights, pitfalls, conventions) fed back into future task contexts",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              kind: { type: "string", enum: ["insight", "pitfall", "convention", "failure_pattern", "improvement"] },
              tags: { type: "array", items: { type: "string" } },
            },
            required: ["description"],
          },
        },
      },
      required: ["taskId", "summary"],
    },
  },
  {
    name: "task_fail",
    title: "Fail a task",
    description: "Record that a task cannot be completed. Dependent tasks become blocked.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" }, reason: { type: "string" } }, required: ["taskId", "reason"] },
  },
  {
    name: "task_reopen",
    title: "Reopen a task",
    description: "Reopen a verified, integrated, failed, blocked or stale task for rework.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" }, reason: { type: "string" } }, required: ["taskId", "reason"] },
  },
  {
    name: "task_get_context",
    title: "Compile task context",
    description: "Build the minimum execution context for a task from the graph: goals, inherited requirements and constraints, decisions, input artifacts (verified bundles preferred), contracts, known failures and acceptance criteria.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] },
  },
  {
    name: "artifact_publish",
    title: "Publish an artifact version",
    description: "Publish a versioned artifact produced by a running task, with lineage inputs and contract references. Republishing a name creates a new version and propagates staleness downstream; declare compatibility=breaking when consumers must rework.",
    inputSchema: { type: "object", properties: { ...publishableArtifact.properties, taskId: { type: "string" } }, required: ["taskId", "name", "type"] },
  },
  {
    name: "contract_define",
    title: "Define or version a contract",
    description: "Declare what a provider task guarantees to a consumer task: provided items, expectations, invariants and compatibility checks.",
    inputSchema: {
      type: "object",
      properties: {
        contractId: { type: "string" },
        providerTaskId: { type: "string" },
        consumerTaskId: { type: "string" },
        provides: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name"] } },
        expects: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name"] } },
        invariants: { type: "array", items: { type: "string" } },
        compatibilityChecks: { type: "array", items: { type: "string" } },
      },
      required: ["providerTaskId", "consumerTaskId", "provides"],
    },
  },
  {
    name: "requirement_add",
    title: "Add a requirement or constraint",
    description: "Attach a requirement (must be satisfied by verified integration scenarios) or a constraint (inherited by descendant task contexts) to a task.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" }, description: { type: "string" }, kind: { type: "string", enum: ["requirement", "constraint"] } }, required: ["taskId", "description"] },
  },
  {
    name: "impact_analyze",
    title: "Analyze change impact",
    description: "Compute the downstream blast radius of an artifact's latest version via lineage: stale artifact versions, bundles, integration sets and affected tasks.",
    inputSchema: { type: "object", properties: { artifactId: { type: "string" }, compatibility: { type: "string", enum: ["compatible", "breaking"] } }, required: ["artifactId"] },
  },
  {
    name: "learning_record",
    title: "Record a learning",
    description: "Save a durable lesson to memory (insight, pitfall, convention, failure pattern or improvement idea) with an importance score (1-10). Relevant learnings are automatically fed into future task contexts. The result includes semantically similar existing learnings — review them and call learning_supersede when the new learning contradicts or replaces one.",
    inputSchema: {
      type: "object",
      properties: {
        sourceTaskId: { type: "string" },
        sourceRunId: { type: "string" },
        kind: { type: "string", enum: ["insight", "pitfall", "convention", "failure_pattern", "improvement"] },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        importance: { type: "number", description: "Integer 1-10; how consequential this lesson is (default 5)" },
      },
      required: ["description"],
    },
  },
  {
    name: "learning_supersede",
    title: "Supersede or retract a learning",
    description: "Mark an outdated or wrong learning as superseded (pass `by` with the replacing learning's id) or retracted (no `by`). The record is kept for history but excluded from search and task contexts.",
    inputSchema: {
      type: "object",
      properties: {
        learningId: { type: "string" },
        by: { type: "string", description: "ID of the learning that replaces this one; omit to retract without replacement" },
        reason: { type: "string" },
        invalidFrom: { type: "string", description: "Optional ISO timestamp when the fact stopped being true (bi-temporal event timeline)" },
      },
      required: ["learningId", "reason"],
    },
  },
  {
    name: "learning_search",
    title: "Search learnings",
    description: "Search recorded learnings by keywords, or pass taskId to get the learnings the engine considers relevant to that task.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, taskId: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "integration_propose",
    title: "Propose integration sets",
    description: "Propose integration sets along architecture boundaries: named artifact combinations with usage scenarios. Members are artifact names or other set names (their future bundles). The engine validates cycles, coverage and version references.",
    inputSchema: {
      type: "object",
      properties: {
        integrationSets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              parentTaskId: { type: "string" },
              policy: { type: "string", enum: ["none", "contract", "targeted", "full"] },
              members: { type: "array", items: { type: "string" } },
              scenarios: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    expectedBehavior: { type: "array", items: { type: "string" } },
                    participants: { type: "array", items: { type: "string" } },
                    requirementIds: { type: "array", items: { type: "string" } },
                    fixtureRefs: { type: "array", items: artifactVersionRef },
                  },
                  required: ["name", "expectedBehavior"],
                },
              },
            },
            required: ["name", "members", "scenarios"],
          },
        },
      },
      required: ["integrationSets"],
    },
  },
  {
    name: "integration_run",
    title: "Start an integration run",
    description: "Pin the exact artifact versions of an integration set and start a run. Returns the scenarios to execute, or the cached passing run when this exact combination was already verified.",
    inputSchema: { type: "object", properties: { setRef: { type: "string", description: "Integration set ID or name" } }, required: ["setRef"] },
  },
  {
    name: "integration_report",
    title: "Report integration results",
    description: "Report scenario results for a running integration. All scenarios passing promotes a Verified Bundle; failures are classified, revert members to verified, and unknown causes spawn a diagnostic task.",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string" },
        scenarios: {
          type: "array",
          items: {
            type: "object",
            properties: { scenarioId: { type: "string" }, status: { type: "string", enum: ["passed", "failed"] }, observed: { type: "string" } },
            required: ["scenarioId", "status"],
          },
        },
        failure: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["producer_violation", "consumer_violation", "contract_mismatch", "architecture_issue", "interaction_issue", "unknown"] },
            affectedTaskIds: { type: "array", items: { type: "string" } },
            evidenceRefs: { type: "array", items: artifactVersionRef },
            recommendedActions: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["runId", "scenarios"],
    },
  },
]
