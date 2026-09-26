import test, { type TestContext } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { digest, withDigest } from "../contracts/canonical.ts"
import type { GraphBundle } from "../contracts/model.ts"

const execute = promisify(execFile), entry = fileURLToPath(new URL("./main.ts", import.meta.url))
type Response = { code: number; stdout: string; stderr: string }
async function cli(...args: string[]): Promise<Response> {
  try { const value = await execute(process.execPath, [entry, ...args], { encoding: "utf8", timeout: 45000, maxBuffer: 8 * 1024 * 1024 }); return { code: 0, stdout: value.stdout, stderr: value.stderr } }
  catch (error: any) { return { code: typeof error.code === "number" ? error.code : -1, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? error.message) } }
}
function success(result: Response): any { assert.equal(result.code, 0, result.stderr); return JSON.parse(result.stdout) }
function rejected(result: Response, expected: RegExp): any {
  assert.equal(result.code, 1, result.stdout || result.stderr)
  const error = JSON.parse(result.stderr)
  assert.match(JSON.stringify(error), expected)
  assert.equal(typeof error.error.code, "string")
  assert.equal(typeof error.error.message, "string")
  assert.equal(typeof error.error.object?.id, "string")
  assert.ok(error.error.revision === null || Number.isSafeInteger(error.error.revision))
  assert.equal(typeof error.error.retryable, "boolean")
  assert.equal(typeof error.error.resultUsable, "boolean")
  return error
}
function writable(path: string): void {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) return
  chmodSync(path, stat.isDirectory() ? 0o700 : 0o600)
  if (stat.isDirectory()) for (const name of readdirSync(path)) writable(join(path, name))
}
function scratch(t: TestContext, cleanup = true) {
  const root = mkdtempSync(join(tmpdir(), "task-agent-cli-")), state = join(root, "state"), plan = join(root, "plan.json")
  if (cleanup) t.after(() => { writable(root); rmSync(root, { recursive: true, force: true }) })
  return { root, state, plan }
}
async function example(t: TestContext, graphId = "cli-example", cleanup = true) {
  const files = scratch(t, cleanup)
  const created = success(await cli("example", "--state", files.state, "--out", files.plan, "--graph", graphId))
  assert.equal(created.graphId, graphId)
  return { ...files, graphId }
}

test("CLI example, validate, apply, status, events and one scheduling pass work through subprocesses", async t => {
  const f = await example(t), validationState = join(f.root, "validation-only")
  assert.match((await cli("help")).stdout, /command-argv/)
  const checked = success(await cli("validate", f.plan, "--state", validationState))
  assert.equal(checked.valid, true); assert.equal(checked.tasks, 5); assert.equal(existsSync(validationState), false)
  const impact = success(await cli("impact", f.plan, "--state", f.state))
  assert.ok(impact.affectedTaskIds.includes("A"))
  const first = success(await cli("apply", f.plan, "--operation", "activate-one", "--expected", "0", "--state", f.state))
  const duplicate = success(await cli("apply", f.plan, "--operation", "activate-one", "--expected", "0", "--state", f.state))
  assert.deepEqual(duplicate, first)
  const status = success(await cli("status", f.graphId, "--state", f.state))
  assert.equal(status.complete, false); assert.equal(status.tasks.length, 5); assert.ok(status.tasks.every((task: any) => task.active))
  const events = success(await cli("events", f.graphId, "--state", f.state))
  assert.ok(events.length > 0)
  assert.deepEqual(success(await cli("events", f.graphId, "--after", String(events.at(-1).sequence), "--state", f.state)), [])
  const scheduled = success(await cli("run", f.graphId, "--once", "--state", f.state))
  assert.ok(scheduled.tasks.filter((task: any) => task.phase === "dispatch").length >= 2)
  rejected(await cli("result", f.graphId, "A", "--out", join(f.root, "output"), "--state", f.state), /No currently valid result/)
  assert.equal(existsSync(join(f.root, "output")), false)
})

test("CLI status keeps removed tasks visible without resolving them as active tasks", async t => {
  const f = await example(t, "removed-task")
  success(await cli("apply", f.plan, "--state", f.state))
  const original = JSON.parse(readFileSync(f.plan, "utf8")) as GraphBundle
  const removed = new Set(["D", "integration"])
  const changed: GraphBundle = { ...original, graph: withDigest({ ...original.graph, revision: 2, baseRevision: 1,
    taskSpecRefs: original.graph.taskSpecRefs.filter(task => !removed.has(task.id)),
    edges: original.graph.edges.filter(edge => edge.kind === "contains" ? !removed.has(edge.childId) : edge.kind === "consumes" ? !removed.has(edge.from.nodeId) && !removed.has(edge.to.nodeId) : !removed.has(edge.predecessor) && !removed.has(edge.successor)),
    groups: original.graph.groups.map(group => ({ ...group, requiredTaskIds: ["A", "B", "C"], requiredIntegrationIds: [] })),
  }) }
  const next = join(f.root, "next.json"); writeFileSync(next, JSON.stringify(changed))
  success(await cli("apply", next, "--state", f.state))
  const status = success(await cli("status", f.graphId, "--state", f.state))
  const d = status.tasks.find((task: any) => task.id === "D")
  assert.equal(d.active, false); assert.equal(d.complete, false); assert.equal(d.desired, "cancelled")
  assert.match(d.waitingFor.join(" "), /not in the active graph/)
  rejected(await cli("retry", f.graphId, "D", "--state", f.state), /not in the active graph/)
})

test("CLI import preserves literal file paths and returns a reusable tree reference", async t => {
  const f = scratch(t), input = join(f.root, "한글 input.json")
  writeFileSync(input, '{"value":42}')
  const file = success(await cli("import", input, "--state", f.state))
  assert.match(file.uri, /^tree:sha256:/); assert.equal(file.size, 12)
  const folder = join(f.root, "folder"); mkdirSync(join(folder, "empty"), { recursive: true }); writeFileSync(join(folder, "text"), "data")
  const directory = success(await cli("import", folder, "--state", f.state))
  assert.match(directory.uri, /^tree:sha256:/); assert.equal(directory.size, 4)
})

test("CLI rejects malformed, unknown, duplicate and command-incompatible flags as structured errors", async t => {
  const f = scratch(t), untouched = join(f.root, "must-not-exist")
  const invalid: Array<[string[], RegExp]> = [
    [["unknown", "--state", untouched], /Unknown command/],
    [["--bogus", "x"], /command is required/],
    [["example", "--bogus", "x", "--state", untouched], /Unknown flag/],
    [["example", "--out", "one", "--out", "two", "--state", untouched], /Duplicate flag/],
    [["example", "--value", "NaN", "--state", untouched], /finite/],
    [["example", "--revision", "0", "--state", untouched], /integer/],
    [["run", "graph", "--once", "false", "--state", untouched], /positional/],
    [["run", "graph", "--timeout-ms", "0", "--state", untouched], /integer/],
    [["events", "graph", "--after", "-1", "--state", untouched], /integer/],
    [["result", "graph", "task", "--state", untouched], /--out is required/],
    [["example", "--state"], /Missing value/],
    [["validate"], /positional/],
  ]
  for (const [args, message] of invalid) assert.equal(rejected(await cli(...args), message).error.code, "invalid_contract")
  assert.equal(existsSync(untouched), false)
})

test("CLI planner validates JSON proposals and exact current revisions without activating them", async t => {
  const f = await example(t, "json-planner"), output = join(f.root, "proposal.json"), separateState = join(f.root, "planner-only")
  const planned = success(await cli("plan", "--objective", "계약부터 작업 분해", "--proposal", f.plan, "--out", output, "--state", separateState))
  assert.equal(planned.revision, 1); assert.equal(existsSync(separateState), false)
  const bundle = JSON.parse(readFileSync(f.plan, "utf8")) as GraphBundle
  const next = { ...bundle, graph: withDigest({ ...bundle.graph, revision: 2, baseRevision: 1 }) }
  const nextFile = join(f.root, "next.json"); writeFileSync(nextFile, JSON.stringify(next))
  const updated = success(await cli("plan", "--objective", "다음 개정", "--proposal", nextFile, "--current", f.plan, "--out", output))
  assert.equal(updated.revision, 2)
  rejected(await cli("plan", "--objective", "오래된 개정", "--proposal", f.plan, "--current", f.plan, "--out", output), /exact current/)
})

test("CLI planner executes only explicit trusted JSON argv and does not interpolate shell syntax", async t => {
  const f = await example(t, "command-planner"), argvFile = join(f.root, "argv.json"), marker = join(f.root, "executed"), output = join(f.root, "proposal.json")
  const literal = "literal $(touch SHOULD_NOT_EXIST) `exit 8` 한글"
  const script = `const fs=require('fs'),assert=require('assert/strict');assert.equal(process.argv[1],${JSON.stringify(literal)});let input='';process.stdin.on('data',x=>input+=x);process.stdin.on('end',()=>{assert.equal(JSON.parse(input).objective,${JSON.stringify(literal)});fs.writeFileSync(${JSON.stringify(marker)},'yes');process.stdout.write(fs.readFileSync(${JSON.stringify(f.plan)},'utf8'))})`
  writeFileSync(argvFile, JSON.stringify([process.execPath, "-e", script, literal]))
  rejected(await cli("plan", "--objective", literal, "--command-argv", argvFile, "--out", output), /requires --trusted-host-command/)
  assert.equal(existsSync(marker), false)
  const planned = success(await cli("plan", "--objective", literal, "--command-argv", argvFile, "--trusted-host-command", "--command-cwd", f.root, "--out", output))
  assert.equal(planned.graphId, "command-planner"); assert.equal(readFileSync(marker, "utf8"), "yes"); assert.equal(existsSync(join(f.root, "SHOULD_NOT_EXIST")), false)
  writeFileSync(argvFile, JSON.stringify("node -e unsafe"))
  rejected(await cli("plan", "--objective", "bad argv", "--command-argv", argvFile, "--trusted-host-command", "--out", output), /JSON string array/)
  writeFileSync(argvFile, JSON.stringify([process.execPath, "-e", "setInterval(()=>{},1000)"]))
  rejected(await cli("plan", "--objective", "bounded command", "--command-argv", argvFile, "--trusted-host-command", "--timeout-ms", "30", "--out", output), /deadline/)
})

test("CLI actual Docker run publishes a verified result that result exports without overwriting files", { skip: process.env.TASK_AGENT_DOCKER_TEST !== "1", timeout: 60000 }, async t => {
  const f = await example(t, "cli-docker", false)
  t.after(async () => {
    if (existsSync(join(f.state, "backend"))) {
      const namespace = digest(realpathSync(join(f.state, "backend"))).slice(7, 27)
      const listed = await execute("docker", ["ps", "-aq", "--filter", `label=task-agent.namespace=${namespace}`], { encoding: "utf8" })
      for (const id of listed.stdout.trim().split(/\s+/).filter(Boolean)) {
        const checked = JSON.parse((await execute("docker", ["inspect", id], { encoding: "utf8" })).stdout)[0]
        assert.equal(checked.Config.Labels["task-agent.namespace"], namespace)
        await execute("docker", ["rm", "-f", id])
      }
    }
    writable(f.root); rmSync(f.root, { recursive: true, force: true })
  })
  success(await cli("apply", f.plan, "--state", f.state))
  const status = success(await cli("run", f.graphId, "--state", f.state, "--timeout-ms", "30000"))
  assert.equal(status.complete, true); assert.ok(status.tasks.every((task: any) => task.complete))
  const out = join(f.root, "result"), exported = success(await cli("result", f.graphId, "integration", "--out", out, "--state", f.state))
  assert.match(exported.digest, /^sha256:/)
  assert.equal(JSON.parse(readFileSync(join(out, "data.json"), "utf8")).value, 105)
  writeFileSync(join(out, "keep"), "preserve")
  rejected(await cli("result", f.graphId, "integration", "--out", out, "--state", f.state), /Refusing to overwrite/)
  assert.equal(readFileSync(join(out, "keep"), "utf8"), "preserve")
})
