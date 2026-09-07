import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { Ajv } from "ajv"
import { createHash } from "node:crypto"
import { buildTaskContext, formatTaskContext } from "#task-context"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../../protocol-mcp/src/index.ts"
import { createGraphRuntime } from "../../../apps/task-agent/src/graph-runtime.ts"
import { configuredInstances, instanceTools, INSTANCE_INSTRUCTIONS } from "../../task-instances/src/graph-tools.ts"
import type { InstanceManager } from "../../task-instances/src/manager.ts"
import { instanceName } from "../../task-instances/src/manager.ts"
import { validateSpec } from "../../task-instances/src/types.ts"
import { advanceTransition } from "../../task-instances/src/transitions.ts"

export const GRAPH_INSTRUCTIONS = `You are using a deterministic task graph, not an execution harness.
OpenCode owns all planning, task extraction, decomposition, task selection, implementation, verification, integration, retries and reflection.
Use task_search to resume existing work. Claim runnable leaves with task_start before modifying files.
Declare writeScopes when creating/decomposing tasks: literal project-relative files/directories, [] for read-only, . for exclusive work (installs, shared config, full build). Missing scopes default to exclusive.
Use task_schedule to see active reservations and ready tasks. The task_start claim atomically enforces conflicts and worker capacity. Start independent native workers concurrently, but never modify a task's files before claiming it. Respect dependencies.
Expand reservations with task_expand_scope BEFORE writing more files. On conflict pause that work; do not bypass the reservation. Complete only after ALL writes and tests stop. Failed/interrupted tasks keep reservations: confirm their native workers have stopped before task_release_scope, then reopen as needed. Never release merely due to elapsed time.
Use graph tools for durable state; OpenCode todos are only a display aid, never the source of truth.
Use a unique operationId for each mutation, reusing that ID and identical arguments when retrying delivery.
Plan changes may be proposed regardless of task state. Approve the new revision, then observe work_plan_transition_status and work_plan_reconcile. Continue unaffected workers. Before claiming a replacement leaf, call task_reuse to adopt an exactly matching verified result without model execution. Do not reopen changed historical tasks: revision activation creates new specifications and exposes reusable prior work in task_get_context. Include the attemptToken from task_start/task_load in task_complete, task_fail and artifact_publish; stale reports cannot complete the current revision. Pass the actual native worker sessionId when claiming work so selective termination can be observed.
Completion requires actual test evidence and satisfied acceptance criterion IDs from task_load.
Each implementation worker must publish its output artifacts BEFORE or WITH task_complete. Integration members are artifact names or exact artifact references, never filenames or task IDs. Complete producer tasks with local verification first. A producer's acceptance criteria must NOT require the integration run that consumes its own artifacts; put cross-task integration requirements on the parent. A separate QA task may record observed tests, complete its own evidence artifact, then the manager records integration over verified producers. Query role_list instead of guessing role names.
Integration tools record proposals and results; they never execute tests. Execute tests with OpenCode tools.
Never call a second orchestrator or spawn Claude/Codex to perform the work.`

export function createGraphMcp(database: string, maxWorkers = 3, instances: InstanceManager | undefined = configuredInstances()) {
  const runtime = createGraphRuntime(database)
  const { engine: e, integration: i, store } = runtime
  const scheduler = new TaskScheduler(e, maxWorkers, process.env.TASK_AGENT_WORKSPACE)
  const readOnly = new Set([...READ_ONLY_TOOLS, "task_schedule"])
  readOnly.add("task_instance_status")
  const schedulingTools = [
    { name: "task_schedule", description: "Inspect active workers, write scopes and runnable tasks with conflict/capacity blockers. Claim tasks atomically with task_start; do not assume this snapshot is a reservation.", inputSchema: { type: "object", properties: { rootId: { type: "string" } } } },
    { name: "task_expand_scope", description: "Atomically reserve additional files/directories BEFORE writing outside the original scope. On conflict wait without modifying the files.", inputSchema: { type: "object", properties: { taskId: { type: "string" }, writeScopes: { type: "array", items: { type: "string" } } }, required: ["taskId", "writeScopes"] } },
    { name: "task_release_scope", description: "Release a failed/interrupted task reservation only AFTER the native worker is confirmed stopped. Never use timeout alone as proof. Complete or fail the task first.", inputSchema: { type: "object", properties: { taskId: { type: "string" }, workerStopped: { type: "boolean", const: true } }, required: ["taskId", "workerStopped"] } },
  ]
  const schemas = [...tools, ...schedulingTools, ...(instances ? instanceTools : [])]
    .filter((t) => t.name !== "orchestrate_run")
    .map((t) => ({
      ...t,
      inputSchema: readOnly.has(t.name)
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
  if (instances) store.db.exec("CREATE TABLE IF NOT EXISTS graph_task_instances(task_id TEXT PRIMARY KEY REFERENCES tasks(id), specification TEXT NOT NULL)")
  function apply(name: string, a: any): unknown {
    switch (name) {
      case "task_create":
        return e.createTask(a)
      case "work_plan_create_draft":
        return e.createDraftPlan(a)
      case "work_plan_load":
        return e.loadWorkPlan(a)
      case "work_plan_approve":
        return e.approveWorkPlan(a)
      case "work_plan_revise":
        return e.reviseWorkPlan(a)
      case "work_plan_impact":
        return e.analyzePlanImpact(a)
      case "work_plan_present":
        return e.presentWorkPlan(a)
      case "work_plan_transition_status":
        return e.revisions.transitions(a.planId)
      case "task_search":
        return e.searchTasks(a.query, a.limit)
      case "task_load":
        return e.loadTask(a.taskId)
      case "task_get_runnable":
        return e.resolveRunnable(a.rootId)
      case "task_propose_decomposition":
        return e.proposeDecomposition(a)
      case "task_schedule":
        return scheduler.status(a.rootId)
      case "task_expand_scope":
        return scheduler.expand(a.taskId, a.writeScopes)
      case "task_release_scope":
        return scheduler.release(a.taskId, a.workerStopped)
      case "task_start":
        return scheduler.claim(a.taskId, { agent: a.agent ?? "opencode", sessionId: a.sessionId, role: a.role })
      case "task_complete": {
        const task = e.completeTask(a)
        if (["verified", "integrated"].includes(task.status)) scheduler.release(a.taskId, true)
        return task
      }
      case "task_reuse":
        return e.reuseTask(a.taskId)
      case "task_fail":
        return e.failTask(a.taskId, a.reason, a.attemptToken)
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
  const instanceCalls = new Map<string, { signature: string; result: Promise<unknown> }>()
  const server = new TaskAgentMcpServer(runtime.agent, {
    tools: schemas,
    instructions: GRAPH_INSTRUCTIONS + (instances ? `\n${INSTANCE_INSTRUCTIONS}` : ""),
    dispatch(name, args) {
      const validate = validators.get(name)
      if (!validate || !validate(args)) throw new Error(ajv.errorsText(validate?.errors))
      if (name === "work_plan_reconcile") return advanceTransition(e, String(args.transitionId), instances)
      if (name.startsWith("task_instance_") && instances) {
        const input = args as Record<string, any>
        if (name === "task_instance_status") { e.loadTask(input.taskId); return instances.load(input.taskId) }
        const stable = (value: any): any => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
          ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
        const signature = createHash("sha256").update(JSON.stringify([name, stable(input)])).digest("hex")
        const previous = store.db.prepare("SELECT * FROM graph_receipts WHERE id=?").get(input.operationId)
        if (previous) {
          if (previous.signature !== signature) throw new Error("operationId reused with different arguments")
          return JSON.parse(String(previous.result))
        }
        const pending = instanceCalls.get(input.operationId)
        if (pending) {
          if (pending.signature !== signature) throw new Error("operationId reused with different arguments")
          return pending.result
        }
        const execute = async () => {
          const loaded = e.loadTask(input.taskId)
          switch (name) {
          case "task_instance_create":
            if (input.spec.taskId !== input.taskId) throw new Error("Instance taskId must match graph taskId")
            validateSpec(input.spec)
            store.transaction(() => {
              const bound = store.db.prepare("SELECT specification FROM graph_task_instances WHERE task_id=?").get(input.taskId)
              const specification = JSON.stringify(stable(input.spec))
              if (bound) {
                if (bound.specification !== specification) throw new Error("Task already bound to a different instance specification")
                return
              }
              if (loaded.children.length || loaded.task.status !== "ready") throw new Error("Only unclaimed runnable leaves can own a new instance")
              e.startTask(input.taskId, { agent: "kubernetes", sessionId: instanceName(input.taskId) })
              store.db.prepare("INSERT INTO graph_task_instances VALUES (?,?)").run(input.taskId, specification)
            })
            return instances.create(input.spec)
          case "task_instance_suspend": return instances.suspend(input.taskId)
          case "task_instance_resume": return instances.resume(input.taskId, input.run)
          case "task_instance_delete": return instances.remove(input.taskId)
          }
        }
        const result = execute().then(result => {
          store.db.prepare("INSERT INTO graph_receipts VALUES(?,?,?)").run(input.operationId, signature, JSON.stringify(result))
          return result
        }).finally(() => instanceCalls.delete(input.operationId))
        instanceCalls.set(input.operationId, { signature, result })
        return result
      }
      if (readOnly.has(name)) return apply(name, args)
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
