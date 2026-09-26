import { chmodSync, closeSync, copyFileSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve, sep } from "node:path"
import { randomUUID } from "node:crypto"
import { contentDigest, digest } from "../contracts/canonical.ts"
import type { CapturedFile, CapturedSnapshot, ErrorCode } from "../contracts/model.ts"

export class RuntimeError extends Error {
  readonly code: ErrorCode
  constructor(code: ErrorCode, message: string) { super(message); this.name = "RuntimeError"; this.code = code }
}

export function atomicJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = `${path}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(value), { mode: 0o600, flag: "wx" })
  const fd = openSync(temporary, "r")
  try { fsyncSync(fd) } finally { closeSync(fd) }
  renameSync(temporary, path)
  const parent = openSync(dirname(path), "r")
  try { fsyncSync(parent) } finally { closeSync(parent) }
}

export function safeRelative(path: string): string {
  if (!path || path.includes("\\") || path.includes("\0") || path.startsWith("/") || path.split("/").some(part => !part || part === "." || part === ".."))
    throw new RuntimeError("invalid_contract", `Unsafe relative path: ${path}`)
  return path
}

export function plainPath(root: string, path: string): string {
  let current = root
  for (const part of safeRelative(path).split("/")) {
    current = join(current, part)
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new RuntimeError("capability_unsupported", "Symlinks are not supported by this snapshot adapter")
  }
  return current
}

export function within(path: string, root: string): boolean {
  const resolved = resolve(path), base = resolve(root)
  return resolved === base || resolved.startsWith(base + sep)
}

export function scanTree(root: string): CapturedFile[] {
  if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) throw new RuntimeError("checkpoint_invalid", "A snapshot root must be a plain directory")
  const files: CapturedFile[] = []
  const walk = (directory: string, prefix: string) => {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix ? `${prefix}/${name}` : name, absolute = join(directory, name), stat = lstatSync(absolute)
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) throw new RuntimeError("capability_unsupported", `Snapshot cannot contain a symlink or special file: ${path}`)
      files.push({ path, kind: stat.isDirectory() ? "directory" : "file", digest: contentDigest(stat.isDirectory() ? "" : readFileSync(absolute)), size: stat.isDirectory() ? 0 : stat.size, mode: stat.mode & 0o777 })
      if (stat.isDirectory()) walk(absolute, path)
    }
  }
  walk(root, "")
  return files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
}

export function copyTree(source: string, destination: string, expected = scanTree(source)): CapturedFile[] {
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  for (const entry of expected) {
    const from = plainPath(source, entry.path), target = plainPath(destination, entry.path)
    if (entry.kind === "directory") mkdirSync(target, { recursive: true, mode: 0o700 })
    else {
      mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
      copyFileSync(from, target)
      chmodSync(target, entry.mode)
    }
  }
  for (const entry of [...expected].reverse()) if (entry.kind === "directory") chmodSync(join(destination, entry.path), entry.mode)
  const copied = scanTree(destination)
  if (digest(copied) !== digest(expected)) throw new RuntimeError("checkpoint_invalid", "Snapshot changed during copy")
  return copied
}

/** Staging is private and immutable to task writers. The CAS seals its own independent copy. */
export function capturePath(source: string, destination: string): CapturedSnapshot {
  const stat = lstatSync(source)
  if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new RuntimeError("capability_unsupported", "Only plain files and directories can be captured")
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  if (stat.isDirectory()) copyTree(source, destination)
  else { copyFileSync(source, join(destination, basename(source))); chmodSync(join(destination, basename(source)), stat.mode & 0o777) }
  const files = scanTree(destination)
  for (const entry of files) {
    const fd = openSync(join(destination, entry.path), "r")
    try { fsyncSync(fd) } finally { closeSync(fd) }
  }
  const fd = openSync(destination, "r")
  try { fsyncSync(fd) } finally { closeSync(fd) }
  return { path: destination, digest: digest(files), files }
}
