import { createHash } from "node:crypto"
import { createReadStream, mkdirSync, existsSync, readFileSync, readdirSync, renameSync, openSync, fsyncSync, closeSync, rmSync } from "node:fs"
import { resolve, join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
const execute = promisify(execFile)
export interface WorkspaceArchive { version: 1; instanceId: string; run: number; file: string; sha256: string }
const folder = (root: string, uid: string) => join(root, createHash("sha256").update(uid).digest("hex"))
async function digest(path: string) {
  const hash = createHash("sha256")
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest("hex")
}
function sync(path: string) { const fd = openSync(path, "r"); try { fsyncSync(fd) } finally { closeSync(fd) } }
export async function saveWorkspace(directory: string, archiveRoot: string, instanceId: string, run: number): Promise<WorkspaceArchive> {
  if (process.platform === "linux" && process.pid === 1) {
    // A background process can still write after its launching shell exited.
    // Keep the execution volume instead of claiming a consistent snapshot.
    const active = readdirSync("/proc").filter(name => /^\d+$/.test(name) && name !== "1").filter(name => {
      try { return !/^State:\s+Z/m.test(readFileSync(`/proc/${name}/status`, "utf8")) } catch { return false }
    })
    if (active.length) throw new Error("Background processes remain; workspace retained until execution is quiescent")
  }
  const target = folder(archiveRoot, instanceId)
  mkdirSync(target, { recursive: true, mode: 0o700 })
  const file = `run-${run}.tar.gz`, archivePath = join(target, file), temp = `${archivePath}.tmp`
  // The archive store is a separate mount outside the disposable execution volume.
  await execute("tar", ["-czf", temp, "-C", directory, "."])
  sync(temp)
  const manifest: WorkspaceArchive = { version: 1, instanceId, run, file, sha256: await digest(temp) }
  renameSync(temp, archivePath); sync(target)
  const { writeFileSync } = await import("node:fs")
  const manifestPath = join(target, `run-${run}.json`)
  writeFileSync(manifestPath + ".tmp", JSON.stringify(manifest), { mode: 0o600 })
  sync(manifestPath + ".tmp"); renameSync(manifestPath + ".tmp", manifestPath); sync(target)
  return manifest
}
export async function restoreWorkspace(directory: string, archiveRoot: string, expected: WorkspaceArchive) {
  if (expected.version !== 1 || !Number.isInteger(expected.run) || expected.run < 1 || expected.file !== `run-${expected.run}.tar.gz` || !/^[a-f0-9]{64}$/.test(expected.sha256)) throw new Error("Invalid workspace archive identity")
  const target = folder(archiveRoot, expected.instanceId)
  const manifest = JSON.parse(readFileSync(join(target, `run-${expected.run}.json`), "utf8"))
  if (["version", "instanceId", "run", "file", "sha256"].some(key => manifest[key] !== (expected as any)[key])) throw new Error("Workspace archive manifest changed")
  const archivePath = join(target, expected.file)
  if (await digest(archivePath) !== expected.sha256) throw new Error("Workspace archive checksum mismatch; do not restore")
  // A restore marker is written by the caller only after full extraction. On an
  // interrupted extraction, retry starts from the verified archive, not partial data.
  const entries = (await execute("tar", ["-tzf", archivePath], { maxBuffer: 64 * 1024 * 1024 })).stdout.split("\n").filter(Boolean)
  if (entries.some(p => p.startsWith("/") || p.split("/").includes(".."))) throw new Error("Unsafe workspace archive path")
  mkdirSync(directory, { recursive: true })
  const { readdirSync } = await import("node:fs")
  for (const entry of readdirSync(directory)) if (entry !== "lost+found") rmSync(resolve(directory, entry), { recursive: true, force: true })
  const staging = join(directory, ".restore-staging")
  mkdirSync(staging)
  await execute("tar", ["-xzf", archivePath, "--no-same-owner", "-C", staging])
  for (const entry of readdirSync(staging)) renameSync(join(staging, entry), join(directory, entry))
  rmSync(staging, { recursive: true })
}
export function hasArchive(root: string, uid: string, run: number) { return existsSync(join(folder(root, uid), `run-${run}.json`)) }
