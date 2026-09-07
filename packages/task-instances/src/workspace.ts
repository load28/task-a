import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs"
import { resolve, join } from "node:path"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import type { InstanceSpec } from "./types.ts"

function git(args: string[], cwd?: string, input?: string) {
  const r = spawnSync("git", args, { cwd, input, encoding: "utf8" })
  if (r.status !== 0) throw new Error(`Git workspace failed: ${r.stderr || r.error?.message}`)
  return r.stdout.trim()
}
/** The common Git directory is private to this task PVC; no host/shared Git locks. */
export function ensureWorktree(spec: InstanceSpec, directory: string) {
  const workspace = resolve(directory, "workspace"), repository = resolve(directory, "repository.git")
  const previous = resolve(directory, "workspace.before-worktree")
  const branch = `codex/task-${createHash("sha256").update(spec.taskId).digest("hex").slice(0, 16)}`
  if (existsSync(join(workspace, ".git")) && statSync(join(workspace, ".git")).isFile() && existsSync(repository) && !existsSync(previous)) {
    // Absolute worktree links must be repaired after restoring to a different root.
    git(["--git-dir", repository, "worktree", "repair", workspace])
    if (spec.restoreFromTaskId) {
      const head = git(["rev-parse", "HEAD"], workspace)
      git(["--git-dir", repository, "update-ref", `refs/heads/${branch}`, head])
      git(["symbolic-ref", "HEAD", `refs/heads/${branch}`], workspace)
    }
    return
  }
  if (!existsSync(repository) && existsSync(join(workspace, ".git")) && statSync(join(workspace, ".git")).isFile()) throw new Error("External worktree requires its common Git repository; refusing to discard history")
  if (!existsSync(previous) && existsSync(workspace)) renameSync(workspace, previous)
  mkdirSync(directory, { recursive: true })
  const oldGit = join(previous, ".git")
  if (!existsSync(repository)) {
    if (existsSync(oldGit) && statSync(oldGit).isDirectory()) {
      cpSync(oldGit, repository, { recursive: true })
      git(["--git-dir", repository, "config", "core.bare", "true"])
      spawnSync("git", ["--git-dir", repository, "config", "--unset", "core.worktree"])
    } else {
      git(["init", "--bare", repository])
      let commit: string
      if (spec.repository) {
        git(["--git-dir", repository, "fetch", "--depth=1", spec.repository.url, spec.repository.commit])
        commit = spec.repository.commit
      } else {
        const tree = git(["--git-dir", repository, "mktree"], undefined, "")
        commit = git(["-c", "user.name=Task Workspace", "-c", "user.email=workspace@localhost", "--git-dir", repository, "commit-tree", tree, "-m", "Initialize task workspace"])
      }
      git(["--git-dir", repository, "update-ref", `refs/heads/${branch}`, commit])
      git(["--git-dir", repository, "symbolic-ref", "HEAD", `refs/heads/${branch}`])
    }
  }
  if (!existsSync(join(workspace, ".git"))) {
    // Recover a crash after Git registration but before copying the previous files.
    git(["--git-dir", repository, "worktree", "prune"])
    git(["--git-dir", repository, "worktree", "add", "--force", "--detach", workspace, "HEAD"])
    git(["symbolic-ref", "HEAD", `refs/heads/${branch}`], workspace)
    const head = git(["--git-dir", repository, "rev-parse", "HEAD"])
    git(["--git-dir", repository, "update-ref", `refs/heads/${branch}`, head])
  }
  if (existsSync(previous)) {
    // Keep tracked deletions, staged changes, ignored files and untracked files.
    for (const name of readdirSync(workspace)) if (name !== ".git") rmSync(join(workspace, name), { recursive: true, force: true })
    for (const name of readdirSync(previous)) if (name !== ".git") cpSync(join(previous, name), join(workspace, name), { recursive: true, verbatimSymlinks: true })
    if (existsSync(join(oldGit, "index"))) cpSync(join(oldGit, "index"), git(["rev-parse", "--git-path", "index"], workspace))
    rmSync(previous, { recursive: true, force: true })
  }
}
