import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { reconcile, names, podFor } from "../packages/task-instances/src/controller.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
import { runInstance } from "../packages/task-instances/src/worker.ts"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import { agentConfig } from "../packages/opencode-harness/src/agents.ts"
import { FINALIZER, GROUP, type ClusterApi, type TaskInstance, type Resource, type InstanceSpec } from "../packages/task-instances/src/types.ts"

class MemoryCluster implements ClusterApi {
  resources = new Map<string, Resource>()
  deletions: string[] = []
  holdDeletion = false
  async get(type: string, name: string) { return structuredClone(this.resources.get(`${type}/${name}`)) }
  async list(type: string) { return [...this.resources.entries()].filter(([k]) => k.startsWith(type + "/")).map(([, v]) => structuredClone(v)) }
  async create(type: string, value: Resource) {
    const key = `${type}/${value.metadata.name}`
    if (this.resources.has(key)) throw new Error("AlreadyExists")
    return this.replace(type, { ...value, metadata: { uid: `uid-${this.resources.size}`, ...value.metadata } })
  }
  async replace(type: string, value: Resource) { this.resources.set(`${type}/${value.metadata.name}`, structuredClone(value)); return value }
  async status(value: TaskInstance, status: Record<string, unknown>) { await this.replace("taskinstances", { ...value, status }) }
  async remove(type: string, value: Resource) {
    this.deletions.push(`${type}/${value.metadata.name}`)
    if (this.holdDeletion) await this.replace(type, { ...value, metadata: { ...value.metadata, deletionTimestamp: "now" } })
    else this.resources.delete(`${type}/${value.metadata.name}`)
  }
}
function spec(): InstanceSpec {
  return { taskId: "leaf-1", image: "worker@sha256:abc", run: 1, desiredState: "Running", storage: { size: "1Gi" }, deletionPolicy: "Retain",
    stages: [{ id: "implement", command: ["node", "-e", "0"] }] }
}
async function fixture() {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  await manager.create(spec())
  const tick = async () => { await reconcile(api, await manager.load("leaf-1")) }
  await tick(); await tick(); await tick(); await tick()
  return { api, manager, tick }
}
test("instance restart reuses PVC and waits for previous Pod termination", async () => {
  const { api, manager, tick } = await fixture()
  const instance = await manager.load("leaf-1"), ids = names(instance)
  const volume = await api.get("persistentvolumeclaims", ids.volume)
  api.holdDeletion = true
  await manager.suspend("leaf-1"); await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Suspending")
  await assert.rejects(manager.resume("leaf-1", 2), /Wait for/)
  await tick()
  assert.equal((await api.list("pods")).length, 1)
  api.resources.delete(`pods/${ids.pod}`)
  await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Suspended")
  await manager.resume("leaf-1", 2); await manager.resume("leaf-1", 2); await tick()
  assert.equal((await api.get("pods", ids.pod))!.metadata.annotations![`${GROUP}/run`], "2")
  assert.deepEqual(await api.get("persistentvolumeclaims", ids.volume), volume)
})
test("a never-started suspended instance can allocate storage on first resume", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  await manager.create({ ...spec(), desiredState: "Suspended" })
  for (let i = 0; i < 2; i++) await reconcile(api, await manager.load("leaf-1"))
  await manager.resume("leaf-1", 2)
  for (let i = 0; i < 3; i++) await reconcile(api, await manager.load("leaf-1"))
  assert.equal((await api.list("pods")).length, 1)
})
test("missing recorded Pod or PVC requires recovery instead of silently starting fresh", async () => {
  const { api, manager, tick } = await fixture()
  const ids = names(await manager.load("leaf-1"))
  api.resources.delete(`pods/${ids.pod}`); await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "RecoveryRequired")
  await assert.rejects(manager.resume("leaf-1", 2), /operator recovery/)
  api.resources.delete(`persistentvolumeclaims/${ids.volume}`); await tick()
  assert.equal((await api.list("persistentvolumeclaims")).length, 0)
})
test("deletion waits for the worker and retains data unless Delete was selected", async () => {
  for (const policy of ["Retain", "Delete"] as const) {
    const { api, manager, tick } = await fixture()
    const instance = await manager.load("leaf-1")
    instance.spec.deletionPolicy = policy; instance.metadata.deletionTimestamp = "now"
    await api.replace("taskinstances", instance)
    await tick()
    assert.equal((await api.list("persistentvolumeclaims")).length, 1)
    await tick(); await tick()
    assert.equal((await api.list("persistentvolumeclaims")).length, policy === "Retain" ? 1 : 0)
    assert.ok(!(await manager.load("leaf-1")).metadata.finalizers?.includes(FINALIZER))
  }
})
test("controller restart observes completed Pod without executing it again", async () => {
  const { api, manager, tick } = await fixture(), ids = names(await manager.load("leaf-1"))
  const pod = (await api.get("pods", ids.pod))!
  pod.status = { phase: "Succeeded" }; await api.replace("pods", pod)
  await tick(); await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Completed")
  assert.equal((await api.get("pods", ids.pod))!.metadata.uid, pod.metadata.uid)
  await manager.resume("leaf-1", 1)
  assert.equal((await manager.load("leaf-1")).spec.run, 1)
})
test("capacity blocks additional Pods without losing their allocated workspace", async () => {
  const { api, manager } = await fixture()
  await manager.create({ ...spec(), taskId: "leaf-2" })
  for (let i = 0; i < 3; i++) await reconcile(api, await manager.load("leaf-2"), 1)
  assert.equal((await manager.load("leaf-2")).status.phase, "Queued")
  assert.equal((await api.list("pods")).length, 1)
  assert.equal((await api.list("persistentvolumeclaims")).length, 2)
})
test("Kubernetes manager dispatch cannot also start a native task worker", () => {
  const manager = agentConfig(50, 3, true).agent!["task-manager"]!
  assert.match(manager.prompt!, /task_instance_create/)
  assert.ok(manager.permission && typeof manager.permission === "object")
  assert.equal((manager.permission.task as Record<string, string>)["task-worker"], "deny")
})
test("Graph MCP exposes durable instances for existing leaves and across new MCP sessions", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  const graph = createGraphMcp(":memory:", 3, manager)
  try {
    const task = graph.engine.createTask({ title: "Kubernetes task", goal: "Preserve execution" })
    const server = graph.server
    await server.handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
    await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
    const call = async (name: string, args: any) => {
      const response: any = await server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } })
      assert.equal(response.error, undefined, JSON.stringify(response))
      assert.ok(!response.result.isError, JSON.stringify(response))
      return JSON.parse(response.result.content[0].text)
    }
    await call("task_instance_create", { taskId: task.id, spec: { ...spec(), taskId: task.id }, operationId: "create-instance" })
    assert.equal(graph.engine.loadTask(task.id).task.status, "running")
    const premature: any = await graph.server.handle({ jsonrpc: "2.0", id: 99, method: "tools/call", params: { name: "task_complete", arguments: { taskId: task.id, operationId: "premature-completion", summary: "done" } } })
    assert.equal(premature.result.isError, true)
    assert.match(premature.result.content[0].text, /current worker finishes successfully/)

    const status = await call("task_instance_status", { taskId: task.id })
    assert.equal(status.spec.taskId, task.id)
    const reconnected = new InstanceManager(api, "test")
    assert.equal((await reconnected.load(task.id)).metadata.uid, status.metadata.uid)
    await call("task_instance_suspend", { taskId: task.id, operationId: "suspend-instance" })
    assert.equal((await reconnected.load(task.id)).spec.desiredState, "Suspended")
    for (let i = 0; i < 2; i++) await reconcile(api, await manager.load(task.id))
    await call("task_instance_resume", { taskId: task.id, run: 2, operationId: "resume-instance" })
    await call("task_instance_suspend", { taskId: task.id, operationId: "suspend-instance" })
    assert.equal((await reconnected.load(task.id)).spec.desiredState, "Running", "old operation replay must not stop a newer run")
  } finally { graph.close() }
})
test("failed stage resumes with preserved files and does not repeat completed stages", async t => {
  const directory = mkdtempSync(join(tmpdir(), "instance-worker-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = { ...spec(), stages: [
    { id: "research", command: [process.execPath, "-e", "require('fs').appendFileSync('research.txt','once\\n')"] },
    { id: "implement", command: [process.execPath, "-e", "const f=require('fs');if(!f.existsSync('partial.txt')){f.writeFileSync('partial.txt','saved');process.exit(1)}f.writeFileSync('done.txt','done')"] },
  ] }
  assert.equal(await runInstance(input, directory, "uid"), 1)
  assert.equal(await runInstance({ ...input, run: 2 }, directory, "uid"), 0)
  assert.equal(readFileSync(join(directory, "workspace/research.txt"), "utf8"), "once\n")
  const checkpoint = JSON.parse(readFileSync(join(directory, "checkpoint.json"), "utf8"))
  assert.deepEqual(checkpoint.completed, ["research", "implement"])
  assert.deepEqual(checkpoint.attempts, { research: 1, implement: 2 })
  await assert.rejects(runInstance({ ...input, image: "changed" }, directory, "uid"), /does not match/)
})
test("SIGTERM persists partial work and resumes the interrupted stage in a new process", async t => {
  const directory = mkdtempSync(join(tmpdir(), "instance-stop-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = { ...spec(), stages: [{ id: "implement", command: [process.execPath, "-e",
    "const f=require('fs');if(f.existsSync('partial'))process.exit(0);f.writeFileSync('partial','saved');setInterval(()=>{},1000)"] }] }
  const child = spawn(process.execPath, ["scripts/instance-worker.ts"], { env: { ...process.env,
    TASK_INSTANCE_SPEC: JSON.stringify(input), TASK_INSTANCE_DATA: directory, TASK_INSTANCE_ID: "uid" }, stdio: "pipe" })
  t.after(() => child.kill("SIGKILL"))
  const exited = new Promise(resolve => child.once("exit", resolve))
  const deadline = Date.now() + 5000
  while (!existsSync(join(directory, "workspace/partial")) && Date.now() < deadline) await new Promise(ok => setTimeout(ok, 20))
  assert.ok(existsSync(join(directory, "workspace/partial")))
  child.kill("SIGTERM")
  assert.equal(await exited, 143)
  assert.equal(JSON.parse(readFileSync(join(directory, "checkpoint.json"), "utf8")).state, "Suspended")
  assert.equal(await runInstance(input, directory, "uid"), 0)
})

test("Kubernetes profiles fill worker defaults and reject native claims without mutating retry input", async () => {
  const oldImage = process.env.TASK_INSTANCE_IMAGE, oldSecret = process.env.TASK_INSTANCE_ENV_SECRET
  process.env.TASK_INSTANCE_IMAGE = "configured-worker:local"
  process.env.TASK_INSTANCE_ENV_SECRET = "configured-auth"
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test"), graph = createGraphMcp(":memory:", 3, manager)
  try {
    const task = graph.engine.createTask({ title: "Profile task", goal: "Run in the configured Pod" })
    await graph.server.handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
    await graph.server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
    const call = (name: string, args: any) => graph.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } })
    const denied: any = await call("task_start", { taskId: task.id, operationId: "native-denied" })
    assert.equal(denied.result.isError, true)
    assert.equal(graph.engine.requireTask(task.id).status, "ready")
    const invalid: any = await call("task_instance_create", {
      taskId: task.id, operationId: "invalid-spec",
      spec: { stages: [{ id: "build", argv: ["true"] }], deletionPolicy: "Archive" },
    })
    assert.equal(invalid.result.isError, true)
    assert.match(invalid.result.content[0].text, /command/)
    assert.equal(graph.engine.requireTask(task.id).status, "ready")
    const input = { stages: spec().stages }
    const args = { taskId: task.id, spec: input, operationId: "profile-create" }
    for (let n = 0; n < 2; n++) {
      const result: any = await call("task_instance_create", args)
      assert.ok(!result.result.isError, JSON.stringify(result))
    }
    assert.equal("image" in args.spec, false)
    const instance = await manager.load(task.id)
    assert.equal(instance.spec.image, "configured-worker:local")
    assert.equal(instance.spec.taskId, task.id)
    assert.equal(instance.spec.run, 1)
    assert.equal(instance.spec.desiredState, "Running")
    assert.equal(instance.spec.storage.size, "1Gi")
    assert.equal(instance.spec.deletionPolicy, "Retain")
    assert.equal(instance.spec.envSecret, "configured-auth")
    assert.equal(graph.store.currentAttempt(task.id)!.worker!.agent, "kubernetes")
    assert.equal((await api.list("taskinstances")).length, 1)
  } finally {
    graph.close()
    if (oldImage === undefined) delete process.env.TASK_INSTANCE_IMAGE; else process.env.TASK_INSTANCE_IMAGE = oldImage
    if (oldSecret === undefined) delete process.env.TASK_INSTANCE_ENV_SECRET; else process.env.TASK_INSTANCE_ENV_SECRET = oldSecret
  }
})

test("archive receipt is persisted before cleanup and an archived task restores on a new volume", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  await api.create("persistentvolumeclaims", { metadata: { name: "archives" } })
  await manager.create({ ...spec(), archive: { claimName: "archives", cleanupOnCompletion: true } })
  const tick = async () => reconcile(api, await manager.load("leaf-1"))
  for (let i = 0; i < 4; i++) await tick()
  const instance = await manager.load("leaf-1"), ids = names(instance)
  const pod = (await api.get("pods", ids.pod))!
  const archive = { version: 1, instanceId: instance.metadata.uid, run: 1, file: "run-1.tar.gz", sha256: "a".repeat(64) }
  await api.replace("pods", { ...pod, status: { phase: "Succeeded", containerStatuses: [{ name: "worker", state: { terminated: { exitCode: 0, message: JSON.stringify({ archive }) } } }] } })
  await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Archiving")
  assert.ok(await api.get("pods", ids.pod))
  for (let i = 0; i < 3; i++) await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Archived")
  assert.equal(await api.get("pods", ids.pod), undefined)
  assert.equal(await api.get("persistentvolumeclaims", ids.volume), undefined)
  await manager.resume("leaf-1", 2)
  for (let i = 0; i < 3; i++) await tick()
  const resumed = (await api.get("pods", ids.pod))!
  assert.ok(resumed.spec.containers[0].env.some((e: any) => e.name === "TASK_WORKSPACE_ARCHIVE" && JSON.parse(e.value).sha256 === archive.sha256))
})

test("completed execution without an archive receipt never loses its Pod or PVC", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  await api.create("persistentvolumeclaims", { metadata: { name: "archives" } })
  await manager.create({ ...spec(), archive: { claimName: "archives", cleanupOnCompletion: true } })
  const tick = async () => reconcile(api, await manager.load("leaf-1"))
  for (let i = 0; i < 4; i++) await tick()
  const ids = names(await manager.load("leaf-1")), pod = (await api.get("pods", ids.pod))!
  await api.replace("pods", { ...pod, status: { phase: "Succeeded" } })
  for (let i = 0; i < 3; i++) await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "RecoveryRequired")
  assert.ok(await api.get("pods", ids.pod))
  assert.ok(await api.get("persistentvolumeclaims", ids.volume))
})

test("restore and archive mounts share one volume for the same PVC while source remains read-only", () => {
  const input: TaskInstance = { apiVersion: "tasks.task-agent.dev/v1alpha1", kind: "TaskInstance", metadata: { name: "task", uid: "uid", namespace: "test" }, spec: { ...spec(), archive: { claimName: "archives", cleanupOnCompletion: true } } }
  const archive = { version: 1 as const, instanceId: "source", run: 1, file: "run-1.tar.gz", sha256: "a".repeat(64) }
  const pod = podFor(input, ["archives"], [archive], { claim: "archives", archive })
  assert.equal(pod.spec.volumes.filter((v: any) => v.persistentVolumeClaim.claimName === "archives").length, 1)
  const mounts = pod.spec.containers[0].volumeMounts
  assert.equal(mounts.find((m: any) => m.mountPath === "/restore").readOnly, true)
  assert.equal(mounts.find((m: any) => m.mountPath === "/reuse/0").readOnly, true)
  assert.ok(!mounts.find((m: any) => m.mountPath === "/archive").readOnly)
})

test("repair restores a stopped workspace including dirty files and session state without mutating its source", async () => {
  const dir = mkdtempSync(join(tmpdir(), "repair-stopped-")), source = join(dir, "source"), target = join(dir, "target")
  const previous = process.env.TASK_RESTORE_DIRECTORY
  try {
    const original = { ...spec(), taskId: "stopped-owner", stages: [{ id: "partial", command: ["node", "-e", "require('fs').writeFileSync('partial','preserved');require('fs').writeFileSync(process.env.HOME+'/session','history');process.exit(1)"] }] }
    assert.equal(await runInstance(original, source, "source-uid"), 1)
    const checkpoint = readFileSync(join(source, "checkpoint.json"), "utf8")
    process.env.TASK_RESTORE_DIRECTORY = source
    const repaired = { ...spec(), taskId: "replacement-owner", restoreFromTaskId: original.taskId, stages: [{ id: "repair", command: ["node", "-e", "const f=require('fs'),a=require('assert/strict');a.equal(f.readFileSync('partial','utf8'),'preserved');a.equal(f.readFileSync(process.env.HOME+'/session','utf8'),'history');f.writeFileSync('partial','fixed')"] }] }
    assert.equal(await runInstance(repaired, target, "target-uid"), 0)
    assert.equal(readFileSync(join(source, "workspace", "partial"), "utf8"), "preserved")
    assert.equal(readFileSync(join(target, "workspace", "partial"), "utf8"), "fixed")
    assert.equal(readFileSync(join(source, "checkpoint.json"), "utf8"), checkpoint)
    assert.equal(readFileSync(join(target, "history", "source-stopped-owner", "checkpoint.json"), "utf8"), checkpoint)
  } finally {
    if (previous === undefined) delete process.env.TASK_RESTORE_DIRECTORY; else process.env.TASK_RESTORE_DIRECTORY = previous
    rmSync(dir, { recursive: true, force: true })
  }
})

test("controller pins stopped source PVC read-only for repair and refuses source resume while consumed", async () => {
  const { api, manager, tick } = await fixture()
  await tick(); await tick(); await tick()
  const source = await manager.load("leaf-1"), sourceNames = names(source)
  await manager.suspend("leaf-1"); await tick(); await tick()
  const replacement = await manager.create({ ...spec(), taskId: "repair", restoreFromTaskId: "leaf-1" })
  for (let n = 0; n < 3; n++) await reconcile(api, await manager.load("repair"))
  const pod = await api.get("pods", names(replacement as TaskInstance).pod)
  assert.ok(pod)
  assert.equal(pod!.spec.volumes.find((v: any) => v.name === "restore").persistentVolumeClaim.claimName, sourceNames.volume)
  assert.equal(pod!.spec.containers[0].volumeMounts.find((v: any) => v.name === "restore").readOnly, true)
  assert.ok(pod!.spec.containers[0].env.some((v: any) => v.name === "TASK_RESTORE_DIRECTORY"))
  await assert.rejects(manager.resume("leaf-1", 2), /pinned/)
  const stopped = await manager.load("leaf-1")
  await api.replace("taskinstances", { ...stopped, spec: { ...stopped.spec, desiredState: "Running", run: 2 } })
  await tick(); await tick()
  assert.equal(await api.get("pods", sourceNames.pod), undefined)
  assert.equal((await manager.load("leaf-1")).status?.phase, "WaitingForRestore")
})

test("worker pulls actual pinned source files and refuses a modified source before execution", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pinned-source-")), source = join(dir, "source"), target = join(dir, "target")
  try {
    const fs = await import("node:fs"), { snapshotCode } = await import("../packages/task-snapshots/src/index.ts")
    const original = { ...spec(), taskId: "producer", stages: [{ id: "code", command: ["node", "-e", "require('fs').writeFileSync('value.cjs','module.exports = 42')"] }] }
    await runInstance(original, source, "source-uid")
    const snapshot = snapshotCode(join(source, "workspace"))
    const consumer = { ...spec(), taskId: "consumer", inputSnapshot: { digest: snapshot.hash, inputRefs: [], sources: [{ taskId: "producer", hash: snapshot.hash }] },
      reuseSources: [{ taskId: "producer", stages: [] }], stages: [{ id: "check", command: ["node", "-e", "const s=JSON.parse(process.env.TASK_INPUT_SOURCES);require('assert/strict').equal(require(s[0].path+'/value.cjs'),42);require('fs').writeFileSync('checked','yes')"] }] }
    assert.equal(await runInstance(consumer, target, "target-uid", [source]), 0)
    assert.equal(fs.readFileSync(join(target, "workspace", "checked"), "utf8"), "yes")
    fs.writeFileSync(join(source, "workspace", "value.cjs"), "module.exports = 43")
    await assert.rejects(runInstance({ ...consumer, taskId: "bad-consumer" }, join(dir, "bad"), "bad-uid", [source]), /do not match/)
    assert.equal(existsSync(join(dir, "bad", "workspace", "checked")), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("archive admission fails before allocation and resume revalidates storage", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  const input = { ...spec(), archive: { claimName: "archives", cleanupOnCompletion: true } }
  await assert.rejects(manager.create(input), /Archive PVC "archives".*test/)
  assert.equal(api.resources.size, 0)
  await api.create("persistentvolumeclaims", { metadata: { name: "archives" }, status: { phase: "Pending" } })
  await manager.create(input) // WaitForFirstConsumer claims must not be rejected.
  await manager.suspend(input.taskId)
  api.resources.delete("persistentvolumeclaims/archives")
  await assert.rejects(manager.resume(input.taskId, 2), /Archive PVC/)
  assert.equal((await manager.load(input.taskId)).spec.run, 1)
})

test("legacy invalid archive is blocked without allocating storage and recovers after provisioning", async () => {
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test")
  const instance: TaskInstance = { metadata: { name: "legacy", uid: "legacy", finalizers: [FINALIZER] }, spec: { ...spec(), archive: { claimName: "missing", cleanupOnCompletion: true } } }
  await reconcile(api, instance)
  assert.equal((await api.get("taskinstances", "legacy"))!.status.reason, "ArchiveUnavailable")
  assert.equal((await api.list("pods")).length, 0)
  assert.equal((await api.list("persistentvolumeclaims")).length, 0)
  await api.create("persistentvolumeclaims", { metadata: { name: "missing" } })
  await reconcile(api, (await api.get("taskinstances", "legacy")) as TaskInstance)
  assert.ok(await api.get("persistentvolumeclaims", names(instance).volume))
})

test("scheduling and image failures remain observable and clear on startup", async () => {
  const { api, manager, tick } = await fixture()
  const pod = (await api.get("pods", names(await manager.load("leaf-1")).pod))!
  for (const status of [
    { phase: "Pending", conditions: [{ type: "PodScheduled", status: "False", reason: "Unschedulable", message: 'persistentvolumeclaim "missing" not found' }] },
    { phase: "Pending", containerStatuses: [{ name: "worker", state: { waiting: { reason: "ImagePullBackOff", message: "image unavailable" } } }] },
  ]) {
    await api.replace("pods", { ...pod, status }); await tick()
    const current = (await manager.load("leaf-1")).status
    assert.equal(current.phase, "Starting")
    assert.ok(current.reason)
    assert.ok(current.message)
  }
  await api.replace("pods", { ...pod, status: { phase: "Running" } }); await tick()
  assert.equal((await manager.load("leaf-1")).status.reason, undefined)
})

test("model cannot choose archive storage and missing configured storage leaves graph unclaimed", async () => {
  const prior = process.env.TASK_INSTANCE_ARCHIVE_CLAIM
  process.env.TASK_INSTANCE_ARCHIVE_CLAIM = "missing"
  const api = new MemoryCluster(), manager = new InstanceManager(api, "test"), graph = createGraphMcp(":memory:", 3, manager)
  try {
    const task = graph.engine.createTask({ title: "Admission", goal: "Validate before claiming" })
    await graph.server.handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
    await graph.server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
    for (const override of [{ archive: { claimName: "invented", cleanupOnCompletion: true } }, {}]) {
      const response: any = await graph.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "task_instance_create", arguments: { taskId: task.id, operationId: JSON.stringify(override), spec: { image: "worker", stages: spec().stages, ...override } } } })
      assert.equal(response.result.isError, true)
      assert.equal(graph.engine.requireTask(task.id).status, "ready")
      assert.equal(graph.store.currentAttempt(task.id), undefined)
      assert.equal((await api.list("taskinstances")).length, 0)
    }
  } finally {
    graph.close()
    if (prior === undefined) delete process.env.TASK_INSTANCE_ARCHIVE_CLAIM; else process.env.TASK_INSTANCE_ARCHIVE_CLAIM = prior
  }
})

test("전체 취소는 보관 볼륨의 소비자 정리 대기보다 우선해 Pod를 중지한다", async () => {
  const { api, manager, tick } = await fixture()
  const instance = await manager.load("leaf-1")
  await api.replace("taskinstances", { ...instance,
    spec: { ...instance.spec, desiredState: "Suspended", archive: { claimName: "archives", cleanupOnCompletion: true } },
    status: { ...instance.status, archive: { key: "saved" }, archivedRun: instance.spec.run } })
  await api.create("taskinstances", { metadata: { name: "consumer" }, spec: { restoreFromTaskId: "leaf-1" }, status: { phase: "Running" } })
  await tick()
  await tick()
  assert.equal((await manager.load("leaf-1")).status.phase, "Suspended")
  assert.ok(!api.deletions.some(d => d.startsWith("persistentvolumeclaims/")))
})

test("실패 증거를 컨트롤러까지 전달하고 응답 지침으로 같은 볼륨에서 재개한다", async () => {
  const dir = mkdtempSync(join(tmpdir(), "failure-recovery-"))
  const input = spec()
  input.stages = [{ id: "verify", command: [process.execPath, "-e", `if(process.env.TASK_RECOVERY_INSTRUCTIONS !== '사용자 응답: 대체 검증 진행') { console.error('python3: command not found'); process.exit(1) }`] }]
  try {
    assert.equal(await runInstance(input, dir, "test-instance"), 1)
    const receipt = JSON.parse(readFileSync(join(dir, "termination.json"), "utf8"))
    assert.equal(receipt.failure.stage, "verify")
    assert.match(receipt.failure.logTail, /python3: command not found/)
    assert.ok(Buffer.byteLength(JSON.stringify(receipt)) < 4096)
    const { api, manager, tick } = await fixture()
    const instance = await manager.load("leaf-1"), ids = names(instance)
    const pod = (await api.get("pods", ids.pod))!
    await api.replace("pods", { ...pod, status: { phase: "Failed", containerStatuses: [{ name: "worker", state: { terminated: { exitCode: 1, message: JSON.stringify(receipt) } } }] } })
    await tick()
    assert.equal((await manager.load("leaf-1")).status.result.failure.stage, "verify")
    const resumed = await manager.resume("leaf-1", 2, "사용자 응답: 대체 검증 진행")
    assert.equal(resumed.spec.recoveryInstructions, "사용자 응답: 대체 검증 진행")
    await assert.rejects(manager.resume("leaf-1", 2, "다른 답변"), /different recovery/)
    assert.equal(await runInstance({ ...input, run: 2, recoveryInstructions: resumed.spec.recoveryInstructions }, dir, "test-instance"), 0)
    assert.deepEqual(JSON.parse(readFileSync(join(dir, "checkpoint.json"), "utf8")).completed, ["verify"])
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("성공 결과를 오류로 표시하지 않는다", async () => {
  const { api, manager, tick } = await fixture()
  const pod = (await api.get("pods", names(await manager.load("leaf-1")).pod))!
  await api.replace("pods", { ...pod, status: { phase: "Succeeded", containerStatuses: [{ name: "worker", state: { terminated: { exitCode: 0, message: '{}' } } }] } })
  await tick()
  assert.equal((await manager.load("leaf-1")).status.result.failure, undefined)
})
