import { Ajv } from "ajv"
import { createHash } from "node:crypto"
import { buildTaskContext, formatTaskContext } from "#task-context"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../../protocol-mcp/src/index.ts"
import { createGraphRuntime } from "../../../apps/task-agent/src/graph-runtime.ts"

export const GRAPH_INSTRUCTIONS = `You are using a deterministic task graph, not an execution harness.
OpenCode owns all planning, task extraction, decomposition, task selection, implementation, verification, integration, retries and reflection.
Use task_search to resume existing work. Claim runnable leaves with task_start before modifying files.
Use graph tools for durable state; OpenCode todos are only a display aid, never the source of truth.
Use a unique operationId for each mutation, reusing that ID and identical arguments when retrying delivery.
Completion requires actual test evidence and satisfied acceptance criterion IDs from task_load.
Integration tools record proposals and results; they never execute tests. Execute tests with OpenCode tools.
Never call a second orchestrator or spawn Claude/Codex to perform the work.`

export function createGraphMcp(database: string) {
  const runtime = createGraphRuntime(database)
  const { engine: e, integration: i, store } = runtime
  const schemas = tools
    .filter((t) => t.name !== "orchestrate_run")
    .map((t) => ({
      ...t,
      inputSchema: READ_ONLY_TOOLS.includes(t.name)
        ? t.inputSchema
        : {
            ...t.inputSchema,
            properties: { ...t.inputSchema.properties, operationId: { type: "string", minLength: 1 } },
            required: [...(t.inputSchema.required ?? []), "operationId"],
          },
    }))
  const ajv = new Ajv({ strict: false, allErrors: true })
  const validators = new Map(schemas.map((t) => [t.name, ajv.compile(t.inputSchema)]))
  store.db.exec(
    "CREATE TABLE IF NOT EXISTS graph_receipts(id TEXT PRIMARY KEY, signature TEXT NOT NULL, result TEXT NOT NULL)",
  )
  function apply(name: string, a: any): unknown {
    switch (name) {
      case "task_create":
        return e.createTask(a)
      case "task_search":
        return e.searchTasks(a.query, a.limit)
      case "task_load":
        return e.loadTask(a.taskId)
      case "task_get_runnable":
        return e.resolveRunnable(a.rootId)
      case "task_propose_decomposition":
        return e.proposeDecomposition(a)
      case "task_start":
        return e.startTask(a.taskId, { agent: a.agent ?? "opencode", sessionId: a.sessionId, role: a.role })
      case "task_complete":
        return e.completeTask(a)
      case "task_fail":
        return e.failTask(a.taskId, a.reason)
      case "task_reopen":
        return e.reopenTask(a.taskId, a.reason)
      case "task_get_context": {
        const context = buildTaskContext(e, a.taskId)
        return { context, text: formatTaskContext(context) }
      }
      case "artifact_publish":
        return e.publishArtifact(a)
      case "contract_define":
        return e.defineContract(a)
      case "requirement_add":
        return e.addRequirement(a.taskId, a.description, a.kind)
      case "impact_analyze":
        return e.calculateImpact(a.artifactId, a.compatibility)
      case "learning_record": {
        const learning = e.recordLearning(a)
        return { learning, similar: e.similarLearnings(learning) }
      }
      case "learning_supersede":
        return e.supersedeLearning(a)
      case "learning_search":
        return a.taskId ? e.relevantLearnings(a.taskId, a.limit) : e.searchLearnings(a.query ?? "", a.limit)
      case "integration_propose":
        return i.proposeIntegration(a)
      case "integration_run":
        return i.startRun(a.setRef)
      case "integration_report":
        return i.reportRun(a.runId, { scenarios: a.scenarios, failure: a.failure })
      case "role_define":
        return e.defineRole(a)
      case "role_list":
        return e.listRoles()
      default:
        throw new Error("Unknown graph tool")
    }
  }
  const server = new TaskAgentMcpServer(runtime.agent, {
    tools: schemas,
    instructions: GRAPH_INSTRUCTIONS,
    dispatch(name, args) {
      const validate = validators.get(name)
      if (!validate || !validate(args)) throw new Error(ajv.errorsText(validate?.errors))
      if (READ_ONLY_TOOLS.includes(name)) return apply(name, args)
      const { operationId, ...input } = args
      if (typeof operationId !== "string") throw new Error("operationId is required")
      const canonical = (value: any): any =>
        Array.isArray(value)
          ? value.map(canonical)
          : value && typeof value === "object"
            ? Object.fromEntries(
                Object.keys(value)
                  .sort()
                  .map((k) => [k, canonical(value[k])]),
              )
            : value
      const signature = createHash("sha256")
        .update(JSON.stringify([name, canonical(input)]))
        .digest("hex")
      return store.transaction(() => {
        const previous = store.db.prepare("SELECT * FROM graph_receipts WHERE id=?").get(operationId)
        if (previous) {
          if (previous.signature !== signature) throw new Error("operationId reused with different arguments")
          return JSON.parse(String(previous.result))
        }
        const result = apply(name, input)
        store.db.prepare("INSERT INTO graph_receipts VALUES(?,?,?)").run(operationId, signature, JSON.stringify(result))
        return JSON.parse(JSON.stringify(result))
      })
    },
  })
  return { server, ...runtime }
}
