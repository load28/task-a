import { DatabaseSync } from "node:sqlite"
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, lstatSync, writeFileSync, renameSync } from "node:fs"
import { resolve, relative, dirname } from "node:path"
import { spawn } from "node:child_process"
import { loadConfig, type HostConfig } from "./config.ts"
import { callService } from "./service.ts"
import { refreshHostBindings } from "./install.ts"
import { verifyHostBindings } from "./verify-bindings.ts"
import { ensureService } from "./launcher.ts"

export function sourceRevision(root: string): string {
  const hash = createHash("sha256")
  const visit = (path: string) => {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) throw new Error(`Release source must not contain symlinks: ${path}`)
    if (stat.isDirectory()) for (const name of readdirSync(path).sort()) visit(resolve(path, name))
    else hash.update(relative(root, path)).update("\0").update(readFileSync(path)).update("\0")
  }
  for (const name of ["apps", "packages", "scripts", "deploy/kubernetes", "package.json", "package-lock.json"]) visit(resolve(root, name))
  return hash.digest("hex").slice(0, 16)
}
export type Command = (command: string, args: string[]) => Promise<string>
export function runner(root: string): Command {
  return (command, args) => new Promise((done, fail) => {
    const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "inherit"] })
    let output = ""
    child.stdout.on("data", chunk => { output += chunk; process.stdout.write(chunk) })
    child.on("error", fail)
    child.on("exit", code => code === 0 ? done(output) : fail(new Error(`${command} failed (${code})`)))
  })
}
/** Build and validate before changing live configuration. Immutable tags include dirty source. */
export async function prepareLocalRelease(root: string, config: HostConfig, run: Command) {
  const revision = sourceRevision(root)
  await run("npm", ["run", "check"])
  const k = config.kubernetes
  if (!k) return { revision }
  if (!k.context?.startsWith("kind-")) throw new Error("host:reload supports an explicitly configured local kind context")
  const cluster = k.context.slice(5)
  const controllerImage = `task-agent-instances:dev-${revision}`
  const workerImage = `task-agent-worker:dev-${revision}`
  await run("kubectl", ["--context", k.context, "--namespace", k.namespace, "get", "deployment", "--request-timeout=10s"])
  const releases = JSON.parse(await run("helm", ["list", "--kube-context", k.context, "--namespace", k.namespace, "--output", "json"])) as Array<{ name: string; chart: string }>
  const matches = releases.filter(r => r.chart.startsWith("task-instances-"))
  if (matches.length !== 1) throw new Error("Exactly one existing task-instances Helm release is required")
  await run("docker", ["build", "-f", "deploy/kubernetes/Dockerfile", "-t", controllerImage, "."])
  await run("docker", ["build", "-f", "deploy/kubernetes/Dockerfile.worker", "--build-arg", `INSTANCE_IMAGE=${controllerImage}`, "-t", workerImage, "."])
  if (sourceRevision(root) !== revision) throw new Error("Source changed during build; rerun host:reload before deploying")
  await run("kind", ["load", "docker-image", controllerImage, workerImage, "--name", cluster])
  await run("kubectl", ["--context", k.context, "apply", "-f", "deploy/kubernetes/chart/crds", "--request-timeout=30s"])
  await run("helm", ["upgrade", matches[0]!.name, "deploy/kubernetes/chart", "--kube-context", k.context, "--namespace", k.namespace,
    "--reuse-values", "--set-string", `image=${controllerImage}`, "--wait", "--atomic", "--timeout", "120s"])
  return { revision, workerImage, controllerImage }
}

/** A reset during shutdown is not completion; wait until the old listener disappears. */
export async function stopHost(socket: string, call: typeof callService = callService) {
  try { await call(socket, "/shutdown", {}, 1000) }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ECONNRESET") throw error }
  const deadline = Date.now() + 30000
  while (true) {
    try { await call(socket, "/health", undefined, 500) }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (["ENOENT", "ECONNREFUSED"].includes(code ?? "")) return
      if (code !== "ECONNRESET") throw error
    }
    if (Date.now() >= deadline) throw new Error("Old host service did not stop; reload is incomplete")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

export async function reloadLocal(root: string, configPath: string) {
  const config = loadConfig(configPath)
  const lock = new DatabaseSync(resolve(config.directory, "local-reload.db"))
  try { lock.exec("BEGIN IMMEDIATE") }
  catch { lock.close(); throw new Error("Another local reload is already running") }
  try {
    const release = await prepareLocalRelease(root, config, runner(root))
    if (sourceRevision(root) !== release.revision) throw new Error("Source changed during deployment; rerun host:reload")
    // Re-read to preserve unrelated setting changes made during the build.
    const latest = loadConfig(configPath)
    if (JSON.stringify(latest.kubernetes) !== JSON.stringify(config.kubernetes)) throw new Error("Kubernetes settings changed during reload; rerun")
    if (release.workerImage && latest.kubernetes) latest.kubernetes.image = release.workerImage
    const temporary = `${configPath}.reload-${process.pid}`
    writeFileSync(temporary, JSON.stringify(latest, null, 2) + "\n", { mode: 0o600 })
    renameSync(temporary, configPath)
    let prior: any
    try { prior = await callService(latest.socket, "/health", undefined, 1000) } catch (error) {
      if (!["ENOENT", "ECONNREFUSED"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error
    }
    if (prior) await stopHost(latest.socket)
    await ensureService(configPath, latest)
    const health = await callService(latest.socket, "/health", undefined, 5000) as any
    if (!health.ok || health.pid === prior?.pid) throw new Error("New host process was not confirmed")
    const home = dirname(latest.directory)
    const hosts = refreshHostBindings(home, configPath)
    const verifiedHosts = await verifyHostBindings(home, hosts)
    const receipt = { ...release, hostPid: health.pid, verifiedHosts, appliedAt: new Date().toISOString() }
    writeFileSync(resolve(config.directory, "local-release.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 })
    return receipt
  } finally { lock.exec("ROLLBACK"); lock.close() }
}
