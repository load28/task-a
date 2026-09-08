import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { Ajv } from "ajv"
import { snapshotCode, type CodeSnapshot } from "../../task-snapshots/src/index.ts"
import { createHash, randomUUID } from "node:crypto"
import { buildTaskContext, formatTaskContext } from "#task-context"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../../protocol-mcp/src/index.ts"
import { createGraphRuntime } from "../../../apps/task-agent/src/graph-runtime.ts"
import { configuredInstances, instanceTools, INSTANCE_INSTRUCTIONS } from "../../task-instances/src/graph-tools.ts"
import type { InstanceManager } from "../../task-instances/src/manager.ts"
import { instanceName } from "../../task-instances/src/manager.ts"
import { validateSpec } from "../../task-instances/src/types.ts"
import { advanceTransition, advanceInputSignals } from "../../task-instances/src/transitions.ts"

export const GRAPH_INSTRUCTIONS = `You are using a deterministic task graph, not an execution harness.
OpenCode owns all planning, task extraction, decomposition, task selection, implementation, verification, integration, retries and reflection.
Use task_search to resume existing work. Claim runnable leaves with task_start before modifying files.
Declare writeScopes when creating/decomposing tasks: literal project-relative files/directories, [] for read-only, . for exclusive work (installs, shared config, full build). Missing scopes default to exclusive.
Use task_schedule to see active reservations and ready tasks. The task_start claim atomically enforces conflicts and worker capacity. Start independent native workers concurrently, but never modify a task's files before claiming it. Respect dependencies.
Expand reservations with task_expand_scope BEFORE writing more files. On conflict pause that work; do not bypass the reservation. Complete only after ALL writes and tests stop. Failed/interrupted tasks keep reservations: confirm their native workers have stopped before task_release_scope, then reopen as needed. Never release merely due to elapsed time.
Code reuse is based on actual workspace hashes, never artifact summaries. Input changes fence outdated attempts immediately. Use task_signal_status/task_signal_reconcile to observe stops; claim only after upstream work settles and a slot is free. A task_instance_create after invalidation creates a new physical execution and restores the previous workspace. Read TASK_INPUT_SOURCES for hash-verified source workspaces and integrate the pinned inputs. Submitted results may stay implemented while upstream is unsettled; do not rerun them merely because adoption is deferred.
Use graph tools for durable state; OpenCode todos are only a display aid, never the source of truth.
Use a unique operationId for each mutation, reusing that ID and identical arguments when retrying delivery.
For any failure in any task, use task_issue_report with observed versions, diagnose the causal producer through input lineage, and task_issue_route to send the repair to that responsibility. Never solve an upstream defect only in a downstream workspace. Unknown causes remain reported until diagnosed. Follow transitionId through work_plan_reconcile; restore prior work, apply current dependency versions, rerun affected verification/integration, then task_issue_resolve. Check task_issue_list when resuming; unresolved findings prevent root completion.
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
  if (instances) store.db.exec("CREATE TABLE IF NOT EXISTS graph_instance_history(task_id TEXT NOT NULL, token TEXT PRIMARY KEY, specification TEXT NOT NULL)")
  const boundSpec = (taskId: string) => {
    const row = store.db.prepare("SELECT specification FROM graph_task_instances WHERE task_id=?").get(taskId)
    return row ? JSON.parse(String(row.specification)) : undefined
  }
  const physicalId = (taskId: string) => boundSpec(taskId)?.taskId ?? taskId
  function apply(name: string, a: any): unknown {
    switch (name) {
      case "task_signal_status": return { signals: e.signals.list(), stops: e.signals.stops() }
      case "task_issue_report": return e.feedback.report(a)
      case "task_issue_route": return e.feedback.route(a)
      case "task_issue_list": return e.feedback.list(a.rootTaskId)
      case "task_issue_resolve": return e.feedback.resolve(a.issueId, a.evidence)
      case "task_create":
        return e.createTask(a)
      case "work_plan_create_draft":
        return e.createDraftPlan(a)
      case "work_plan_load":
        return e.loadWorkPlan(a)
      case "work_plan_approve":
        e.assertReviewablePlan(a.planId, a.version)
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
        if (instances) throw new Error("Kubernetes execution requires task_instance_create; native task claims are disabled")
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
    async dispatch(name, args) {
      const validate = validators.get(name)
      if (!validate || !validate(args)) throw new Error(ajv.errorsText(validate?.errors))
      if (name === "task_signal_reconcile") return advanceInputSignals(e, instances)
      if (instances && ["task_instance_create", "task_get_runnable", "task_schedule"].includes(name)) await advanceInputSignals(e, instances)
      if (name === "work_plan_reconcile") return advanceTransition(e, String(args.transitionId), instances)
      if (name.startsWith("task_instance_") && instances) {
        const input = structuredClone(args) as Record<string, any>
        if (name === "task_instance_status") { e.loadTask(input.taskId); return instances.load(physicalId(input.taskId)) }
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
            input.spec = { taskId: input.taskId, run: 1, desiredState: "Running", storage: { size: "1Gi" }, deletionPolicy: "Retain", ...(process.env.TASK_INSTANCE_ARCHIVE_CLAIM ? { archive: { claimName: process.env.TASK_INSTANCE_ARCHIVE_CLAIM, cleanupOnCompletion: true } } : {}), image: process.env.TASK_INSTANCE_IMAGE, envSecret: process.env.TASK_INSTANCE_ENV_SECRET, ...input.spec }
            const repairContext = e.feedback.context(input.taskId)
            if (repairContext.length) {
              const candidate = store.db.prepare("SELECT payload FROM task_reuse_candidates WHERE task_id=?").get(input.taskId)
              const sources = candidate ? JSON.parse(String(candidate.payload)).sources : []
              const prior = sources.length === 1 && store.db.prepare("SELECT specification FROM graph_task_instances WHERE task_id=?").get(sources[0].taskId)
              if (prior) {
                if (input.spec.restoreFromTaskId && input.spec.restoreFromTaskId !== JSON.parse(String(prior.specification)).taskId) throw new Error("Repair must restore its own prior workspace; integrate new inputs after restoration")
                input.spec.restoreFromTaskId = JSON.parse(String(prior.specification)).taskId
                input.spec.archive ??= JSON.parse(String(prior.specification)).archive
              }
            }
            if (input.spec.taskId !== input.taskId) throw new Error("Instance taskId must match graph taskId")
            validateSpec(input.spec)
            const executionEnvironment = await instances.environment(input.spec)
            store.transaction(() => {
              e.refreshReadiness(input.taskId)
              const current = e.requireTask(input.taskId), prior = boundSpec(input.taskId)
              if (prior && current.status !== "ready") {
                const proposed = { ...input.spec, taskId: prior.taskId, inputSnapshot: prior.inputSnapshot, reuseSources: input.spec.reuseSources ?? prior.reuseSources, restoreFromTaskId: input.spec.restoreFromTaskId ?? prior.restoreFromTaskId }
                if (JSON.stringify(stable(proposed)) !== JSON.stringify(stable(prior))) throw new Error("Task already bound to a different instance specification")
                input.spec = prior; return
              }
              const active = store.db.prepare("SELECT id FROM tasks").all().filter(row => {
                const attempt = store.currentAttempt(String(row.id))
                return attempt?.state === "running" && attempt.worker?.agent === "kubernetes"
              })
              if (active.length >= maxWorkers) throw new Error("Worker slots are occupied; wait before pulling new inputs")
              if (loaded.children.length || current.status !== "ready") throw new Error("Only unclaimed runnable leaves can own a new instance")
              if (prior) {
                input.spec.taskId = `${input.taskId}-${randomUUID()}`
                input.spec.restoreFromTaskId = prior.taskId
                input.spec.archive ??= prior.archive
              }
              e.signals.setEnvironment(input.taskId, executionEnvironment)
              const started = e.startTask(input.taskId, { agent: "kubernetes", sessionId: instanceName(input.spec.taskId), instanceTaskId: input.spec.taskId })
              const snapshot = e.signals.pinned(input.taskId)!
              const sourceRefs = (refs: typeof snapshot.inputRefs): typeof snapshot.inputRefs => refs.flatMap(ref => {
                const version = e.requireArtifactVersion(ref)
                return version.type === "bundle" ? sourceRefs(version.inputs) : [ref]
              })
              const sources = [...new Map(sourceRefs(snapshot.inputRefs).flatMap(ref => {
                const code = e.signals.code(ref)
                return code?.sourceInstanceTaskId ? [[code.sourceInstanceTaskId, { taskId: code.sourceInstanceTaskId, hash: code.hash }] as const] : []
              })).values()]
              input.spec.inputSnapshot = { digest: snapshot.digest, inputRefs: snapshot.inputRefs, sources }
              const reuse = new Map((input.spec.reuseSources ?? []).map((s: any) => [s.taskId, s]))
              for (const source of sources) if (!reuse.has(source.taskId)) reuse.set(source.taskId, { taskId: source.taskId, stages: [] })
              if (reuse.size) input.spec.reuseSources = [...reuse.values()]
              const specification = JSON.stringify(stable(input.spec))
              store.db.prepare("INSERT INTO graph_instance_history VALUES(?,?,?)").run(input.taskId, started.attemptToken!, specification)
              store.db.prepare("INSERT INTO graph_task_instances VALUES (?,?) ON CONFLICT(task_id) DO UPDATE SET specification=excluded.specification").run(input.taskId, specification)
            })
            return instances.create(input.spec)
          case "task_instance_suspend": return instances.suspend(physicalId(input.taskId))
          case "task_instance_resume": return instances.resume(physicalId(input.taskId), input.run)
          case "task_instance_delete": return instances.remove(physicalId(input.taskId))
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
      const { operationId, ...input } = args as Record<string, any>
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
      const received = store.db.prepare("SELECT * FROM graph_receipts WHERE id=?").get(operationId)
      if (received) {
        if (received.signature !== signature) throw new Error("operationId reused with different arguments")
        return JSON.parse(String(received.result))
      }
      let currentEnvironment: unknown
      let codeSnapshot: CodeSnapshot | undefined
      const publishesCode = name === "artifact_publish" && input.type === "code" || name === "task_complete" && (input.artifacts?.some((a: any) => a.type === "code") || e.requireTask(input.taskId).outputArtifactRefs.some(ref => e.requireArtifactVersion(ref).type === "code"))
      const attempt = input.taskId && store.currentAttempt(input.taskId)
      const token = input.attemptToken ?? attempt?.token
      if (publishesCode && attempt?.token === token && attempt?.state !== "fenced" && store.executionAllowed(input.taskId)) {
        if (instances) {
          const instance = await instances.load(physicalId(input.taskId))
          currentEnvironment = await instances.environment(instance.spec)
          if (!["Completed", "Archived", "Archiving"].includes(instance.status?.phase) || instance.status?.result?.exitCode !== 0) throw new Error("Publish code only after the actual worker finishes successfully")
          if (instance.status.result.inputSnapshotDigest !== e.signals.pinned(input.taskId)?.digest) throw new Error("Worker receipt belongs to a different input snapshot")
          codeSnapshot = instance.status.result.codeSnapshot
          if (!codeSnapshot) throw new Error("Actual source snapshot receipt is missing; summary text cannot prove identical code")
        } else if (process.env.TASK_AGENT_WORKSPACE) codeSnapshot = snapshotCode(process.env.TASK_AGENT_WORKSPACE)
      }
      if (name === "task_complete" && codeSnapshot) for (const ref of e.requireTask(input.taskId).outputArtifactRefs) {
        if (e.requireArtifactVersion(ref).type !== "code") continue
        const artifactName = store.findArtifact(ref.artifactId)!.name
        if (e.signals.code(ref)?.hash !== codeSnapshot.hash && !input.artifacts?.some((a: any) => a.name === artifactName)) throw new Error("Changed output code must be published as a new artifact version before adoption")
      }
      return store.transaction(() => {
        const previous = store.db.prepare("SELECT * FROM graph_receipts WHERE id=?").get(operationId)
        if (previous) {
          if (previous.signature !== signature) throw new Error("operationId reused with different arguments")
          return JSON.parse(String(previous.result))
        }
        if (currentEnvironment && store.currentAttempt(input.taskId)?.token === token) e.signals.setEnvironment(input.taskId, currentEnvironment)
        if (codeSnapshot) e.signals.attest(input.taskId, token, codeSnapshot)
        const result = apply(name, input)
        store.db.prepare("INSERT INTO graph_receipts VALUES(?,?,?)").run(operationId, signature, JSON.stringify(result))
        return JSON.parse(JSON.stringify(result))
      })
    },
  })
  return { server, ...runtime }
}
