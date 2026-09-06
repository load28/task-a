import { createInterface } from "node:readline"
import { dispatchOperation, type TaskAgent } from "#task-agent-core"

export interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number | null
  method: string
  params?: Record<string, any>
}

export const AGENT_INSTRUCTIONS = `Task Graph is a deterministic state and context service for the OpenCode server harness.
OpenCode owns request interpretation, decomposition, task selection, implementation, verification, integration planning, retries and reflection.
Use task_search/task_load to resume, task_propose_decomposition for validated changes, and task_start before execution.
Publish actual artifacts and verification evidence with task_complete. The engine validates state transitions and acceptance criteria.
Integration tools pin versions and record results; OpenCode must execute the tests. Learning tools store and retrieve durable lessons.
This MCP never runs a model, shell command or orchestration loop. Roles are durable metadata for OpenCode workers.`

export class TaskAgentMcpServer {
  private agent: TaskAgent
  private initialized = false
  private ready = false

  private options: {
    tools?: Array<{ name: string; description?: string; inputSchema: object }>
    instructions?: string
    jsonText?: boolean
    dispatch?: (name: string, input: Record<string, any>) => unknown | Promise<unknown>
  }
  constructor(agent: TaskAgent, options: TaskAgentMcpServer["options"] = {}) {
    this.options = options
    this.agent = agent
  }

  async handle(message: JsonRpcRequest): Promise<Record<string, unknown> | undefined> {
    if (
      !message ||
      typeof message !== "object" ||
      Array.isArray(message) ||
      message.jsonrpc !== "2.0" ||
      typeof message.method !== "string"
    ) {
      return failure(null, -32600, "Invalid JSON-RPC request")
    }
    if (message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number")
      return failure(null, -32600, "Invalid request ID")
    if (
      message.params !== undefined &&
      (!message.params || typeof message.params !== "object" || Array.isArray(message.params))
    )
      return failure(message.id, -32602, "Invalid params")
    if (message.method === "notifications/initialized" && message.id === undefined && this.initialized)
      this.ready = true
    if (message.id === undefined) return undefined
    try {
      if (message.method !== "initialize" && message.method !== "ping" && !this.ready)
        throw new RpcError(-32002, "Server is not initialized")
      return response(message.id, await this.dispatch(message))
    } catch (error) {
      return failure(
        message.id,
        error instanceof RpcError ? error.code : -32603,
        error instanceof Error ? error.message : String(error),
      )
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
          instructions: this.options.instructions ?? AGENT_INSTRUCTIONS,
        }
      case "ping":
        return {}
      case "tools/list":
        return { tools: this.options.tools ?? tools }
      case "tools/call":
        return this.callTool(message.params?.name, message.params?.arguments ?? {})
    }
    throw new RpcError(-32601, `Method not found: ${message.method}`)
  }

  private async callTool(name: unknown, input: Record<string, any>): Promise<Record<string, unknown>> {
    if (typeof name !== "string" || !(this.options.tools ?? tools).some((tool) => tool.name === name))
      throw new RpcError(-32602, "Unknown tool")
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new RpcError(-32602, "Tool arguments must be an object")
    try {
      const data = await (this.options.dispatch
        ? this.options.dispatch(name, input)
        : dispatchOperation(this.agent, name, input))
      return {
        content: [
          {
            type: "text",
            text:
              !this.options.jsonText && typeof data === "object" && data && "text" in (data as object)
                ? String((data as any).text)
                : JSON.stringify(data),
          },
        ],
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
  return Array.isArray(data) ? { items: data } : (data as Record<string, unknown>)
}

export async function serveStdio(server: {
  handle(message: JsonRpcRequest): Promise<Record<string, unknown> | undefined>
}): Promise<void> {
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

export const READ_ONLY_TOOLS = [
  "task_search",
  "task_load",
  "task_get_runnable",
  "task_get_context",
  "impact_analyze",
  "learning_search",
  "role_list",
  "work_plan_load",
  "work_plan_impact",
  "work_plan_present",
]

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
    contractVersionRefs: {
      type: "array",
      items: {
        type: "object",
        properties: { contractId: { type: "string" }, version: { type: "number" } },
        required: ["contractId", "version"],
      },
    },
    compatibility: { type: "string", enum: ["compatible", "breaking"] },
  },
  required: ["name", "type"],
}

const taskFields = {
  writeScopes: { type: "array", items: { type: "string" }, description: "Literal project-relative files/directories this task may modify. Omitted means exclusive project scope (.). Empty means read-only. Include generated outputs; . for installs and full builds." },
  title: { type: "string" },
  goal: { type: "string" },
  category: {
    type: "string",
    enum: ["requirement", "research", "architecture", "implementation", "qa", "integration", "diagnostic", "general"],
  },
  dependencies: {
    type: "array",
    items: { type: "string" },
    description: "Task IDs (or sibling keys inside a decomposition) that must be verified first",
  },
  acceptanceCriteria: { type: "array", items: { type: "string" } },
  requirements: {
    type: "array",
    items: {
      type: "object",
      properties: { description: { type: "string" }, kind: { type: "string", enum: ["requirement", "constraint"] } },
      required: ["description"],
    },
  },
  integrationPolicy: { type: "string", enum: ["none", "contract", "targeted", "full"] },
  assignedRole: { type: "string" },
}

const planNode = {
  type: "object",
  properties: {
    nodeId: { type: "string" }, parentNodeId: { type: "string" }, label: { type: "string" },
    stage: { type: "string", enum: ["research", "design", "implementation", "validation"] }, outcome: { type: "string" },
    dependsOnNodeIds: { type: "array", items: { type: "string" } },
    researchTrack: { type: "string", enum: ["repository", "external_examples", "official_documentation"] },
    taskSpec: { type: "object", properties: taskFields, required: ["goal"] },
  },
  required: ["nodeId", "label", "stage", "outcome", "taskSpec"],
}

export const tools = [
  {
    name: "work_plan_create_draft", title: "Create an approval-gated work plan",
    description: "Persist a proposed user-facing plan without creating or starting Tasks. Approval is required before materialization.",
    inputSchema: { type: "object", properties: { title: { type: "string" }, goal: { type: "string" }, requestText: { type: "string" }, summary: { type: "string" }, nodes: { type: "array", items: planNode } }, required: ["title", "goal", "requestText", "summary", "nodes"] },
  },
  {
    name: "work_plan_load", title: "Load a work plan", description: "Load a persisted plan, revision, links, and sanitized user view.",
    inputSchema: { type: "object", properties: { planId: { type: "string" }, rootTaskId: { type: "string" } } },
  },
  {
    name: "work_plan_approve", title: "Approve a work plan", description: "Approve an awaiting plan revision and materialize its Tasks exactly once.",
    inputSchema: { type: "object", properties: { planId: { type: "string" }, version: { type: "number" }, approvalSource: { type: "string" } }, required: ["planId", "version", "approvalSource"] },
  },
  {
    name: "work_plan_revise", title: "Revise a work plan", description: "Create an immutable next revision; it does not change Tasks until approved.",
    inputSchema: { type: "object", properties: { planId: { type: "string" }, baseVersion: { type: "number" }, nodes: { type: "array", items: planNode }, summary: { type: "string" }, changeSummary: { type: "string" } }, required: ["planId", "baseVersion", "nodes", "summary"] },
  },
  {
    name: "work_plan_impact", title: "Analyze work plan impact", description: "Explain added, changed, removed, reused, and reopened planned work.",
    inputSchema: { type: "object", properties: { planId: { type: "string" }, fromVersion: { type: "number" }, toVersion: { type: "number" } }, required: ["planId"] },
  },
  {
    name: "work_plan_present", title: "Present a work plan", description: "Return a nontechnical, sanitized work-plan graph for a user.",
    inputSchema: { type: "object", properties: { planId: { type: "string" } }, required: ["planId"] },
  },
  {
    name: "task_create",
    title: "Create a task",
    description:
      "Turn a request into a persistent task (root task, or child of parentId). The task graph, not the conversation, is the durable state.",
    inputSchema: {
      type: "object",
      properties: { ...taskFields, parentId: { type: "string" } },
      required: ["title", "goal"],
    },
  },
  {
    name: "task_search",
    title: "Search tasks",
    description: "Find persistent tasks by title or goal to continue earlier work.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
      required: ["query"],
    },
  },
  {
    name: "task_load",
    title: "Load a task",
    description:
      "Load a task with children, dependencies, requirements, output artifacts, completion evaluation and roll-up summary.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] },
  },
  {
    name: "task_get_runnable",
    title: "Resolve runnable tasks",
    description:
      "List atomic leaf tasks whose dependencies are satisfied, in dependency order. Optionally scoped to a root task's subtree.",
    inputSchema: { type: "object", properties: { rootId: { type: "string" } } },
  },
  {
    name: "task_propose_decomposition",
    title: "Propose a decomposition",
    description:
      "Propose child tasks for a task. The engine validates cycles, duplicate responsibilities and dependencies before applying. Decompose progressively, only to the level current knowledge supports.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        children: {
          type: "array",
          items: {
            type: "object",
            properties: { ...taskFields, key: { type: "string" } },
            required: ["title", "goal"],
          },
        },
      },
      required: ["taskId", "children"],
    },
  },
  {
    name: "task_start",
    title: "Start a task",
    description: "Claim a ready atomic task for execution in this session.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        agent: { type: "string" },
        sessionId: { type: "string" },
        role: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "task_complete",
    title: "Submit task results",
    description:
      "Submit a result for a running task: summary, produced artifacts and local verification. The engine decides the state transition (implemented, then verified when verification passed and acceptance criteria are satisfied).",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        summary: { type: "string" },
        artifacts: { type: "array", items: publishableArtifact },
        verification: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            evidence: { type: "string" },
            criteriaSatisfied: { type: "array", items: { type: "string" } },
          },
          required: ["passed"],
        },
        learnings: {
          type: "array",
          description:
            "Durable lessons from this task (insights, pitfalls, conventions) fed back into future task contexts",
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
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" }, reason: { type: "string" } },
      required: ["taskId", "reason"],
    },
  },
  {
    name: "task_reopen",
    title: "Reopen a task",
    description: "Reopen a verified, integrated, failed, blocked or stale task for rework.",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" }, reason: { type: "string" } },
      required: ["taskId", "reason"],
    },
  },
  {
    name: "task_get_context",
    title: "Compile task context",
    description:
      "Build the minimum execution context for a task from the graph: goals, inherited requirements and constraints, decisions, input artifacts (verified bundles preferred), contracts, known failures and acceptance criteria.",
    inputSchema: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] },
  },
  {
    name: "artifact_publish",
    title: "Publish an artifact version",
    description:
      "Publish a versioned artifact produced by a running task, with lineage inputs and contract references. Republishing a name creates a new version and propagates staleness downstream; declare compatibility=breaking when consumers must rework.",
    inputSchema: {
      type: "object",
      properties: { ...publishableArtifact.properties, taskId: { type: "string" } },
      required: ["taskId", "name", "type"],
    },
  },
  {
    name: "contract_define",
    title: "Define or version a contract",
    description:
      "Declare what a provider task guarantees to a consumer task: provided items, expectations, invariants and compatibility checks.",
    inputSchema: {
      type: "object",
      properties: {
        contractId: { type: "string" },
        providerTaskId: { type: "string" },
        consumerTaskId: { type: "string" },
        provides: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, description: { type: "string" } },
            required: ["name"],
          },
        },
        expects: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, description: { type: "string" } },
            required: ["name"],
          },
        },
        invariants: { type: "array", items: { type: "string" } },
        compatibilityChecks: { type: "array", items: { type: "string" } },
      },
      required: ["providerTaskId", "consumerTaskId", "provides"],
    },
  },
  {
    name: "requirement_add",
    title: "Add a requirement or constraint",
    description:
      "Attach a requirement (must be satisfied by verified integration scenarios) or a constraint (inherited by descendant task contexts) to a task.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        description: { type: "string" },
        kind: { type: "string", enum: ["requirement", "constraint"] },
      },
      required: ["taskId", "description"],
    },
  },
  {
    name: "impact_analyze",
    title: "Analyze change impact",
    description:
      "Compute the downstream blast radius of an artifact's latest version via lineage: stale artifact versions, bundles, integration sets and affected tasks.",
    inputSchema: {
      type: "object",
      properties: {
        artifactId: { type: "string" },
        compatibility: { type: "string", enum: ["compatible", "breaking"] },
      },
      required: ["artifactId"],
    },
  },
  {
    name: "learning_record",
    title: "Record a learning",
    description:
      "Save a durable lesson to memory (insight, pitfall, convention, failure pattern or improvement idea) with an importance score (1-10). Relevant learnings are automatically fed into future task contexts. The result includes semantically similar existing learnings — review them and call learning_supersede when the new learning contradicts or replaces one.",
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
    description:
      "Mark an outdated or wrong learning as superseded (pass `by` with the replacing learning's id) or retracted (no `by`). The record is kept for history but excluded from search and task contexts.",
    inputSchema: {
      type: "object",
      properties: {
        learningId: { type: "string" },
        by: {
          type: "string",
          description: "ID of the learning that replaces this one; omit to retract without replacement",
        },
        reason: { type: "string" },
        invalidFrom: {
          type: "string",
          description: "Optional ISO timestamp when the fact stopped being true (bi-temporal event timeline)",
        },
      },
      required: ["learningId", "reason"],
    },
  },
  {
    name: "learning_search",
    title: "Search learnings",
    description:
      "Search recorded learnings by keywords, or pass taskId to get the learnings the engine considers relevant to that task.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, taskId: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "integration_propose",
    title: "Propose integration sets",
    description:
      "Propose integration sets along architecture boundaries: named artifact combinations with usage scenarios. Members are artifact names or other set names (their future bundles). The engine validates cycles, coverage and version references.",
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
    description:
      "Pin the exact artifact versions of an integration set and start a run. Returns the scenarios to execute, or the cached passing run when this exact combination was already verified.",
    inputSchema: {
      type: "object",
      properties: { setRef: { type: "string", description: "Integration set ID or name" } },
      required: ["setRef"],
    },
  },
  {
    name: "integration_report",
    title: "Report integration results",
    description:
      "Report scenario results for a running integration. All scenarios passing promotes a Verified Bundle; failures are classified, revert members to verified, and unknown causes spawn a diagnostic task.",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string" },
        scenarios: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scenarioId: { type: "string" },
              status: { type: "string", enum: ["passed", "failed"] },
              observed: { type: "string" },
            },
            required: ["scenarioId", "status"],
          },
        },
        failure: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "producer_violation",
                "consumer_violation",
                "contract_mismatch",
                "architecture_issue",
                "interaction_issue",
                "unknown",
              ],
            },
            affectedTaskIds: { type: "array", items: { type: "string" } },
            evidenceRefs: { type: "array", items: artifactVersionRef },
            recommendedActions: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["runId", "scenarios"],
    },
  },
  {
    name: "role_define",
    title: "Define a worker role",
    description:
      "Create or update a role that workers execute tasks under: principles, capabilities, allowed tools and constraints. Tasks pick a role through assignedRole or their category.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        principles: { type: "array", items: { type: "string" } },
        capabilities: { type: "array", items: { type: "string" } },
        allowedTools: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
      },
      required: ["id", "name", "description"],
    },
  },
  {
    name: "role_list",
    title: "List worker roles",
    description: "List the roles available to workers, including the defaults seeded by the orchestrator.",
    inputSchema: { type: "object", properties: {} },
  },
]
