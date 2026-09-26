// Trusted container entry point. It deliberately has no graph, database, or backend credentials.
import { spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const canonical = value => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`
const contentDigest = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const digest = value => contentDigest(`task-agent/canonical-json-v1\0${canonical(value)}`)
const [configurationPath, workspace] = process.argv.slice(2)
const config = JSON.parse(readFileSync(configurationPath, "utf8"))
const permit = JSON.parse(readFileSync(join(dirname(configurationPath), "permit.json"), "utf8"))
if (permit.revoked || ["intentId", "attemptId", "fence"].some(key => permit[key] !== config.identity[key])) process.exit(125)

const metadata = join(workspace, ".task-runtime"), checkpointPath = join(metadata, "checkpoint.json")
const atomic = (path, value) => {
  const temporary = `${path}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(value), { mode: 0o600 })
  let fd = openSync(temporary, "r"); try { fsyncSync(fd) } finally { closeSync(fd) }
  renameSync(temporary, path)
  fd = openSync(dirname(path), "r"); try { fsyncSync(fd) } finally { closeSync(fd) }
}
const tree = root => {
  const entries = []
  const walk = (absolute, relative) => {
    const stat = lstatSync(absolute)
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new Error(`Unsupported snapshot entry: ${relative}`)
    if (relative) entries.push({ path: relative, kind: stat.isDirectory() ? "directory" : "file", digest: contentDigest(stat.isDirectory() ? "" : readFileSync(absolute)), size: stat.isDirectory() ? 0 : stat.size, mode: stat.mode & 0o777 })
    if (stat.isDirectory()) for (const name of readdirSync(absolute).sort()) walk(join(absolute, name), relative ? `${relative}/${name}` : name)
  }
  walk(root, "")
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
}
const outputDigest = step => digest(step.outputs.map(path => {
  let absolute = workspace
  for (const part of path.split("/")) { absolute = join(absolute, part); if (lstatSync(absolute).isSymbolicLink()) throw new Error("Output path is a symlink") }
  const stat = lstatSync(absolute)
  return { path, mode: stat.mode & 0o777, content: stat.isDirectory() ? tree(absolute) : contentDigest(readFileSync(absolute)) }
}))

let prior
if (existsSync(checkpointPath)) {
  prior = JSON.parse(readFileSync(checkpointPath, "utf8"))
  const { integrityDigest, ...body } = prior
  if (digest(body) !== integrityDigest) throw new Error("Checkpoint metadata integrity mismatch")
}
mkdirSync(metadata, { recursive: true, mode: 0o700 })
mkdirSync(join(workspace, ".home"), { recursive: true, mode: 0o700 })
const checkpoint = {
  version: 1, identity: config.identity, taskSpecRef: config.taskSpecRef,
  inputSnapshotDigest: config.inputSnapshotDigest, semanticReuseKey: config.semanticReuseKey,
  templateDigest: config.templateDigest, completedSteps: [], effectReceipts: [], state: "starting",
}
const save = () => atomic(checkpointPath, { ...checkpoint, integrityDigest: digest(checkpoint) })
let child, stopping = false, timedOut = false, force
const signalChild = name => { if (child?.pid) try { process.kill(-child.pid, name) } catch (error) { if (error.code !== "ESRCH") throw error } }
const stop = () => { if (stopping) return; stopping = true; signalChild("SIGTERM"); force = setTimeout(() => signalChild("SIGKILL"), 2000); force.unref() }
process.on("SIGTERM", stop); process.on("SIGINT", stop)
const deadline = setTimeout(() => { timedOut = true; stop() }, config.timeoutMs)
deadline.unref()
const execute = step => new Promise((done, reject) => {
  if (stopping) return done(143)
  child = spawn(step.argv[0], step.argv.slice(1), { cwd: workspace, detached: true, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, HOME: join(workspace, ".home"), TASK_RESUME_CHECKPOINT: checkpointPath } })
  let stepTimeout = false
  const timer = setTimeout(() => { stepTimeout = true; signalChild("SIGTERM"); setTimeout(() => signalChild("SIGKILL"), 2000).unref() }, step.timeoutMs)
  timer.unref()
  child.once("error", error => { clearTimeout(timer); child = undefined; reject(error) })
  child.once("exit", code => { clearTimeout(timer); child = undefined; done(stepTimeout ? 124 : code ?? 143) })
})
let exitCode = 0
try {
  const marker = join(metadata, "initialized.json")
  if (existsSync(marker)) {
    if (JSON.parse(readFileSync(marker, "utf8")).templateDigest !== config.templateDigest) throw new Error("Workspace template differs from its bootstrap marker")
  } else {
    for (const step of config.bootstrap) {
      const code = await execute(step)
      if (stopping || code !== 0) { exitCode = timedOut ? 124 : stopping ? 143 : code; throw new Error("Workspace bootstrap did not complete") }
    }
    atomic(marker, { templateDigest: config.templateDigest })
  }
  const compatible = config.resume && prior && prior.taskSpecRef.digest === config.taskSpecRef.digest && prior.semanticReuseKey === config.semanticReuseKey && prior.templateDigest === config.templateDigest
  for (const step of config.steps) {
    if (stopping) break
    const stepSpecDigest = digest(step), inputDigest = digest({ semanticReuseKey: config.semanticReuseKey, templateDigest: config.templateDigest, stepSpecDigest })
    const completed = compatible && prior.completedSteps.find(item => item.stepId === step.id && item.stepSpecDigest === stepSpecDigest && item.inputDigest === inputDigest)
    if (completed) {
      let matches = false
      try { matches = outputDigest(step) === completed.outputDigest } catch {}
      if (matches) { checkpoint.completedSteps.push(completed); save(); continue }
    }
    checkpoint.state = "running"; checkpoint.activeStepId = step.id; save()
    const code = await execute(step)
    if (stopping || code !== 0) { exitCode = timedOut ? 124 : stopping ? 143 : code; break }
    checkpoint.completedSteps.push({ stepId: step.id, stepSpecDigest, inputDigest, outputDigest: outputDigest(step) })
    delete checkpoint.activeStepId
    save()
  }
  if (stopping && !exitCode) exitCode = timedOut ? 124 : 143
  checkpoint.state = stopping && !timedOut ? "suspended" : exitCode ? "failed" : "completed"
} catch (error) {
  exitCode ||= 1
  checkpoint.state = stopping && !timedOut ? "suspended" : "failed"
  checkpoint.reason = String(error.message ?? error)
} finally {
  checkpoint.exitCode = exitCode
  save()
  clearTimeout(deadline); if (force) clearTimeout(force)
  process.off("SIGTERM", stop); process.off("SIGINT", stop)
}
process.exit(exitCode)
