import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { digest, ref, withDigest } from "../contracts/canonical.ts"
import type { CheckpointManifest, LaunchRequest } from "../contracts/model.ts"
import { DockerRuntimeBackend, type DockerCommand } from "./docker.ts"
import { atomicJson, capturePath, copyTree, scanTree } from "./files.ts"

const image = "node@sha256:693101c77e947e45e001910202dcb37a659c0b1a4c27619848f1b8b7eaee0def"
export function launch(overrides: Partial<LaunchRequest> = {}): LaunchRequest {
  const template = withDigest({ id: "node", revision: 1, environment: { kind: "container" as const, image }, sourceSnapshots: [], bootstrap: [] })
  const policy = withDigest({ id: "isolated", revision: 1, network: "none" as const, allowedHosts: [], secretRefs: [], allowedEffects: [], resources: { cpus: 0.5, memoryBytes: 128 * 1024 * 1024, pids: 64, timeoutMs: 60000 } })
  const task = withDigest({ id: "task-one", revision: 1, objective: "Create one output", kind: "work" as const, inputPorts: [], outputPorts: [{ name: "result", contractRef: { id: "text", revision: 1, digest: digest("text") }, path: "result.txt" }], design: { rationale: "A deterministic fixture", steps: [{ id: "write", argv: ["node", "-e", "require('fs').writeFileSync('result.txt','done')"], outputs: ["result.txt"], timeoutMs: 5000, effectPolicy: "replayable" as const }], acceptance: [] }, workspaceTemplateRef: ref(template), executionPolicyRef: ref(policy) })
  return { intentId: "intent-1", attemptId: "attempt-1", workspaceId: "workspace-1", fence: 1, task, template, policy, inputSnapshot: { graphRef: { id: "graph", revision: 1, digest: digest("graph") }, taskSpecRef: ref(task), taskMeaningDigest: task.digest, bindings: [], orderObligations: [], workspaceTemplateDigest: template.digest, executionPolicyDigest: policy.digest, validatorRefs: [], provenanceDigest: digest("provenance"), semanticReuseKey: digest("semantics") }, inputArtifacts: [], readOnlyInputs: [], ...overrides }
}

class FakeDocker {
  container: any
  starts = 0
  creates = 0
  loseStartResponse = false
  readonly calls: string[][] = []
  execute: DockerCommand = async args => {
    this.calls.push(args)
    if (args[0] === "create") {
      this.creates++
      const labels: Record<string, string> = {}
      args.forEach((arg, index) => { if (arg === "--label") { const [key, ...value] = args[index + 1]!.split("="); labels[key!] = value.join("=") } })
      this.container = { Id: "container-one", Config: { Labels: labels }, State: { Status: "created", Running: false, Restarting: false, Paused: false, Pid: 0, ExitCode: 0, FinishedAt: "" } }
    } else if (args[0] === "container" && args[1] === "inspect") {
      if (!this.container) throw new Error("Error: No such container")
      return { stdout: JSON.stringify([this.container]), stderr: "" }
    } else if (args[0] === "start") {
      this.starts++; this.container.State = { ...this.container.State, Status: "running", Running: true, Pid: 44 }
      if (this.loseStartResponse) { this.loseStartResponse = false; throw new Error("response lost") }
    } else if (args[0] === "stop") this.finish()
    else throw new Error(`Unexpected docker operation ${args[0]}`)
    return { stdout: "container-one", stderr: "" }
  }
  finish() { this.container.State = { ...this.container.State, Status: "exited", Running: false, Pid: 0, ExitCode: 0, FinishedAt: "2026-01-01T00:00:00Z" } }
}

function temporary(t: any): string {
  const directory = mkdtempSync(join(tmpdir(), "task-greenfield-runtime-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}

test("runtime rejects unsupported policy before creating a container", async t => {
  const fake = new FakeDocker(), backend = new DockerRuntimeBackend({ root: temporary(t), execute: fake.execute })
  t.after(() => backend.close())
  const request = launch(); request.policy.network = "restricted"
  await assert.rejects(backend.ensureStarted(request), { code: "capability_unsupported" })
  assert.equal(fake.calls.length, 0)
})

test("a lost start reply survives backend restart without a second start dispatch", async t => {
  const root = temporary(t), fake = new FakeDocker(); fake.loseStartResponse = true
  let backend = new DockerRuntimeBackend({ root, execute: fake.execute })
  assert.equal((await backend.ensureStarted(launch())).observed, "unknown")
  backend.close(); backend = new DockerRuntimeBackend({ root, execute: fake.execute })
  t.after(() => backend.close())
  assert.equal((await backend.ensureStarted(launch())).observed, "running")
  assert.equal(fake.starts, 1); assert.equal(fake.creates, 1)
  const args = fake.calls.find(call => call[0] === "create")!
  assert.ok(args.includes("--read-only")); assert.ok(args.includes("no-new-privileges"))
  assert.equal(args[args.indexOf("--network") + 1], "none")
  assert.ok(!args.some(arg => arg.includes("backend.sqlite") || arg.includes("docker.sock")))
})

test("a durable cancellation tombstone rejects delayed creation after restart", async t => {
  const root = temporary(t), fake = new FakeDocker(), request = launch()
  let backend = new DockerRuntimeBackend({ root, execute: fake.execute })
  assert.equal((await backend.requestStop({ ...request, reason: "cancel", checkpoint: true })).stopReceipt?.termination.kind, "creation-revoked")
  backend.close(); backend = new DockerRuntimeBackend({ root, execute: fake.execute }); t.after(() => backend.close())
  assert.equal((await backend.ensureStarted(request)).observed, "stopped")
  assert.equal(fake.calls.length, 0)
})

test("independent backend connections serialize duplicate delivery without blocking the event loop", async t => {
  const root = temporary(t), fake = new FakeDocker()
  const execute: DockerCommand = async args => { if (args[0] === "create") await new Promise(resolve => setTimeout(resolve, 30)); return fake.execute(args) }
  const first = new DockerRuntimeBackend({ root, execute }), second = new DockerRuntimeBackend({ root, execute })
  t.after(() => { first.close(); second.close() })
  const results = await Promise.all([first.ensureStarted(launch()), second.ensureStarted(launch())])
  assert.ok(results.every(result => result.observed === "running"))
  assert.equal(fake.creates, 1); assert.equal(fake.starts, 1)
})

test("a missing started container stays unknown and cannot release its workspace", async t => {
  const fake = new FakeDocker(), backend = new DockerRuntimeBackend({ root: temporary(t), execute: fake.execute })
  t.after(() => backend.close())
  await backend.ensureStarted(launch()); fake.container = undefined
  const stopped = await backend.requestStop({ ...launch(), reason: "suspend", checkpoint: true })
  assert.equal(stopped.observed, "unknown"); assert.equal(stopped.stopReceipt, undefined)
  await assert.rejects(backend.ensureStarted(launch({ intentId: "intent-2", attemptId: "attempt-2", fence: 2 })), { code: "stale_attempt" })
})

test("stop alone does not release a workspace; capture binds immutable staged bytes", async t => {
  const root = temporary(t), fake = new FakeDocker(), backend = new DockerRuntimeBackend({ root, execute: fake.execute })
  t.after(() => backend.close())
  await backend.ensureStarted(launch())
  const workspace = join(root, "workspaces", digest("workspace-1").slice(7))
  writeFileSync(join(workspace, "result.txt"), "old-result")
  const stopped = await backend.requestStop({ ...launch(), reason: "suspend", checkpoint: true })
  await assert.rejects(backend.ensureStarted(launch({ intentId: "intent-2", attemptId: "attempt-2", fence: 2 })), { code: "stale_attempt" })
  const captured = await backend.captureStoppedWorkspace(stopped.stopReceipt!)
  writeFileSync(join(workspace, "result.txt"), "different-result")
  assert.equal(readFileSync(join(captured.outputs[0]!.snapshot.path, "result.txt"), "utf8"), "old-result")
  assert.equal(digest(scanTree(captured.workspace.path)), captured.workspace.digest)
})

test("snapshot capture rejects symlink traversal and preserves empty directories and executable mode", async t => {
  const root = temporary(t), source = join(root, "source")
  mkdirSync(join(source, "empty"), { recursive: true, mode: 0o755 })
  writeFileSync(join(source, "execute"), "echo ok", { mode: 0o755 })
  const captured = capturePath(source, join(root, "captured"))
  assert.ok(captured.files.some(entry => entry.path === "empty" && entry.kind === "directory"))
  assert.equal(captured.files.find(entry => entry.path === "execute")!.mode, 0o755)
  const { symlinkSync } = await import("node:fs")
  symlinkSync("/etc/passwd", join(source, "escape"))
  assert.throws(() => capturePath(source, join(root, "bad")), { code: "capability_unsupported" })
})

const runnerPath = fileURLToPath(new URL("./runner.mjs", import.meta.url))
function runRunner(configPath: string, workspace: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runnerPath, configPath, workspace], { stdio: "pipe" })
    let output = ""; child.stderr.on("data", chunk => { output += chunk })
    child.on("error", reject)
    child.on("close", code => code === null ? reject(new Error(output)) : resolve(code))
  })
}

test("runner resumes saved completed stages in a fresh process and rejects revoked boot permits", async t => {
  const root = temporary(t), workspace = join(root, "work"), configPath = join(root, "config.json")
  mkdirSync(workspace)
  const request = launch(), config = { identity: { intentId: request.intentId, attemptId: request.attemptId, workspaceId: request.workspaceId, fence: 1 }, taskSpecRef: ref(request.task), inputSnapshotDigest: request.inputSnapshot.provenanceDigest, semanticReuseKey: request.inputSnapshot.semanticReuseKey, templateDigest: request.template.digest, timeoutMs: 10000, bootstrap: [], resume: false, steps: [
    { id: "first", argv: [process.execPath, "-e", "const fs=require('fs');fs.writeFileSync('count',String(Number(fs.existsSync('count')?fs.readFileSync('count'):0)+1))"], outputs: ["count"], timeoutMs: 5000, effectPolicy: "replayable" },
    { id: "second", argv: [process.execPath, "-e", "const fs=require('fs');if(!fs.existsSync('partial')){fs.writeFileSync('partial','saved');process.exit(2)}fs.writeFileSync('result.txt','resumed')"], outputs: ["result.txt"], timeoutMs: 5000, effectPolicy: "replayable" },
  ] }
  atomicJson(configPath, config); atomicJson(join(root, "permit.json"), { ...config.identity, revoked: false })
  assert.equal(await runRunner(configPath, workspace), 2)
  config.identity = { ...config.identity, intentId: "intent-2", attemptId: "attempt-2", fence: 2 }; config.resume = true
  atomicJson(configPath, config); atomicJson(join(root, "permit.json"), { ...config.identity, revoked: false })
  assert.equal(await runRunner(configPath, workspace), 0)
  assert.equal(readFileSync(join(workspace, "count"), "utf8"), "1")
  assert.equal(readFileSync(join(workspace, "result.txt"), "utf8"), "resumed")
  atomicJson(join(root, "permit.json"), { ...config.identity, revoked: true })
  assert.equal(await runRunner(configPath, workspace), 125)
})

test("real Docker preserves a completed stage and partial work across suspension and a new attempt", { skip: process.env.TASK_AGENT_DOCKER_TEST !== "1" }, async t => {
  const root = temporary(t), backend = new DockerRuntimeBackend({ root: join(root, "backend") })
  t.after(() => backend.close())
  const request = launch()
  request.task = withDigest({ ...request.task, design: { ...request.task.design, steps: [
    { id: "first", argv: ["node", "-e", "const fs=require('fs');fs.writeFileSync('count',String(Number(fs.existsSync('count')?fs.readFileSync('count'):0)+1))"], outputs: ["count"], timeoutMs: 5000, effectPolicy: "replayable" },
    { id: "second", argv: ["node", "-e", "const fs=require('fs');if(fs.existsSync('partial')){fs.writeFileSync('result.txt','resumed');process.exit(0)}fs.writeFileSync('partial','saved');setInterval(()=>{},1000)"], outputs: ["result.txt"], timeoutMs: 50000, effectPolicy: "replayable" },
  ] } })
  request.inputSnapshot.taskSpecRef = ref(request.task)
  const first = await backend.ensureStarted(request)
  const handles = [first.backendHandle]
  t.after(async () => { const { execFile } = await import("node:child_process"); for (const handle of handles) if (handle) await new Promise(resolve => execFile("docker", ["rm", "-f", handle], () => resolve(undefined))) })
  assert.equal(first.observed, "running", JSON.stringify(first))
  const workspace = join(root, "backend", "workspaces", digest(request.workspaceId).slice(7))
  for (let i = 0; i < 100 && !existsSync(join(workspace, "partial")); i++) await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(existsSync(join(workspace, "partial")))
  const stopped = await backend.requestStop({ ...request, reason: "suspend", checkpoint: true })
  assert.equal(stopped.observed, "stopped"); assert.ok(stopped.stopReceipt)
  const captured = await backend.captureStoppedWorkspace(stopped.stopReceipt!)
  const pin = join(root, "cas-pin"); copyTree(captured.workspace.path, pin)
  const body: Omit<CheckpointManifest, "integrityDigest"> = { id: "checkpoint-one", attemptId: request.attemptId, fence: 1, workspaceSnapshot: { uri: "fixture", digest: captured.workspace.digest, size: captured.workspace.files.reduce((total, file) => total + file.size, 0) }, taskSpecRef: ref(request.task), inputSnapshotDigest: request.inputSnapshot.provenanceDigest, templateDigest: request.template.digest, completedSteps: captured.checkpoint!.completedSteps, effectReceipts: [] }
  const resume = { ...request, intentId: "intent-2", attemptId: "attempt-2", fence: 2, resumeCheckpoint: { manifest: { ...body, integrityDigest: digest(body) }, snapshotPath: pin } }
  const second = await backend.ensureStarted(resume); handles.push(second.backendHandle)
  let observation = second
  for (let i = 0; i < 100 && observation.observed !== "stopped"; i++) { await new Promise(resolve => setTimeout(resolve, 50)); observation = await backend.observe(resume) }
  assert.equal(observation.observed, "stopped"); assert.equal(observation.exitCode, 0)
  const final = await backend.captureStoppedWorkspace(observation.stopReceipt!)
  assert.equal(readFileSync(join(final.workspace.path, "count"), "utf8"), "1")
  assert.equal(readFileSync(join(final.outputs[0]!.snapshot.path, "result.txt"), "utf8"), "resumed")
})

test("real Docker input mounts reject writes and expose no backend database or host socket", { skip: process.env.TASK_AGENT_DOCKER_TEST !== "1" }, async t => {
  const root = temporary(t), input = join(root, "input"), backend = new DockerRuntimeBackend({ root: join(root, "backend") })
  t.after(() => backend.close()); mkdirSync(input); writeFileSync(join(input, "source.txt"), "pinned")
  const request = launch(), sourceDigest = digest(scanTree(input)), contractRef = request.task.outputPorts[0]!.contractRef
  const script = "const f=require('fs'),a=require('assert/strict'),os=require('os');let blocked=false;try{f.writeFileSync('/inputs/source/source.txt','bad')}catch{blocked=true}a.equal(blocked,true);a.equal(f.readFileSync('/inputs/source/source.txt','utf8'),'pinned');a.equal(f.existsSync('/var/run/docker.sock'),false);a.equal(f.existsSync('/backend.sqlite'),false);a.deepEqual(Object.keys(os.networkInterfaces()),['lo']);f.writeFileSync('result.txt','isolated')"
  request.task = withDigest({ ...request.task, inputPorts: [{ name: "source", contractRef, mountPath: "/inputs/source" }], design: { ...request.task.design, steps: [{ id: "check", argv: ["node", "-e", script], outputs: ["result.txt"], timeoutMs: 5000, effectPolicy: "replayable" }] } })
  request.inputSnapshot.taskSpecRef = ref(request.task)
  request.inputSnapshot.bindings = [{ inputPort: "source", producer: { nodeId: "registered", port: "source" }, artifactRef: { id: "source", digest: sourceDigest }, contractRef, contentDigest: sourceDigest }]
  request.readOnlyInputs = [{ port: "source", digest: sourceDigest, hostPath: input }]
  let observation = await backend.ensureStarted(request)
  const handle = observation.backendHandle
  t.after(async () => { if (handle) { const { execFile } = await import("node:child_process"); await new Promise(resolve => execFile("docker", ["rm", "-f", handle], () => resolve(undefined))) } })
  for (let i = 0; i < 100 && observation.observed !== "stopped"; i++) { await new Promise(resolve => setTimeout(resolve, 50)); observation = await backend.observe(request) }
  assert.equal(observation.observed, "stopped", JSON.stringify(observation)); assert.equal(observation.exitCode, 0)
  const captured = await backend.captureStoppedWorkspace(observation.stopReceipt!)
  assert.equal(readFileSync(join(captured.outputs[0]!.snapshot.path, "result.txt"), "utf8"), "isolated")
  assert.equal(readFileSync(join(input, "source.txt"), "utf8"), "pinned")
})

test("agent runner passes the objective and resumes only the interrupted step with its session", async t => {
  const root = temporary(t), workspace = join(root, "work"), configPath = join(root, "config.json"), agent = join(root, "agent.mjs")
  mkdirSync(workspace)
  writeFileSync(agent, `import fs from 'node:fs';import path from 'node:path';let data='';for await(const chunk of process.stdin)data+=chunk;const context=JSON.parse(data);const session=process.env.TASK_AGENT_SESSION;const file=path.join(session,'conversation.json');if(process.argv[2]==='start'){fs.writeFileSync(file,JSON.stringify({goal:context.objective}));process.exit(2)}if(!context.resume||process.env.TASK_AGENT_RESUMING!=='true')throw Error('not resuming');fs.writeFileSync('result.txt',JSON.parse(fs.readFileSync(file)).goal)`)
  const request = launch(), config = { identity: { intentId: request.intentId, attemptId: request.attemptId, workspaceId: request.workspaceId, fence: 1 }, taskSpecRef: ref(request.task), inputSnapshotDigest: request.inputSnapshot.provenanceDigest, semanticReuseKey: request.inputSnapshot.semanticReuseKey, templateDigest: request.template.digest, timeoutMs: 10000, bootstrap: [], resume: false, taskContext: { objective: "테스트를 읽고 고치세요" }, steps: [
    { id: "agent", argv: [process.execPath, agent, "start"], agent: { sessionPath: ".agent/test", resumeArgv: [process.execPath, agent, "resume"] }, outputs: ["result.txt"], timeoutMs: 5000, effectPolicy: "replayable" },
  ] }
  atomicJson(configPath, config); atomicJson(join(root, "permit.json"), { ...config.identity, revoked: false })
  assert.equal(await runRunner(configPath, workspace), 2)
  config.identity = { ...config.identity, intentId: "intent-2", attemptId: "attempt-2", fence: 2 }; config.resume = true
  atomicJson(configPath, config); atomicJson(join(root, "permit.json"), { ...config.identity, revoked: false })
  assert.equal(await runRunner(configPath, workspace), 0)
  assert.equal(readFileSync(join(workspace, "result.txt"), "utf8"), "테스트를 읽고 고치세요")
})
