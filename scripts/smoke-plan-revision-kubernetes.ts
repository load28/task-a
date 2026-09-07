import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { InstanceManager, instanceName } from "../packages/task-instances/src/manager.ts"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { names } from "../packages/task-instances/src/controller.ts"
import { advanceTransition } from "../packages/task-instances/src/transitions.ts"
import type { InstanceSpec, TaskInstance } from "../packages/task-instances/src/types.ts"
import type { PlanNode } from "#task-domain"

const context = process.env.TASK_INSTANCE_CONTEXT
if (!context?.startsWith("kind-")) throw new Error("Use an explicit kind context for destructive lifecycle tests")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
const directory = mkdtempSync(join(tmpdir(), "revision-kubernetes-")), database = join(directory, "graph.db")
let graph = createGraphRuntime(database)
const created: string[] = []
const node = (id: string): PlanNode => ({ nodeId: id, label: id, stage: "implementation", outcome: id, dependsOnNodeIds: [], taskSpec: { goal: id, acceptanceCriteria: ["checks pass"] } })
async function waitFor(check: () => Promise<boolean>, label: string) {
  const deadline = Date.now() + 120000
  while (Date.now() < deadline) { if (await check()) return; await new Promise(ok => setTimeout(ok, 500)) }
  throw new Error(`Timed out: ${label}`)
}
async function create(spec: InstanceSpec) {
  graph.engine.startTask(spec.taskId, { agent: "kubernetes", sessionId: instanceName(spec.taskId) })
  await manager.create(spec); created.push(spec.taskId)
}
const research: InstanceSpec["stages"][number] = { id: "research", inputDigest: "a".repeat(64), outputs: ["notes.txt"],
  command: ["node", "-e", "require('fs').writeFileSync('notes.txt','retained research')"] }
const base: Omit<InstanceSpec, "taskId" | "stages"> = { image: process.env.TASK_INSTANCE_IMAGE ?? "task-agent-instances:local", desiredState: "Running", run: 1,
  storage: { size: "1Gi" }, deletionPolicy: "Delete" }
try {
  const nodes = [node("changing"), node("unaffected")]
  graph.engine.createDraftPlan({ title: `revision smoke ${randomUUID()}`, goal: "test selective revision", requestText: "build", summary: "initial", nodes })
  const planId = String(graph.store.db.prepare("SELECT id FROM work_plans").get()!.id)
  graph.engine.approveWorkPlan({ planId, version: 1, approvalSource: "test user" })
  const id = (version: number, nodeId: string) => graph.store.planLinks(planId, version).find(l => l.nodeId === nodeId)!.taskId
  const original = id(1, "changing"), unaffected = id(1, "unaffected")
  await create({ ...base, taskId: original, stages: [research, { id: "implementation", command: ["node", "-e", "require('fs').writeFileSync('old-partial.txt','old');setInterval(()=>{},1000)"] }] })
  await create({ ...base, taskId: unaffected, stages: [{ id: "running", command: ["node", "-e", "setInterval(()=>{},1000)"] }] })
  const source = await manager.load(original), sourceNames = names(source)
  await waitFor(async () => {
    try { return (await api.command(["exec", sourceNames.pod, "--", "cat", "/data/checkpoint.json"])).active === "implementation" } catch { return false }
  }, "source reaches implementation")
  await waitFor(async () => (await manager.load(unaffected)).status?.phase === "Running", "unaffected worker starts")
  const unaffectedPod = (await manager.load(unaffected)).status.podUid
  graph.engine.reviseWorkPlan({ planId, baseVersion: 1, summary: "new direction", nodes: [{ ...nodes[0]!, taskSpec: { ...nodes[0]!.taskSpec, goal: "new implementation" } }, nodes[1]!] })
  const approved = graph.engine.approveWorkPlan({ planId, version: 2, approvalSource: "test user" })
  assert.deepEqual(approved.transition!.stops.map(s => s.taskId), [original])
  const transitionId = approved.transition!.id
  graph.close(); graph = createGraphRuntime(database)
  await waitFor(async () => (await advanceTransition(graph.engine, transitionId, manager)).transition.state === "applied", "durable transition after graph restart")
  assert.equal((await manager.load(unaffected)).status.podUid, unaffectedPod)
  const replacement = id(2, "changing")
  assert.notEqual(replacement, original)
  await create({ ...base, taskId: replacement, reuseSources: [{ taskId: original, stages: ["research"] }], stages: [research,
    { id: "implementation", command: ["node", "-e", "const f=require('fs');if(f.existsSync('old-partial.txt'))process.exit(1);if(f.readFileSync('notes.txt','utf8')!=='retained research')process.exit(2);f.writeFileSync('new-result.txt','new direction')"] }] })
  await waitFor(async () => {
    const state = (await manager.load(replacement)).status
    if (["Failed", "RecoveryRequired"].includes(state?.phase)) throw new Error(JSON.stringify(state))
    return state?.phase === "Completed"
  }, "replacement reuses research")
  const done = await manager.load(replacement), result = JSON.parse(done.status.result.message)
  assert.equal(result.reused.research, original)
  assert.notEqual(names(done).volume, sourceNames.volume)
  assert.ok(await api.get("persistentvolumeclaims", sourceNames.volume))
  assert.equal((await manager.load(unaffected)).status.podUid, unaffectedPod)
  process.stdout.write(JSON.stringify({ passed: true, checks: ["selective stop", "unchanged worker continues", "graph restart preserves transition", "new specification and PVC", "verified research imported without execution", "old partial implementation excluded"] }) + "\n")
} finally {
  for (const taskId of created.reverse()) {
    const instance = await manager.load(taskId)
    await api.remove("taskinstances", instance)
    await waitFor(async () => !(await api.get("taskinstances", instance.metadata.name)), "cleanup")
  }
  graph.close(); rmSync(directory, { recursive: true, force: true })
}
