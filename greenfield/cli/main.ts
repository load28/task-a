import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { setTimeout as delay } from "node:timers/promises"
import { parseGraphBundle } from "../contracts/validation.ts"
import { toAgentError, type ErrorContext } from "../contracts/errors.ts"
import { activeTasks, analyzeChange, resolveInputs, taskComplete, validateGraph } from "../kernel/index.ts"
import { FileArtifactStore } from "../artifacts/index.ts"
import { StateStore } from "../store/index.ts"
import { DockerRuntimeBackend } from "../runtime/docker.ts"
import { ValidationService } from "../validation/index.ts"
import { TaskAgent } from "../control/agent.ts"
import type { AgentState } from "../control/model.ts"
import { createExample, NODE24_AMD64_IMAGE, NODE24_ARM64_IMAGE } from "../examples/index.ts"
import { CommandProposalSource, GraphPlanner, JsonProposalSource } from "../planner/index.ts"

const usage = `Task Agent — contract-first isolated graph runtime

  example --out plan.json [--value 1] [--revision 1] [--image name@sha256:...]
  plan --objective TEXT --proposal input.json --out plan.json [--current current.json]
  plan --objective TEXT --command-argv argv.json --trusted-host-command --out plan.json
  validate <plan.json>
  impact <plan.json>
  apply <plan.json> [--operation ID] [--expected REV]
  run <graph> [--once] [--timeout-ms 60000]
  status <graph>
  suspend|resume|cancel|retry <graph> <task|all>
  events <graph> [--after SEQUENCE]
  import <file-or-directory>
  result <graph> <task> --out <empty-directory> [--port result]

All commands accept --state <directory>. No existing project runtime is used.
run advances persisted intent; suspend/resume control the actual isolated task.
plan validates a proposal and writes a file; apply activates it separately.
--command-argv must contain a JSON string array. It runs an explicitly trusted
host command with no shell, not an isolated task. Optional --command-cwd,
--timeout-ms and --max-bytes bound its location, duration and captured output.
`

const commands: Record<string, { operands: number; flags: string[] }> = {
  example: { operands: 0, flags: ["out", "value", "revision", "image", "graph", "a-offset", "a-revision", "a-delay-ms"] },
  plan: { operands: 0, flags: ["objective", "proposal", "command-argv", "trusted-host-command", "command-cwd", "current", "out", "timeout-ms", "max-bytes"] },
  validate: { operands: 1, flags: [] }, impact: { operands: 1, flags: [] },
  apply: { operands: 1, flags: ["operation", "expected"] }, run: { operands: 1, flags: ["once", "timeout-ms"] },
  status: { operands: 1, flags: [] }, events: { operands: 1, flags: ["after"] }, import: { operands: 1, flags: [] },
  result: { operands: 2, flags: ["out", "port"] },
  ...Object.fromEntries(["suspend", "resume", "cancel", "retry"].map(command => [command, { operands: 2, flags: ["operation"] }])),
}
const booleanFlags = new Set(["once", "help", "trusted-host-command"])
let errorContext: ErrorContext = { object: { kind: "cli-command", id: "arguments" } }
const inputError = (message: string) => Object.assign(new Error(message), { code: "invalid_contract" })

function argumentsFor(args: string[]) {
  const positionals: string[] = [], flags = new Map<string, string>()
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === "--") { positionals.push(...args.slice(i + 1)); break }
    if (!arg.startsWith("--")) { positionals.push(arg); continue }
    const name = arg.slice(2)
    if (flags.has(name)) throw inputError(`Duplicate flag: ${arg}`)
    if (booleanFlags.has(name)) { flags.set(name, "true"); continue }
    const next = args[++i]
    if (!next || next.startsWith("--")) throw inputError(`Missing value for ${arg}`)
    flags.set(name, next)
  }
  return { positionals, flags }
}
const print = (value: unknown) => process.stdout.write(JSON.stringify(value, null, 2) + "\n")
const writePlan = (path: string, bundle: unknown) => { const output = resolve(path); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(bundle, null, 2) + "\n"); return output }

async function main() {
  const { positionals, flags } = argumentsFor(process.argv.slice(2)), command = positionals[0]
  errorContext = { object: { kind: "cli-command", id: command ?? "arguments" } }
  if (!command && [...flags.keys()].some(key => key !== "help")) throw inputError("A command is required")
  if (!command || command === "help" || flags.has("help")) { process.stdout.write(usage); return }
  const definition = commands[command]
  if (!definition) throw inputError(`Unknown command: ${command}`)
  const allowed = new Set(["state", "help", ...definition.flags])
  for (const key of flags.keys()) if (!allowed.has(key)) throw inputError(`Unknown flag for ${command}: --${key}`)
  if (positionals.length !== definition.operands + 1) throw inputError(`${command} expects ${definition.operands} positional argument(s)`)
  const required = (index: number, label: string) => { const value = positionals[index]; if (!value) throw inputError(`Missing ${label}`); return value }
  const integer = (key: string, fallback: number, minimum = 0) => {
    const value = Number(flags.get(key) ?? fallback)
    if (!Number.isSafeInteger(value) || value < minimum) throw inputError(`--${key} must be an integer >= ${minimum}`)
    return value
  }
  const finite = (key: string, fallback: number) => {
    const value = Number(flags.get(key) ?? fallback)
    if (!Number.isFinite(value)) throw inputError(`--${key} must be finite`)
    return value
  }
  const loadPlan = (path: string) => { const bundle = parseGraphBundle(JSON.parse(readFileSync(path, "utf8"))); validateGraph(bundle); return bundle }
  if (command === "validate") {
    const bundle = loadPlan(required(1, "plan file"))
    print({ valid: true, graphId: bundle.graph.id, revision: bundle.graph.revision, tasks: activeTasks(bundle).length }); return
  }
  if (command === "plan") {
    const objective = flags.get("objective"), out = flags.get("out")
    if (!objective?.trim()) throw inputError("--objective is required")
    if (!out) throw inputError("--out is required")
    const proposalPath = flags.get("proposal"), argvPath = flags.get("command-argv")
    if (Boolean(proposalPath) === Boolean(argvPath)) throw inputError("Choose exactly one of --proposal or --command-argv")
    if (argvPath && !flags.has("trusted-host-command")) throw inputError("--command-argv requires --trusted-host-command")
    if (!argvPath && ["trusted-host-command", "command-cwd", "timeout-ms", "max-bytes"].some(key => flags.has(key))) throw inputError("Host command options require --command-argv")
    let source
    if (proposalPath) source = new JsonProposalSource(async () => readFileSync(proposalPath, "utf8"))
    else {
      const argv: unknown = JSON.parse(readFileSync(argvPath!, "utf8"))
      if (!Array.isArray(argv) || !argv.length || argv.some(value => typeof value !== "string" || value.includes("\0")) || !argv[0]?.trim()) throw inputError("--command-argv must contain a nonempty JSON string array")
      source = new CommandProposalSource({ argv, ...(flags.has("command-cwd") ? { cwd: resolve(flags.get("command-cwd")!) } : {}), timeoutMs: integer("timeout-ms", 30000, 1), maxBytes: integer("max-bytes", 8 * 1024 * 1024, 1) })
    }
    const planner = new GraphPlanner(source)
    const bundle = await planner.propose({ objective, ...(flags.has("current") ? { current: loadPlan(flags.get("current")!) } : {}) })
    print({ plan: writePlan(out, bundle), graphId: bundle.graph.id, revision: bundle.graph.revision, tasks: activeTasks(bundle).length }); return
  }
  // Reject malformed options before creating state directories or opening runtime resources.
  for (const key of ["expected", "after", "a-delay-ms"]) if (flags.has(key)) integer(key, 0)
  for (const key of ["revision", "a-revision", "timeout-ms"]) if (flags.has(key)) integer(key, 1, 1)
  for (const key of ["value", "a-offset"]) if (flags.has(key)) finite(key, 0)
  if (command === "result" && !flags.has("out")) throw inputError("--out is required")
  const stateDirectory = resolve(flags.get("state") ?? fileURLToPath(new URL("../.state", import.meta.url)))
  mkdirSync(stateDirectory, { recursive: true, mode: 0o700 })
  const artifacts = new FileArtifactStore(resolve(stateDirectory, "artifacts"))
  if (command === "example") {
    const image = flags.get("image") ?? (process.arch === "arm64" ? NODE24_ARM64_IMAGE : NODE24_AMD64_IMAGE)
    const bundle = createExample(artifacts, image, { value: finite("value", 1), revision: integer("revision", 1, 1),
      ...(flags.has("graph") ? { graphId: flags.get("graph")! } : {}),
      ...(flags.has("a-offset") ? { aOffset: finite("a-offset", 1) } : {}),
      ...(flags.has("a-revision") ? { aRevision: integer("a-revision", 1, 1) } : {}),
      ...(flags.has("a-delay-ms") ? { aDelayMs: integer("a-delay-ms", 0) } : {}) })
    const output = writePlan(flags.get("out") ?? "plan.json", bundle)
    print({ plan: output, graphId: bundle.graph.id, image }); return
  }
  if (command === "import") {
    const { lstatSync } = await import("node:fs")
    const input = resolve(required(1, "input path"))
    print((lstatSync(input).isDirectory() ? artifacts.ingestDirectory(input) : artifacts.ingestFile(input)).ref); return
  }
  const store = new StateStore<AgentState>(resolve(stateDirectory, "state.sqlite"))
  const backend = new DockerRuntimeBackend({ root: resolve(stateDirectory, "backend") })
  const agent = new TaskAgent({ store, artifacts, backend, validator: new ValidationService(backend, artifacts) })
  const overview = (graphId: string) => {
    const status = agent.get(graphId), state = status.value
    return { graphId, stateRevision: status.revision, graphRevision: state.bundle?.graph.revision, complete: status.complete,
      tasks: state.tasks.map(task => {
        const attempt = state.attempts.find(a => a.attemptId === task.lastAttemptId)
        const active = Boolean(state.bundle?.graph.taskSpecRefs.some(r => r.id === task.taskId))
        const waitingFor = active && state.bundle ? resolveInputs(state.bundle, task.taskId, state.results, state.artifacts, state.adoptions).reasons : ["Task is not in the active graph"]
        return { id: task.taskId, active, desired: task.desired, complete: active && state.bundle ? taskComplete(state.bundle, task.taskId, state.results) : false,
          ...(attempt ? { attemptId: attempt.attemptId, observed: attempt.observed, phase: attempt.phase, workspaceId: attempt.workspaceId } : {}),
          ...(task.error ? { error: toAgentError(task.error, { object: { kind: "task", id: task.taskId }, revision: state.bundle?.graph.taskSpecRefs.find(spec => spec.id === task.taskId)?.revision ?? null }) } : {}), waitingFor }
      }), pendingIntents: status.pendingIntents.map(i => ({ id: i.id, type: i.type, ...(i.error ? { error: toAgentError(i.error, { object: { kind: "intent", id: i.id }, revision: status.revision }) } : {}) })) }
  }
  try {
    if (command === "apply" || command === "impact") {
      const bundle = parseGraphBundle(JSON.parse(readFileSync(required(1, "plan file"), "utf8")))
      validateGraph(bundle)
      errorContext = { object: { kind: "graph", id: bundle.graph.id } }
      if (command === "impact") { print(analyzeChange(store.read(bundle.graph.id)?.value.bundle ?? undefined, bundle)); return }
      print(await agent.execute({ operationId: flags.get("operation") ?? randomUUID(), graphId: bundle.graph.id,
        expectedRevision: integer("expected", store.read(bundle.graph.id)?.revision ?? 0), payload: { kind: "activateGraph", bundle } })); return
    }
    const graphId = required(1, "graph ID")
    errorContext = { object: { kind: "graph", id: graphId }, revision: store.read(graphId)?.revision ?? null }
    if (command === "status") { print(overview(graphId)); return }
    if (command === "events") { agent.get(graphId); print(store.events(graphId, integer("after", 0))); return }
    if (command === "result") {
      const taskId = required(2, "task ID"), port = flags.get("port") ?? "result", state = agent.get(graphId).value
      const result = state.results.find(r => r.producer.nodeId === taskId && r.producer.port === port && r.validity === "valid")
      if (!result) throw new Error("No currently valid result")
      const artifact = state.artifacts.find(a => a.id === result.artifactRef.id && a.digest === result.artifactRef.digest)!
      const out = flags.get("out"); if (!out) throw inputError("--out is required")
      artifacts.restore(artifact.storage, resolve(out)); print({ output: resolve(out), artifactId: artifact.id, digest: artifact.contentDigest }); return
    }
    const taskCommands = { suspend: "requestSuspend", resume: "requestResume", cancel: "requestCancel", retry: "requestRun" } as const
    if (command in taskCommands) {
      const requested = required(2, "task ID or all"), state = agent.get(graphId)
      const activeIds = state.value.bundle ? activeTasks(state.value.bundle).map(task => task.id) : []
      const ids = requested === "all" ? activeIds : [requested]
      if (ids.some(id => !activeIds.includes(id))) throw Object.assign(new Error("Task is not in the active graph"), { code: "invalid_graph" })
      for (const taskId of ids) await agent.execute({ operationId: `${flags.get("operation") ?? randomUUID()}-${taskId}`, graphId,
        expectedRevision: store.read(graphId)!.revision, payload: { kind: taskCommands[command as keyof typeof taskCommands], taskId } })
      await agent.tick(graphId); print(overview(graphId)); return
    }
    if (command !== "run") throw inputError(`Unknown command: ${command}`)
    const deadline = Date.now() + integer("timeout-ms", 60_000, 1)
    let interrupted = false
    const stop = () => { interrupted = true }
    process.once("SIGINT", stop); process.once("SIGTERM", stop)
    try {
      do {
        const status = await agent.tick(graphId)
        if (flags.has("once") || status.complete || interrupted) { print(overview(graphId)); return }
        const active = status.value.attempts.some(a => a.phase !== "finished") || status.pendingIntents.length > 0
        const runnable = status.value.tasks.some(t => t.desired === "running" && status.value.bundle?.graph.taskSpecRefs.some(r => r.id === t.taskId)
          && !taskComplete(status.value.bundle, t.taskId, status.value.results)
          && resolveInputs(status.value.bundle, t.taskId, status.value.results, status.value.artifacts, status.value.adoptions).ready)
        if (!active && !runnable) { print(overview(graphId)); process.exitCode = 2; return }
        if (Date.now() >= deadline) { print(overview(graphId)); process.exitCode = 2; return }
        await delay(100)
      } while (!interrupted)
    } finally { process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop) }
  } finally { backend.close(); store.close() }
}

try { await main() } catch (error) { process.stderr.write(JSON.stringify({ error: toAgentError(error, errorContext) }) + "\n"); process.exitCode = 1 }
