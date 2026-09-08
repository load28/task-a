import { createHash } from "node:crypto"
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs"
import { resolve, join, relative as relativePath } from "node:path"
export const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex")
export interface CodeSnapshot { hash: string; fileCount: number; algorithm: "sha256-tree-v1" }
/** Hash real bytes, path, file kind and executable bit. Git bookkeeping alone is excluded.
 * Includes ignored/untracked files and installed dependencies: unknown scope is whole workspace. */
export function snapshotCode(root: string): CodeSnapshot {
  root = realpathSync(resolve(root))
  const scan = () => {
    const entries: unknown[] = []
    const walk = (relative: string) => {
      const path = join(root, relative), before = lstatSync(path, { bigint: true })
      if (before.isSymbolicLink()) {
        const target = relativePath(root, realpathSync(path))
        if (target === ".." || target.startsWith("../") || target.startsWith("/")) throw new Error(`External symbolic link is outside the input closure: ${relative}`)
        entries.push([relative, "symlink", target])
      } else if (before.isDirectory()) {
        entries.push([relative, "directory"])
        for (const name of readdirSync(path).sort()) if (name !== ".git") walk(relative ? `${relative}/${name}` : name)
      } else if (before.isFile()) {
        const hash = createHash("sha256").update(readFileSync(path)).digest("hex")
        const after = lstatSync(path, { bigint: true })
        if (before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new Error("Workspace changed during snapshot")
        entries.push([relative, "file", Number(before.mode & 0o111n), hash])
      } else throw new Error(`Unsupported input file: ${relative}`)
    }
    walk("")
    return { hash: digest(entries), fileCount: entries.filter((v: any) => v[1] === "file").length, algorithm: "sha256-tree-v1" as const }
  }
  const first = scan(), second = scan()
  if (first.hash !== second.hash) throw new Error("Workspace changed during snapshot")
  return first
}
