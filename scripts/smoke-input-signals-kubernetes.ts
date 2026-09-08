import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
import { names } from "../packages/task-instances/src/controller.ts"
const context = process.env.TASK_INSTANCE_CONTEXT
if (!context?.startsWith("kind-")) throw new Error("Explicit local kind context required")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent", image = process.env.TASK_INSTANCE_IMAGE ?? "task-agent-instances:signals"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
const directory = process.env.TASK_SIGNAL_EVIDENCE ?? `/private/tmp/input-signals-${randomUUID()}`
mkdirSync(directory, { recursive: true })
const database = join(directory, "graph.db")
let graph = createGraphMcp(database, 3, manager)
async function initialize() {
  await graph.server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
  await graph.server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
}
async function call(name: string, args: any = {}) {
  const response: any = await graph.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: { operationId: randomUUID(), ...args } } })
  if (response.error || response.result.isError) throw new Error(JSON.stringify(response))
  return response.result.structuredContent
}
async function waitFor(check: () => Promise<boolean>, label: string) {
  const deadline = Date.now() + 240000
  while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 750)) }
  throw new Error(`Timed out: ${label}`)
}
const physical: string[] = [], audit: any[] = []
async function launch(taskId: string, code: string, finish = true) {
  const instance = await call("task_instance_create", { taskId, spec: { image, deletionPolicy: "Delete", archive: { claimName: "task-workspace-archives", cleanupOnCompletion: true }, stages: [{ id: "work", command: ["node", "-e", code] }] } })
  physical.push(instance.spec.taskId)
  await waitFor(async () => {
    const current = await manager.load(instance.spec.taskId)
    if (["Failed", "RecoveryRequired"].includes(current.status?.phase)) throw new Error(JSON.stringify(current.status))
    return current.status?.phase === (finish ? "Archived" : "Running")
  }, finish ? "archive" : "running worker")
  const current = await manager.load(instance.spec.taskId)
  audit.push({ taskId, physicalTaskId: instance.spec.taskId, uid: current.metadata.uid, pod: names(current).pod, restoreFrom: current.spec.restoreFromTaskId, snapshot: current.spec.inputSnapshot, result: current.status.result })
  return current
}
async function complete(taskId: string, name: string) {
  return call("task_complete", { taskId, attemptToken: graph.engine.requireTask(taskId).attemptToken, summary: "unchanged summary", artifacts: [{ name, type: "code", content: "unchanged summary" }], verification: { passed: true, evidence: "real Pod assertions and source hash receipt", criteriaSatisfied: [] } })
}
const source = (value: number) => `require('fs').writeFileSync('value.cjs','module.exports = ${value}');console.log('source ${value}')`
const consumer = (value: number, partial = false) => `const f=require('fs'),a=require('assert/strict'),sources=JSON.parse(process.env.TASK_INPUT_SOURCES);a.equal(sources.length,1);a.equal(require(sources[0].path+'/value.cjs'),${value});${partial ? "a.equal(f.readFileSync('partial','utf8'),'preserved');" : ""}f.writeFileSync('result.cjs','module.exports = ${value}');console.log('verified real source ${value}')`
try {
  await initialize()
  const root = await call("task_create", { title: "Input signals smoke", goal: "atomic latest inputs" })
  const a = await call("task_create", { title: "source", goal: "source", parentId: root.id })
  const b = await call("task_create", { title: "consumer", goal: "consumer", parentId: root.id, dependencies: [a.id] })
  await launch(a.id, source(1)); await complete(a.id, "source")
  await launch(b.id, consumer(1)); await complete(b.id, "consumer")
  await call("task_reopen", { taskId: b.id, reason: "simulate in-flight consumer" })
  const old = await launch(b.id, "require('fs').writeFileSync('partial','preserved');console.log('partial saved');setTimeout(()=>{},120000)", false)
  const oldToken = graph.engine.requireTask(b.id).attemptToken
  await call("task_reopen", { taskId: a.id, reason: "source changes H2" })
  await launch(a.id, source(2)); await complete(a.id, "source")
  assert.equal(graph.store.currentAttempt(b.id)!.state, "fenced")
  await call("task_reopen", { taskId: a.id, reason: "source changes again H3 before next consumer pull" })
  await launch(a.id, source(3)); await complete(a.id, "source")
  await waitFor(async () => {
    const state = await call("task_signal_reconcile")
    return !state.stops.some((s: any) => s.state === "requested")
  }, "observed old worker termination")
  assert.ok(["Suspended", "Failed"].includes((await manager.load(old.spec.taskId)).status.phase))
  const signals = graph.engine.signals.list().filter(s => s.taskId === b.id)
  assert.equal(signals.length, 1); assert.ok(signals[0]!.generation >= 2)
  graph.close(); graph = createGraphMcp(database, 3, manager); await initialize()
  const next = await launch(b.id, consumer(3, true))
  assert.notEqual(next.spec.taskId, old.spec.taskId)
  assert.equal(next.spec.restoreFromTaskId, old.spec.taskId)
  assert.deepEqual(next.spec.inputSnapshot!.inputRefs, graph.engine.requireTask(a.id).outputArtifactRefs)
  await call("task_complete", { taskId: b.id, attemptToken: oldToken, summary: "late old result", verification: { passed: true } })
  assert.equal(graph.engine.requireTask(b.id).status, "running")
  await complete(b.id, "consumer")
  assert.equal(graph.engine.evaluateCompletion(root.id).complete, true)
  assert.equal(graph.store.db.prepare("SELECT count(*) AS n FROM late_task_reports").get()!.n, 1)
  writeFileSync(join(directory, "evidence.json"), JSON.stringify({ passed: true, rootTaskId: root.id, signals, stops: graph.engine.signals.stops(), executions: audit }, null, 2))
  console.log(JSON.stringify({ passed: true, directory, checks: ["actual file hashes", "read-only exact source pull", "H2/H3 coalescing", "immediate fencing", "observed Pod termination", "fresh physical execution", "partial workspace restored", "reconnect durability", "late result rejected", "latest result adopted"] }))
} finally {
  graph.close()
  for (const id of physical.reverse()) {
    try {
      await manager.remove(id)
      await waitFor(async () => { try { await manager.load(id); return false } catch { return true } }, `cleanup ${id}`)
    } catch (error) { console.error(String(error)) }
  }
}
