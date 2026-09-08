import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
import { names } from "../packages/task-instances/src/controller.ts"
const context = process.env.TASK_INSTANCE_CONTEXT
if (!context?.startsWith("kind-")) throw new Error("Explicit local kind context required")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
const directory = process.env.TASK_FEEDBACK_EVIDENCE ?? `/private/tmp/task-feedback-${randomUUID()}`
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
async function waitFor(id: string, phase: string) {
  const deadline = Date.now() + 240000
  while (Date.now() < deadline) {
    const instance = await manager.load(id)
    if (instance.status?.phase === phase) return instance
    if (["Failed", "RecoveryRequired"].includes(instance.status?.phase) && phase !== "Failed") throw new Error(JSON.stringify(instance.status))
    await new Promise(resolve => setTimeout(resolve, 750))
  }
  throw new Error(`Timed out waiting for ${id}: ${phase}`)
}
const taskIds: string[] = [], audit: any[] = []
const image = process.env.TASK_INSTANCE_IMAGE ?? "task-agent-instances:feedback"
async function execute(id: string, code: string, phase = "Archived", restoreFromTaskId?: string) {
  taskIds.push(id)
  const created = await call("task_instance_create", { taskId: id, spec: { image, deletionPolicy: "Delete", archive: { claimName: "task-workspace-archives", cleanupOnCompletion: true },
    ...(restoreFromTaskId ? { restoreFromTaskId } : {}), stages: [{ id: "work", command: ["node", "-e", code] }] } })
  const result = await waitFor(id, phase)
  audit.push({ taskId: id, uid: result.metadata.uid, pod: names(result).pod, phase: result.status.phase, restoreFromTaskId: result.spec.restoreFromTaskId, archive: result.status.archive })
  if (phase === "Failed") {
    writeFileSync(join(directory, "initial-failure.log"), execFileSync("kubectl", ["--context", context!, "-n", namespace, "logs", names(result).pod], { encoding: "utf8" }))
  } else {
    assert.equal(await api.get("pods", names(result).pod), undefined)
    assert.equal(await api.get("persistentvolumeclaims", names(result).volume), undefined)
  }
  return created
}
async function complete(id: string, name: string, content: string) {
  const task = graph.engine.requireTask(id)
  await call("task_complete", { taskId: id, attemptToken: task.attemptToken, summary: "Actual Kubernetes stage passed", artifacts: [{ name, type: "code", content }],
    verification: { passed: true, evidence: `Kubernetes archive receipt for ${id}`, criteriaSatisfied: task.acceptanceCriteria.map(c => c.id) } })
}
try {
  await initialize()
  const plan = await call("work_plan_create_draft", { title: "Causal repair smoke", goal: "return 2", requestText: "test repair lifecycle", summary: "implementation and consumer",
    nodes: [{ nodeId: "owner", label: "owner", stage: "implementation", outcome: "return 2", taskSpec: { goal: "return 2", acceptanceCriteria: ["works"] } },
      { nodeId: "consumer", label: "consumer", stage: "validation", outcome: "verify 2", dependsOnNodeIds: ["owner"], taskSpec: { goal: "verify 2", category: "qa", acceptanceCriteria: ["returns 2"] } }] })
  await call("work_plan_approve", { planId: plan.planId, version: 1, approvalSource: "authorized local smoke" })
  const task = (nodeId: string) => graph.store.planLinks(plan.planId, graph.store.activePlanVersion(plan.planId)).find(l => l.nodeId === nodeId)!.taskId
  const original = task("owner"), consumer = task("consumer")
  await execute(original, "const f=require('fs');f.writeFileSync('value.cjs','module.exports = 1');f.writeFileSync('unfinished','keep-owner-work');f.writeFileSync(process.env.HOME+'/history','keep-owner-session')")
  await complete(original, "value", "module.exports = 1")
  await execute(consumer, "const f=require('fs');f.writeFileSync('qa-history','keep-tests');require('assert/strict').equal(require('./value.cjs'),2)", "Failed", original)
  await call("task_fail", { taskId: consumer, attemptToken: graph.engine.requireTask(consumer).attemptToken, reason: "Actual assertion: 1 !== 2" })
  const refs = graph.engine.requireTask(original).outputArtifactRefs
  const issue = await call("task_issue_report", { reporterTaskId: consumer, observedRefs: refs, summary: "value is 1", evidence: "Node assertion in consumer Pod: 1 !== 2" })
  const routed = await call("task_issue_route", { issueId: issue.id, causeTaskId: original, causeRefs: refs, evidence: "value.cjs is produced by owner and exports 1" })
  assert.equal(routed.state, "repairing")
  graph.store.close(); graph = createGraphMcp(database, 3, manager); await initialize()
  assert.equal((await call("task_issue_list")).items[0].id, issue.id)
  const repaired = task("owner"), revalidated = task("consumer")
  await execute(repaired, "const f=require('fs'),a=require('assert/strict');a.equal(f.readFileSync('unfinished','utf8'),'keep-owner-work');a.equal(f.readFileSync(process.env.HOME+'/history','utf8'),'keep-owner-session');f.writeFileSync('value.cjs','module.exports = 2');a.equal(require('./value.cjs'),2)")
  await complete(repaired, "value", "module.exports = 2")
  const latest = graph.engine.requireArtifactVersion(graph.engine.requireTask(repaired).outputArtifactRefs[0]!).content!
  await execute(revalidated, `const f=require('fs'),a=require('assert/strict');a.equal(f.readFileSync('qa-history','utf8'),'keep-tests');f.writeFileSync('value.cjs',${JSON.stringify(latest)});a.equal(require('./value.cjs'),2)`)
  await complete(revalidated, "qa-result", "assertion passed with value v2")
  assert.equal((await manager.load(repaired)).spec.restoreFromTaskId, original)
  assert.equal((await manager.load(revalidated)).spec.restoreFromTaskId, consumer)
  const closed = await call("task_issue_resolve", { issueId: issue.id, evidence: "Owner repair and restored consumer both passed in new Kubernetes instances" })
  assert.equal(closed.state, "resolved")
  assert.equal(graph.engine.evaluateCompletion(graph.store.findWorkPlan(plan.planId)!.rootTaskId!).complete, true)
  writeFileSync(join(directory, "evidence.json"), JSON.stringify({ passed: true, issue: closed, instances: audit }, null, 2))
  console.log(JSON.stringify({ passed: true, directory, checks: ["real consumer assertion failure", "causal owner repair", "completed archive restore", "failed PVC restore", "owner and consumer histories preserved", "MCP database reconnect", "exact version revalidation", "completion cleanup"] }))
} finally {
  graph.store.close()
  for (const id of [...taskIds].reverse()) {
    try {
      await manager.remove(id)
      const deadline = Date.now() + 60000
      while (Date.now() < deadline) { try { await manager.load(id) } catch { break }; await new Promise(resolve => setTimeout(resolve, 500)) }
    } catch (error) { console.error(`Cleanup ${id}: ${String(error)}`) }
  }
}
