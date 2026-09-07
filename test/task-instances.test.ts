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
    const { image, ...input } = { ...spec(), taskId: task.id }
    const args = { taskId: task.id, spec: input, operationId: "profile-create" }
    for (let n = 0; n < 2; n++) {
      const result: any = await call("task_instance_create", args)
      assert.ok(!result.result.isError, JSON.stringify(result))
    }
    assert.equal("image" in args.spec, false)
    const instance = await manager.load(task.id)
    assert.equal(instance.spec.image, "configured-worker:local")
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
