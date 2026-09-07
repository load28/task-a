import { createHash, randomUUID } from "node:crypto"
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, openSync, fsyncSync, closeSync } from "node:fs"
import { dirname, join } from "node:path"
import type { InstanceSpec } from "./types.ts"

export interface StageCache { key: string; stageId: string; paths: Array<{ path: string; digest: string | null }> }
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex")
function plainPath(root: string, path: string) {
  let current = root
  for (const part of path.split("/")) {
    current = join(current, part)
    if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("Snapshot path contains a symlink")
  }
}
function flush(path: string) {
  if (lstatSync(path).isDirectory()) for (const name of readdirSync(path)) flush(join(path, name))
  const fd = openSync(path, "r")
  try { fsyncSync(fd) } finally { closeSync(fd) }
}
function tree(path: string): string | null {
  if (!existsSync(path)) return null
  const stat = lstatSync(path)
  if (stat.isSymbolicLink() || !stat.isFile() && !stat.isDirectory()) throw new Error("Reusable output cannot contain symlinks or special files")
  return hash([stat.mode & 0o777, stat.isDirectory() ? readdirSync(path).sort().map(name => [name, tree(join(path, name))]) : readFileSync(path).toString("base64")])
}
export function stageKey(spec: InstanceSpec, stage: InstanceSpec["stages"][number], completed: Record<string, string>) {
  const dependencies = stage.dependsOn ?? Object.keys(completed)
  return hash([spec.image, stage.command, stage.outputs ?? [], stage.inputDigest ?? spec.repository ?? null,
    dependencies.map(id => [id, completed[id] ?? "unavailable"])])
}
export function publishStage(directory: string, workspace: string, stage: InstanceSpec["stages"][number], key: string): StageCache | undefined {
  if (!stage.outputs?.length) return
  const root = join(directory, "stage-cache"), target = join(root, stage.id)
  mkdirSync(root, { recursive: true })
  if (existsSync(target)) return JSON.parse(readFileSync(join(target, "manifest.json"), "utf8"))
  const temp = join(root, `.staging-${randomUUID()}`)
  mkdirSync(temp)
  try {
    const paths = stage.outputs.map(path => { plainPath(workspace, path); return { path, digest: tree(join(workspace, path)) } })
    for (const { path, digest } of paths) if (digest !== null) {
      const destination = join(temp, "files", path)
      mkdirSync(dirname(destination), { recursive: true }); cpSync(join(workspace, path), destination, { recursive: true })
      if (tree(destination) !== digest) throw new Error("Output changed during checkpoint capture")
    }
    const manifest = { stageId: stage.id, key, paths }
    writeFileSync(join(temp, "manifest.json"), JSON.stringify(manifest))
    flush(temp)
    renameSync(temp, target)
    const fd = openSync(root, "r"); try { fsyncSync(fd) } finally { closeSync(fd) }
    return manifest
  } catch (error) { rmSync(temp, { recursive: true, force: true }); throw error }
}
export function importStage(sourceDirectory: string, workspace: string, stage: InstanceSpec["stages"][number], key: string): StageCache | undefined {
  if (!stage.outputs?.length || !stage.inputDigest) return
  const source = join(sourceDirectory, "stage-cache", stage.id), path = join(source, "manifest.json")
  if (!existsSync(path)) return
  const manifest = JSON.parse(readFileSync(path, "utf8")) as StageCache
  if (manifest.key !== key || manifest.stageId !== stage.id || JSON.stringify(manifest.paths.map(p => p.path)) !== JSON.stringify(stage.outputs)) return
  // Validate all snapshots before applying any change. A corrupt cache never becomes a cache hit.
  for (const entry of manifest.paths) {
    plainPath(sourceDirectory, `stage-cache/${stage.id}/files/${entry.path}`)
    if (tree(join(source, "files", entry.path)) !== entry.digest) throw new Error("Reusable snapshot digest mismatch")
  }
  for (const entry of manifest.paths) {
    let parent = workspace
    for (const segment of entry.path.split("/")) {
      parent = join(parent, segment)
      if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) throw new Error("Output destination contains a symlink")
    }
    const destination = join(workspace, entry.path)
    rmSync(destination, { recursive: true, force: true })
    if (entry.digest !== null) {
      mkdirSync(dirname(destination), { recursive: true }); cpSync(join(source, "files", entry.path), destination, { recursive: true })
      if (tree(destination) !== entry.digest) throw new Error("Copied snapshot digest mismatch")
    }
  }
  return manifest
}
export const stageResultKey = (manifest: StageCache | undefined, fallback: string) => manifest ? hash(manifest.paths) : fallback
