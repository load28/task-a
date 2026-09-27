import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { DatabaseSync } from "node:sqlite"
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import { contentDigest, digest, ref, revisionDigest, sameRef } from "../contracts/canonical.ts"
import type { CaptureResult, Digest, LaunchRequest, RevisionRef, RuntimeBackend, RuntimeIdentity, RuntimeObservation, StopReceipt, StopRequest } from "../contracts/model.ts"
import { atomicJson, capturePath, copyTree, plainPath, RuntimeError, safeRelative, scanTree, within } from "./files.ts"

import { ChatGPTModelBroker, CHATGPT_HOST, CHATGPT_SECRET, type ChatGPTBrokerOptions } from "./model-broker.ts"

const executeFile = promisify(execFile)
export type DockerCommand = (args: string[]) => Promise<{ stdout: string; stderr: string }>
export interface DockerRuntimeOptions { root: string; command?: string; execute?: DockerCommand; timeoutMs?: number; chatgpt?: ChatGPTBrokerOptions; supervisorPath?: string }
interface Intent {
  identity: RuntimeIdentity; request?: LaunchRequest; launchDigest?: Digest; containerName: string
  tombstoned: boolean; createDispatched: boolean; startDispatched: boolean; workspaceReady?: boolean
  observation?: RuntimeObservation; capture?: CaptureResult
}
interface Workspace { id: string; ownerTaskId: string; templateDigest: Digest; fence: number; intentId: string; captured: boolean }
interface Container {
  Id: string
  Config: { Labels?: Record<string, string> }
  State: { Status: string; Running: boolean; Restarting: boolean; Paused: boolean; Pid: number; ExitCode: number; FinishedAt: string; Error?: string }
}
interface RunnerCheckpoint {
  version: number; identity: RuntimeIdentity; taskSpecRef: RevisionRef; inputSnapshotDigest: Digest
  semanticReuseKey: Digest; templateDigest: Digest; completedSteps: NonNullable<CaptureResult["checkpoint"]>["completedSteps"]
  effectReceipts: NonNullable<CaptureResult["checkpoint"]>["effectReceipts"]; state: string; integrityDigest: Digest
}

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const launchDigest = (request: LaunchRequest) => { const { backendHandle, ...fixed } = clean(request); return digest(fixed) }
const key = (id: string) => digest(id).slice(7)
const equalIdentity = (a: RuntimeIdentity, b: RuntimeIdentity) => ["intentId", "attemptId", "workspaceId", "fence"].every(field => (a as any)[field] === (b as any)[field])
const failure = (error: unknown) => error instanceof Error ? error.message : String(error)

/**
 * Trusted host-side adapter. Its database and lifecycle gate are never mounted into a worker.
 * A durable single-use dispatch plus a revocable read-only boot permit fences delayed starts.
 */
export class DockerRuntimeBackend implements RuntimeBackend {
  readonly root: string
  private db: DatabaseSync
  private gate: DatabaseSync
  private execute: DockerCommand
  private queue: Promise<unknown> = Promise.resolve()
  private namespace: string
  private supervisorPath?: string
  private broker?: ChatGPTModelBroker

  constructor(options: DockerRuntimeOptions) {
    if (options.chatgpt) this.broker = new ChatGPTModelBroker(options.chatgpt)
    const supervisor = options.supervisorPath ?? process.env.TASK_AGENT_STEP_SUPERVISOR_PATH
    if (supervisor) {
      this.supervisorPath = realpathSync(supervisor)
      if (!lstatSync(this.supervisorPath).isFile()) throw new RuntimeError("invalid_contract", "Step supervisor must be an executable file")
    }
    mkdirSync(options.root, { recursive: true, mode: 0o700 })
    this.root = realpathSync(options.root)
    this.namespace = key(this.root).slice(0, 20)
    for (const folder of ["workspaces", "launches", "captures"]) mkdirSync(join(this.root, folder), { mode: 0o700, recursive: true })
    this.db = new DatabaseSync(join(this.root, "backend.sqlite"))
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS intents (id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
    this.gate = new DatabaseSync(join(this.root, "lifecycle-gate.sqlite"))
    this.gate.exec("PRAGMA busy_timeout=0; CREATE TABLE IF NOT EXISTS gate (id INTEGER PRIMARY KEY)")
    this.execute = options.execute ?? (async args => {
      try {
        const result = await executeFile(options.command ?? "docker", args, { encoding: "utf8", timeout: options.timeoutMs ?? 30000, maxBuffer: 8 * 1024 * 1024 })
        return { stdout: result.stdout, stderr: result.stderr }
      } catch (error: any) {
        throw new Error(String(error.stderr || error.message || error).slice(0, 3000))
      }
    })
  }

  close(): void { this.broker?.close(); this.db.close(); this.gate.close() }

  private async serialized<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      // A separate, empty database is used only as a cross-process lifecycle mutex.
      // Operational intents are committed to backend.sqlite before external calls.
      const deadline = Date.now() + 30000
      while (true) {
        try { this.gate.exec("BEGIN IMMEDIATE"); break }
        catch (error) {
          if (!/locked|busy/i.test(failure(error)) || Date.now() >= deadline) throw new RuntimeError("runtime_unavailable", `Backend lifecycle lock could not be acquired: ${failure(error)}`)
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
      try { const result = await operation(); this.gate.exec("COMMIT"); return result }
      catch (error) { this.gate.exec("ROLLBACK"); throw error }
    })
    this.queue = run.catch(() => undefined)
    return run
  }

  private load(id: string): Intent | undefined {
    const row = this.db.prepare("SELECT payload FROM intents WHERE id=?").get(id)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  private save(intent: Intent): void {
    this.db.prepare("INSERT INTO intents VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(intent.identity.intentId, JSON.stringify(intent))
  }
  private workspace(id: string): Workspace | undefined {
    const row = this.db.prepare("SELECT payload FROM workspaces WHERE id=?").get(id)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  private saveWorkspace(workspace: Workspace): void {
    this.db.prepare("INSERT INTO workspaces VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(workspace.id, JSON.stringify(workspace))
  }
  private workspacePath(id: string): string { return join(this.root, "workspaces", key(id)) }
  private launchPath(id: string): string { return join(this.root, "launches", key(id)) }

  private checkIdentity(identity: RuntimeIdentity): void {
    if (![identity.intentId, identity.attemptId, identity.workspaceId].every(value => typeof value === "string" && value.length > 0 && value.length <= 512) || !Number.isSafeInteger(identity.fence) || identity.fence < 1)
      throw new RuntimeError("invalid_contract", "Runtime identity requires nonempty IDs and a positive fence")
  }
  private requireIdentity(intent: Intent, identity: RuntimeIdentity): void {
    if (!equalIdentity(intent.identity, identity) || identity.backendHandle && intent.identity.backendHandle !== identity.backendHandle)
      throw new RuntimeError("stale_attempt", "Runtime identity or backend handle does not match the persisted intent")
  }

  private validate(request: LaunchRequest): void {
    this.checkIdentity(request)
    if (!/^(?:[^\s@]+@)?sha256:[a-f0-9]{64}$/.test(request.template.environment.image)) throw new RuntimeError("invalid_contract", "Docker images must be pinned by their complete sha256 digest")
    const modelAccess = this.modelAccess(request)
    if (modelAccess) {
      if (!this.broker || !request.task.design.steps.some(step => step.agent)) throw new RuntimeError("capability_unsupported", "ChatGPT model gateway must be configured explicitly for agent steps")
      this.broker.preflight()
    } else if (request.policy.network !== "none" || request.policy.allowedHosts.length || request.policy.secretRefs.length || request.policy.allowedEffects.length)
      throw new RuntimeError("capability_unsupported", "Only offline execution or the explicit ChatGPT inference policy is supported")
    if ([request.task, request.template, request.policy].some(value => revisionDigest(value) !== value.digest))
      throw new RuntimeError("invalid_contract", "Launch specification bytes do not match their declared immutable digests")
    const resources = request.policy.resources
    if (!Number.isFinite(resources.cpus) || resources.cpus <= 0 || ![resources.memoryBytes, resources.pids, resources.timeoutMs].every(value => Number.isSafeInteger(value) && value > 0))
      throw new RuntimeError("invalid_contract", "Finite positive resource limits are required")
    if (!sameRef(request.task.workspaceTemplateRef, request.template) || !sameRef(request.task.executionPolicyRef, request.policy) || !sameRef(request.inputSnapshot.taskSpecRef, request.task) || request.inputSnapshot.workspaceTemplateDigest !== request.template.digest || request.inputSnapshot.executionPolicyDigest !== request.policy.digest)
      throw new RuntimeError("invalid_contract", "Launch references do not match their pinned task, input, environment and policy")
    const ids = new Set<string>()
    for (const step of [...request.template.bootstrap, ...request.task.design.steps]) {
      if (!step.id || ids.has(step.id)) throw new RuntimeError("invalid_contract", "Bootstrap and task step IDs must be unique")
      ids.add(step.id)
      if (step.effectPolicy !== "replayable") throw new RuntimeError("capability_unsupported", "Receipt-dependent external effects are not supported by the initial runtime")
      if (!step.argv.length || step.argv.some(value => typeof value !== "string" || !value || value.includes("\0")) || !Number.isSafeInteger(step.timeoutMs) || step.timeoutMs < 1)
        throw new RuntimeError("invalid_contract", "A step needs valid argv and a finite timeout")
      for (const path of step.outputs) this.validateOutput(path)
      if (step.agent) {
        safeRelative(step.agent.sessionPath)
        if (step.agent.sessionPath.split("/")[0] === ".task-runtime") throw new RuntimeError("invalid_contract", "Agent sessions cannot overlap runner metadata")
        if (!step.agent.resumeArgv.length || step.agent.resumeArgv.some(value => typeof value !== "string" || value.includes("\0")) || !step.agent.resumeArgv[0])
          throw new RuntimeError("invalid_contract", "Agent resume requires an explicit argv")
        if ([...step.outputs, ...request.task.outputPorts.map(port => port.path)].some(path => path === step.agent!.sessionPath || path.startsWith(step.agent!.sessionPath + "/") || step.agent!.sessionPath.startsWith(path + "/")))
          throw new RuntimeError("invalid_contract", "Agent session storage cannot overlap declared outputs")
        if (request.template.bootstrap.includes(step)) throw new RuntimeError("capability_unsupported", "Agent invocations belong to task steps, not bootstrap")
      }
    }
    for (const port of request.task.outputPorts) this.validateOutput(port.path)
    if (request.readOnlyInputs.length !== request.task.inputPorts.length) throw new RuntimeError("invalid_contract", "Every declared input requires one read-only mount")
    for (const port of request.task.inputPorts) {
      const mounts = request.readOnlyInputs.filter(input => input.port === port.name)
      const binding = request.inputSnapshot.bindings.find(input => input.inputPort === port.name)
      if (mounts.length !== 1 || !binding || binding.contentDigest !== mounts[0]!.digest || port.mountPath !== `/inputs/${port.name}` || !/^[A-Za-z0-9_-]+$/.test(port.name))
        throw new RuntimeError("invalid_contract", "An input must bind its exact snapshot to /inputs/<port>")
      this.validateInputPath(mounts[0]!.hostPath, mounts[0]!.digest)
    }
    if (request.template.sourceSnapshots.length > 1 || request.template.sourceSnapshots.some(item => item.destination !== "."))
      throw new RuntimeError("capability_unsupported", "The initial backend supports one source snapshot at the workspace root")
    if (request.sourceSnapshotPath) {
      const source = request.template.sourceSnapshots[0]
      if (!source) throw new RuntimeError("invalid_contract", "A source path must be declared by the template")
      this.validateInputPath(request.sourceSnapshotPath, source.snapshot.digest)
    } else if (request.template.sourceSnapshots.length && !request.resumeCheckpoint) throw new RuntimeError("invalid_contract", "The template source snapshot is not materialized")
    if (request.resumeCheckpoint) {
      const checkpoint = request.resumeCheckpoint.manifest
      const { integrityDigest, ...body } = checkpoint
      if (digest(body) !== integrityDigest || checkpoint.templateDigest !== request.template.digest)
        throw new RuntimeError("checkpoint_invalid", "Checkpoint integrity or environment does not match")
      this.validateInputPath(request.resumeCheckpoint.snapshotPath, checkpoint.workspaceSnapshot.digest)
      if (checkpoint.effectReceipts.some(receipt => receipt.state !== "confirmed")) throw new RuntimeError("effect_unknown", "An unresolved external effect prevents automatic resume")
    }
  }

  private modelAccess(request: LaunchRequest): boolean {
    const p = request.policy
    return p.network === "restricted" && p.allowedHosts.length === 1 && p.allowedHosts[0] === CHATGPT_HOST && p.secretRefs.length === 1 && p.secretRefs[0] === CHATGPT_SECRET && p.allowedEffects.length === 1 && p.allowedEffects[0] === "model-inference"
  }
  private bridgePath(intent: Intent): string { return join(this.launchPath(intent.identity.intentId), "model-bridge") }
  private pumpModel(intent: Intent): void { if (intent.request && this.modelAccess(intent.request) && !intent.tombstoned) this.broker?.pump(this.bridgePath(intent)) }

  private validateOutput(path: string): void {
    safeRelative(path)
    if ([".task-runtime", ".home"].includes(path.split("/")[0]!)) throw new RuntimeError("invalid_contract", "Output paths cannot overlap runner metadata or session storage")
  }
  private validateInputPath(path: string, expected: Digest): void {
    const actual = realpathSync(path)
    if (within(actual, this.root) || within(this.root, actual)) throw new RuntimeError("invalid_contract", "Inputs cannot expose backend state or live workspaces")
    if (digest(scanTree(actual)) !== expected) throw new RuntimeError("checkpoint_invalid", "Pinned input bytes or metadata do not match their digest")
    if (actual.includes(",") || actual.includes("\n")) throw new RuntimeError("capability_unsupported", "Docker bind paths cannot contain comma or newline")
  }

  async ensureStarted(request: LaunchRequest): Promise<RuntimeObservation> {
    return this.serialized(async () => {
      this.checkIdentity(request)
      let intent = this.load(request.intentId)
      if (intent) {
        this.requireIdentity(intent, request)
        if (intent.launchDigest && intent.launchDigest !== launchDigest(request)) throw new RuntimeError("revision_conflict", "A start intent cannot be reused with different launch arguments")
        if (intent.tombstoned) return this.observeInternal(intent)
      } else {
        this.validate(request)
        const workspace = this.workspace(request.workspaceId)
        if (workspace && (!workspace.captured || workspace.ownerTaskId !== request.task.id || workspace.templateDigest !== request.template.digest || request.fence <= workspace.fence))
          throw new RuntimeError("stale_attempt", "Workspace is still held, has a different owner/environment, or requires a newer fence")
        intent = { identity: { intentId: request.intentId, attemptId: request.attemptId, workspaceId: request.workspaceId, fence: request.fence }, request: clean(request), launchDigest: launchDigest(request), containerName: `task-gf-${this.namespace}-${key(request.intentId).slice(0, 24)}`, tombstoned: false, createDispatched: false, startDispatched: false }
        this.db.exec("BEGIN IMMEDIATE")
        try {
          this.save(intent)
          this.saveWorkspace({ id: request.workspaceId, ownerTaskId: request.task.id, templateDigest: request.template.digest, fence: request.fence, intentId: request.intentId, captured: false })
          this.db.exec("COMMIT")
        } catch (error) { this.db.exec("ROLLBACK"); throw error }
      }
      if (intent.startDispatched) return this.observeInternal(intent)
      this.validate(intent.request!)
      this.prepareWorkspace(intent)
      let container: Container | undefined
      try { container = await this.inspect(intent) } catch (error) { return this.unknown(intent, failure(error)) }
      if (!container) {
        if (intent.createDispatched) return this.unknown(intent, "Creation was dispatched but no matching container can be confirmed")
        intent.createDispatched = true; this.save(intent)
        try { await this.execute(this.createArguments(intent)); container = await this.inspect(intent) }
        catch (error) { return this.unknown(intent, `Docker creation is unconfirmed: ${failure(error)}`) }
      }
      if (!container) return this.unknown(intent, "Docker creation returned without an observable container")
      this.bind(intent, container)
      intent.startDispatched = true; this.save(intent)
      try { await this.execute(["start", container.Id]) } catch (error) { return this.unknown(intent, `Start was dispatched once; observation is required: ${failure(error)}`) }
      return this.observeInternal(intent)
    })
  }

  private prepareWorkspace(intent: Intent): void {
    if (intent.workspaceReady) return
    const request = intent.request!, workspace = this.workspacePath(request.workspaceId)
    // No create command has been dispatched at this point. A partial preparation can be retried.
    if (intent.createDispatched) throw new RuntimeError("termination_unknown", "Cannot rewrite a workspace after creation dispatch")
    if (existsSync(workspace)) rmSync(workspace, { recursive: true, force: true })
    mkdirSync(workspace, { recursive: true, mode: 0o700 })
    const source = request.resumeCheckpoint?.snapshotPath ?? request.sourceSnapshotPath
    if (source) copyTree(source, workspace)
    const launch = this.launchPath(request.intentId)
    mkdirSync(launch, { recursive: true, mode: 0o755 })
    if (this.modelAccess(request)) for (const name of ["requests", "responses", "claims"]) mkdirSync(join(this.bridgePath(intent), name), { recursive: true, mode: 0o700 })
    atomicJson(join(launch, "permit.json"), { ...intent.identity, revoked: false })
    atomicJson(join(launch, "config.json"), {
      identity: intent.identity, taskSpecRef: ref(request.task), inputSnapshotDigest: request.inputSnapshot.provenanceDigest,
      semanticReuseKey: request.inputSnapshot.semanticReuseKey, templateDigest: request.template.digest,
      taskContext: { objective: request.task.objective, taskSpecRef: ref(request.task), inputs: request.task.inputPorts, outputs: request.task.outputPorts },
      steps: request.task.design.steps, bootstrap: request.template.bootstrap, timeoutMs: request.policy.resources.timeoutMs,
      resume: Boolean(request.resumeCheckpoint),
    })
    intent.workspaceReady = true; this.save(intent)
  }

  private createArguments(intent: Intent): string[] {
    const request = intent.request!, resources = request.policy.resources
    const uid = process.getuid?.() || 1000, gid = process.getgid?.() || 1000
    const mounts = [
      [this.workspacePath(request.workspaceId), "/workspace", false],
      [this.launchPath(request.intentId), "/launch", true],
      [fileURLToPath(new URL("./runner.mjs", import.meta.url)), "/runtime/runner.mjs", true],
      ...request.readOnlyInputs.map(input => [realpathSync(input.hostPath), `/inputs/${input.port}`, true]),
      [fileURLToPath(new URL("./codex-agent.mjs", import.meta.url)), "/runtime/codex-agent.mjs", true],
      [fileURLToPath(new URL("./model-bridge.mjs", import.meta.url)), "/runtime/model-bridge.mjs", true],
      ...(this.modelAccess(request) ? [[join(this.bridgePath(intent), "requests"), "/model-bridge/requests", false], [join(this.bridgePath(intent), "responses"), "/model-bridge/responses", true]] : []),
      ...(this.supervisorPath ? [[this.supervisorPath, "/runtime/task-step", true]] : []),
    ] as Array<[string, string, boolean]>
    if (mounts.some(([source]) => source.includes(",") || source.includes("\n"))) throw new RuntimeError("capability_unsupported", "Docker mount source has unsupported punctuation")
    return ["create", "--name", intent.containerName, "--init", "--user", `${uid}:${gid}`, "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--network", "none", "--restart", "no", "--no-healthcheck", "--cpus", String(resources.cpus), "--memory", String(resources.memoryBytes), "--memory-swap", String(resources.memoryBytes), "--pids-limit", String(resources.pids), "--stop-timeout", "10", "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=67108864", "--workdir", "/workspace", "--env", "HOME=/workspace/.home", ...(this.supervisorPath ? ["--env", "TASK_AGENT_STEP_SUPERVISOR=/runtime/task-step"] : []), ...(this.modelAccess(request) ? ["--env", "TASK_AGENT_MODEL_BRIDGE=/model-bridge"] : []), "--label", `task-agent.namespace=${this.namespace}`, "--label", `task-agent.intent=${request.intentId}`, "--label", `task-agent.attempt=${request.attemptId}`, "--label", `task-agent.fence=${request.fence}`, "--label", `task-agent.launch=${intent.launchDigest}`, ...mounts.flatMap(([source, target, readonly]) => ["--mount", `type=bind,src=${source},dst=${target}${readonly ? ",readonly" : ""}`]), "--entrypoint", "node", request.template.environment.image, "/runtime/runner.mjs", "/launch/config.json", "/workspace"]
  }

  private async inspect(intent: Intent): Promise<Container | undefined> {
    try {
      const response = await this.execute(["container", "inspect", intent.identity.backendHandle ?? intent.containerName])
      const parsed = JSON.parse(response.stdout)
      if (!Array.isArray(parsed) || parsed.length !== 1) throw new Error("Docker returned an invalid inspection response")
      const container = parsed[0] as Container
      this.bind(intent, container)
      return container
    } catch (error) {
      if (/No such (object|container)/i.test(failure(error))) return undefined
      throw error
    }
  }
  private bind(intent: Intent, container: Container): void {
    const labels = container.Config?.Labels
    if (!container.Id || labels?.["task-agent.namespace"] !== this.namespace || labels?.["task-agent.intent"] !== intent.identity.intentId || labels?.["task-agent.attempt"] !== intent.identity.attemptId || labels?.["task-agent.fence"] !== String(intent.identity.fence) || labels?.["task-agent.launch"] !== intent.launchDigest || intent.identity.backendHandle && intent.identity.backendHandle !== container.Id)
      throw new RuntimeError("stale_attempt", "Container ownership labels or immutable handle do not match")
    intent.identity.backendHandle = container.Id; this.save(intent)
  }
  private unknown(intent: Intent, diagnostic: string): RuntimeObservation {
    const observation: RuntimeObservation = { ...intent.identity, observed: "unknown", diagnostic }
    intent.observation = observation; this.save(intent); return observation
  }
  private revoked(intent: Intent): RuntimeObservation {
    const identity = { intentId: intent.identity.intentId, attemptId: intent.identity.attemptId, workspaceId: intent.identity.workspaceId, fence: intent.identity.fence }
    const observation: RuntimeObservation = { ...identity, observed: "stopped", stopReceipt: { ...identity, observationSource: `docker-backend:${this.namespace}`, stoppedAt: new Date().toISOString(), termination: { kind: "creation-revoked", tombstone: digest({ ...identity, revoked: true }) } } }
    intent.observation = observation; this.save(intent); return observation
  }
  private async observeInternal(intent: Intent): Promise<RuntimeObservation> {
    this.pumpModel(intent)
    // Recover a crash between committing the tombstone and revoking the boot permit.
    if (intent.tombstoned && intent.workspaceReady) atomicJson(join(this.launchPath(intent.identity.intentId), "permit.json"), { ...intent.identity, revoked: true })
    if (intent.tombstoned && !intent.startDispatched) return this.revoked(intent)
    if (!intent.createDispatched) return { ...intent.identity, observed: "queued" }
    let container: Container | undefined
    try { container = await this.inspect(intent) } catch (error) { return this.unknown(intent, failure(error)) }
    if (!container) return this.unknown(intent, "The dispatched container disappeared; its writers cannot be proven stopped")
    const state = container.State
    if (state.Running || state.Restarting || state.Paused || state.Pid > 0) {
      const observation: RuntimeObservation = { ...intent.identity, observed: intent.tombstoned ? "stopping" : "running" }
      intent.observation = observation; this.save(intent); return observation
    }
    if (state.Status !== "exited" && !(state.Status === "created" && intent.tombstoned)) return this.unknown(intent, `Docker state ${state.Status} does not prove termination`)
    const observation: RuntimeObservation = { ...intent.identity, observed: "stopped", exitCode: state.ExitCode, stopReceipt: {
      ...intent.identity, backendHandle: container.Id, observationSource: `docker-inspect:${this.namespace}`, stoppedAt: state.FinishedAt && !state.FinishedAt.startsWith("0001-") ? state.FinishedAt : new Date().toISOString(),
      termination: { kind: "all-writers-terminated", evidence: `Container ${container.Id}: status=${state.Status}, Running=false, Restarting=false, Paused=false, Pid=0; restart policy is no; boot permit ${intent.tombstoned ? "revoked" : "single-use dispatch consumed"}` },
    }, ...(intent.tombstoned ? {} : { outcome: state.ExitCode === 0 ? { kind: "success" as const } : { kind: "failure" as const, reason: state.Error || `Container exited with ${state.ExitCode}`, exitCode: state.ExitCode } }) }
    intent.observation = observation; this.save(intent); return observation
  }

  async observe(identity: RuntimeIdentity): Promise<RuntimeObservation> {
    return this.serialized(async () => {
      this.checkIdentity(identity)
      const intent = this.load(identity.intentId)
      if (!intent) return { ...identity, observed: "unknown", diagnostic: "No durable intent exists; absence is not termination evidence" }
      this.requireIdentity(intent, identity)
      return this.observeInternal(intent)
    })
  }

  async requestStop(request: StopRequest): Promise<RuntimeObservation> {
    return this.serialized(async () => {
      this.checkIdentity(request)
      let intent = this.load(request.intentId)
      if (!intent) {
        intent = { identity: { intentId: request.intentId, attemptId: request.attemptId, workspaceId: request.workspaceId, fence: request.fence }, containerName: `task-gf-${this.namespace}-${key(request.intentId).slice(0, 24)}`, tombstoned: true, createDispatched: false, startDispatched: false }
      } else this.requireIdentity(intent, request)
      intent.tombstoned = true; this.save(intent); this.broker?.stop(this.bridgePath(intent))
      if (intent.workspaceReady) atomicJson(join(this.launchPath(request.intentId), "permit.json"), { ...intent.identity, revoked: true })
      if (!intent.startDispatched) return this.revoked(intent)
      let container: Container | undefined
      try { container = await this.inspect(intent) } catch (error) { return this.unknown(intent, failure(error)) }
      if (!container) return this.unknown(intent, "Container is missing after a start dispatch; tombstone does not prove old writers terminated")
      if (container.State.Running || container.State.Paused || container.State.Restarting || container.State.Pid > 0) {
        try { await this.execute(["stop", "--time", "10", container.Id]) }
        catch (error) { return this.unknown(intent, `Stop request did not return a confirmed result: ${failure(error)}`) }
      }
      return this.observeInternal(intent)
    })
  }

  async captureStoppedWorkspace(receipt: StopReceipt): Promise<CaptureResult> {
    return this.serialized(async () => {
      const intent = this.load(receipt.intentId)
      if (!intent?.request || !intent.observation?.stopReceipt || !equalIdentity(intent.identity, receipt)) throw new RuntimeError("stale_attempt", "Capture requires an issued stop receipt for a known attempt")
      if (digest(intent.observation.stopReceipt) !== digest(receipt)) throw new RuntimeError("stale_attempt", "Stop receipt is not the backend's recorded observation")
      const held = this.workspace(receipt.workspaceId)
      if (!held || held.intentId !== receipt.intentId || held.fence !== receipt.fence) throw new RuntimeError("stale_attempt", "A newer writer owns this workspace")
      if (intent.capture) {
        for (const snapshot of [intent.capture.workspace, ...intent.capture.outputs.map(output => output.snapshot)]) if (digest(scanTree(snapshot.path)) !== snapshot.digest) throw new RuntimeError("checkpoint_invalid", "Captured staging changed after publication")
        return intent.capture
      }
      if (receipt.termination.kind !== "creation-revoked") {
        const observation = await this.observeInternal(intent)
        if (observation.observed !== "stopped" || !observation.stopReceipt) throw new RuntimeError("termination_unknown", "Writer stop could not be re-confirmed before capture")
      }
      const request = intent.request, workspace = this.workspacePath(receipt.workspaceId)
      const captureRoot = join(this.root, "captures", randomUUID())
      mkdirSync(captureRoot, { recursive: true, mode: 0o700 })
      const snapshot = capturePath(workspace, join(captureRoot, "workspace"))
      const outputs: CaptureResult["outputs"] = []
      for (const port of request.task.outputPorts) {
        const path = plainPath(workspace, port.path)
        if (existsSync(path)) outputs.push({ port: port.name, snapshot: capturePath(path, join(captureRoot, `output-${key(port.name)}`)) })
      }
      const checkpointPath = join(workspace, ".task-runtime", "checkpoint.json")
      let checkpoint: CaptureResult["checkpoint"]
      if (existsSync(checkpointPath)) {
        const saved = JSON.parse(readFileSync(checkpointPath, "utf8")) as RunnerCheckpoint
        const { integrityDigest, ...body } = saved
        if (digest(body) !== integrityDigest || !equalIdentity(saved.identity, intent.identity) || saved.taskSpecRef.digest !== request.task.digest || saved.templateDigest !== request.template.digest || saved.inputSnapshotDigest !== request.inputSnapshot.provenanceDigest)
          throw new RuntimeError("checkpoint_invalid", "Runner checkpoint metadata does not match the stopped attempt")
        const completedSteps = saved.completedSteps.filter(step => {
          const definition = request.task.design.steps.find(item => item.id === step.stepId)
          if (!definition || digest(definition) !== step.stepSpecDigest) return false
          try {
            const values = definition.outputs.map(path => {
              const absolute = plainPath(workspace, path), stat = lstatSync(absolute)
              return { path, mode: stat.mode & 0o777, content: stat.isDirectory() ? scanTree(absolute) : contentDigest(readFileSync(absolute)) }
            })
            return digest(values) === step.outputDigest
          } catch { return false }
        })
        checkpoint = { completedSteps, effectReceipts: saved.effectReceipts }
      }
      const result: CaptureResult = { identity: { ...intent.identity }, workspace: snapshot, outputs, ...(checkpoint ? { checkpoint } : {}) }
      intent.capture = result
      this.db.exec("BEGIN IMMEDIATE")
      try { this.save(intent); this.saveWorkspace({ ...held, captured: true }); this.db.exec("COMMIT") }
      catch (error) { this.db.exec("ROLLBACK"); throw error }
      return result
    })
  }
}
