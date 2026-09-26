import { constants, chmodSync, closeSync, copyFileSync, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve, sep } from "node:path"
import { canonical, contentDigest, digest, DIGEST_PATTERN } from "../contracts/canonical.ts"
import type { ArtifactStore, BlobRef, CapturedFile, CapturedSnapshot, Digest } from "../contracts/model.ts"

function syncDirectory(path: string) { const fd = openSync(path, "r"); try { fsyncSync(fd) } finally { closeSync(fd) } }
function writeDurable(path: string, bytes: Uint8Array | string) {
  const fd = openSync(path, "wx", 0o600)
  try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
}
const compare = (a: { path: string }, b: { path: string }) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0

export function safePath(path: string) {
  if (!path || path.includes("\0") || path.includes("\\") || path.startsWith("/") || path.split("/").some(x => !x || x === "." || x === ".."))
    throw new Error("Invalid relative snapshot path")
  return path
}

/** Tree identity includes directories and executable bits; links and special files are rejected. */
export function inspectTree(root: string): CapturedFile[] {
  if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) throw new Error("Snapshot root must be a directory")
  const entries: CapturedFile[] = []
  const walk = (directory: string, prefix: string) => {
    for (const name of readdirSync(directory).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name
      safePath(relative)
      const path = join(directory, name), stat = lstatSync(path)
      if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new Error(`Unsupported snapshot entry: ${relative}`)
      entries.push({ path: relative, kind: stat.isDirectory() ? "directory" : "file", mode: stat.mode & 0o777,
        digest: contentDigest(stat.isDirectory() ? "" : readFileSync(path)), size: stat.isDirectory() ? 0 : stat.size })
      if (stat.isDirectory()) walk(path, relative)
    }
  }
  walk(root, "")
  return entries.sort(compare)
}

export interface StoredTree { ref: BlobRef; files: CapturedFile[]; path: string }

/** State/runner processes never receive write access to another task's CAS tree. */
export class FileArtifactStore implements ArtifactStore {
  readonly root: string
  constructor(root: string) {
    this.root = resolve(root)
    for (const dir of ["blobs", "trees", "mounts", "staging"]) mkdirSync(join(this.root, dir), { recursive: true, mode: 0o700 })
  }
  private key(value: Digest) { if (!DIGEST_PATTERN.test(value)) throw new Error("Invalid content digest"); return value.slice(7) }
  private blobPath(ref: BlobRef) {
    if (ref.uri !== `blob:${ref.digest}`) throw new Error("Unknown blob URI")
    return join(this.root, "blobs", this.key(ref.digest))
  }
  async put(bytes: Uint8Array): Promise<BlobRef> {
    const hash = contentDigest(bytes), path = join(this.root, "blobs", this.key(hash))
    if (existsSync(path)) {
      if (contentDigest(readFileSync(path)) !== hash) throw new Error("Corrupted existing blob")
    } else {
      const dir = mkdtempSync(join(this.root, "staging", "blob-")), staging = join(dir, "data")
      try {
        writeDurable(staging, bytes)
        try { linkSync(staging, path) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error }
        if (contentDigest(readFileSync(path)) !== hash) throw new Error("Blob publication conflict")
        chmodSync(path, 0o444); syncDirectory(dirname(path))
      } finally { rmSync(dir, { recursive: true, force: true }) }
    }
    return { uri: `blob:${hash}`, digest: hash, size: bytes.length }
  }
  async get(ref: BlobRef): Promise<Uint8Array> {
    const bytes = readFileSync(this.blobPath(ref))
    if (contentDigest(bytes) !== ref.digest || bytes.length !== ref.size) throw new Error("Blob integrity mismatch")
    return bytes
  }
  async verify(ref: BlobRef): Promise<boolean> {
    return this.verifySync(ref)
  }
  verifySync(ref: BlobRef): boolean {
    try {
      if (ref.uri.startsWith("tree:")) this.tree(ref)
      else {
        const bytes = readFileSync(this.blobPath(ref))
        if (contentDigest(bytes) !== ref.digest || bytes.length !== ref.size) return false
      }
      return true
    } catch { return false }
  }
  private treeRoot(ref: BlobRef) {
    if (ref.uri !== `tree:${ref.digest}`) throw new Error("Unknown tree URI")
    return join(this.root, "trees", this.key(ref.digest))
  }
  tree(ref: BlobRef): StoredTree {
    const root = this.treeRoot(ref), files = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as CapturedFile[]
    if (digest(files) !== ref.digest) throw new Error("Tree manifest integrity mismatch")
    const seen = new Set<string>(); let size = 0
    for (const file of files) {
      safePath(file.path)
      if (seen.has(file.path)) throw new Error("Duplicate tree entry")
      seen.add(file.path)
      const path = join(root, "content", file.path), stat = lstatSync(path)
      // Published files are sealed read-only. Their original permission metadata remains in the manifest.
      if (stat.isSymbolicLink() || (file.kind === "directory" ? !stat.isDirectory() : !stat.isFile())) throw new Error("Tree entry type mismatch")
      if (file.kind === "file") {
        if (stat.size !== file.size || contentDigest(readFileSync(path)) !== file.digest) throw new Error("Tree content integrity mismatch")
        size += file.size
      }
    }
    const actual = inspectTree(join(root, "content")).map(f => f.path)
    if (canonical(actual) !== canonical(files.map(f => f.path))) throw new Error("Unexpected tree entries")
    if (size !== ref.size) throw new Error("Tree size mismatch")
    return { ref, files, path: join(root, "content") }
  }

  /** Call only on a stopped/capture-held workspace, never on a live writer. */
  ingestDirectory(path: string, expectedDigest?: Digest): StoredTree {
    const source = resolve(path), files = inspectTree(source), hash = digest(files)
    if (expectedDigest && hash !== expectedDigest) throw new Error("Captured snapshot digest mismatch")
    const size = files.reduce((n, f) => n + f.size, 0), ref: BlobRef = { uri: `tree:${hash}`, digest: hash, size }
    const target = this.treeRoot(ref)
    if (existsSync(target)) return this.tree(ref)
    const staging = mkdtempSync(join(this.root, "staging", "tree-")), content = join(staging, "content")
    mkdirSync(content)
    try {
      for (const file of files) {
        const destination = join(content, file.path)
        if (file.kind === "directory") mkdirSync(destination, { recursive: true })
        else { mkdirSync(dirname(destination), { recursive: true }); copyFileSync(join(source, file.path), destination, constants.COPYFILE_EXCL) }
        chmodSync(destination, file.kind === "directory" ? file.mode | 0o700 : file.mode)
      }
      for (const file of [...files].reverse().filter(f => f.kind === "directory")) chmodSync(join(content, file.path), file.mode)
      if (digest(inspectTree(content)) !== hash || digest(inspectTree(source)) !== hash) throw new Error("Snapshot changed during capture")
      writeDurable(join(staging, "manifest.json"), canonical(files))
      for (const file of files.filter(f => f.kind === "file")) {
        const destination = join(content, file.path), fd = openSync(destination, "r")
        try { fsyncSync(fd) } finally { closeSync(fd) }
        chmodSync(destination, (file.mode & 0o555) | 0o444)
      }
      for (const file of [...files].reverse().filter(f => f.kind === "directory")) { syncDirectory(join(content, file.path)); chmodSync(join(content, file.path), 0o555) }
      chmodSync(content, 0o555); syncDirectory(staging)
      try { renameSync(staging, target) } catch (error) {
        if (!["EEXIST", "ENOTEMPTY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error
      }
      syncDirectory(dirname(target))
    } finally {
      if (existsSync(staging)) { for (const dir of files.filter(f => f.kind === "directory")) { const p = join(content, dir.path); if (existsSync(p)) chmodSync(p, 0o700) }; if (existsSync(content)) chmodSync(content, 0o700); rmSync(staging, { recursive: true, force: true }) }
    }
    return this.tree(ref)
  }
  ingestCapture(snapshot: CapturedSnapshot) {
    if (digest(snapshot.files) !== snapshot.digest) throw new Error("Capture manifest digest mismatch")
    return this.ingestDirectory(snapshot.path, snapshot.digest)
  }
  ingestFile(path: string): StoredTree {
    const stat = lstatSync(path)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Artifact must be a regular file")
    const staging = mkdtempSync(join(this.root, "staging", "file-"))
    try { copyFileSync(path, join(staging, basename(path))); chmodSync(join(staging, basename(path)), stat.mode & 0o777); return this.ingestDirectory(staging) }
    finally { rmSync(staging, { recursive: true, force: true }) }
  }
  /** Materializes original metadata for a read-only container mount, outside sealed CAS bytes. */
  pin(ref: BlobRef): string {
    const tree = this.tree(ref), destination = join(this.root, "mounts", this.key(ref.digest))
    if (existsSync(destination)) {
      if (digest(inspectTree(destination)) !== ref.digest) throw new Error("Pinned input integrity mismatch")
      return destination
    }
    const staging = mkdtempSync(join(this.root, "staging", "mount-"))
    try {
      this.copyTree(tree, staging)
      try { renameSync(staging, destination) } catch (error) {
        if (!["EEXIST", "ENOTEMPTY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error
      }
      syncDirectory(dirname(destination))
    } finally { if (existsSync(staging)) rmSync(staging, { recursive: true, force: true }) }
    if (digest(inspectTree(destination)) !== ref.digest) throw new Error("Pinned input publication mismatch")
    return destination
  }
  restore(ref: BlobRef, destination: string) {
    const tree = this.tree(ref), target = resolve(destination)
    if (target === this.root || target.startsWith(this.root + sep)) throw new Error("Cannot restore into artifact store")
    if (existsSync(target) && readdirSync(target).length) throw new Error("Refusing to overwrite a workspace")
    mkdirSync(target, { recursive: true })
    this.copyTree(tree, target)
  }
  private copyTree(tree: StoredTree, target: string) {
    for (const file of tree.files) {
      const dest = join(target, file.path)
      if (file.kind === "directory") mkdirSync(dest, { recursive: true })
      else { mkdirSync(dirname(dest), { recursive: true }); copyFileSync(join(tree.path, file.path), dest, constants.COPYFILE_EXCL) }
      chmodSync(dest, file.kind === "directory" ? file.mode | 0o700 : file.mode)
    }
    for (const file of [...tree.files].reverse().filter(f => f.kind === "directory")) chmodSync(join(target, file.path), file.mode)
    if (digest(inspectTree(target)) !== tree.ref.digest) throw new Error("Restored workspace integrity mismatch")
  }
}
