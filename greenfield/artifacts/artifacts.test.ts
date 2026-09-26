import test from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { FileArtifactStore, inspectTree } from "./index.ts"
import { digest } from "../contracts/canonical.ts"

function fixture(t: any) {
  const root = mkdtempSync(join(tmpdir(), "greenfield-artifact-"))
  // Published trees are read-only, so cleanup restores directory permissions first.
  t.after(() => { const unlock = (p: string) => { for (const f of inspectTree(p).filter(x => x.kind === "directory")) chmodSync(join(p, f.path), 0o700); chmodSync(p, 0o700) }; unlock(root); rmSync(root, { recursive: true, force: true }) })
  return { root, store: new FileArtifactStore(join(root, "cas")) }
}
test("content address preserves empty directories, bytes and executable mode across restore", t => {
  const { root, store } = fixture(t), input = join(root, "input")
  mkdirSync(join(input, "empty"), { recursive: true }); writeFileSync(join(input, "한글.txt"), "검증 내용"); chmodSync(join(input, "한글.txt"), 0o755)
  const expected = digest(inspectTree(input)), tree = store.ingestDirectory(input)
  assert.equal(tree.ref.digest, expected)
  store.restore(tree.ref, join(root, "restored"))
  assert.equal(digest(inspectTree(join(root, "restored"))), expected)
  assert.equal(readFileSync(join(root, "restored", "한글.txt"), "utf8"), "검증 내용")
  assert.throws(() => store.restore(tree.ref, join(root, "restored")), /overwrite/)
})
test("bad capture, symlinks and post-publication corruption cannot be consumed", async t => {
  const { root, store } = fixture(t), input = join(root, "input")
  mkdirSync(input); writeFileSync(join(input, "value"), "one")
  assert.throws(() => store.ingestDirectory(input, digest("wrong")), /digest mismatch/)
  const tree = store.ingestDirectory(input)
  chmodSync(join(tree.path, "value"), 0o644); writeFileSync(join(tree.path, "value"), "two")
  assert.equal(await store.verify(tree.ref), false)
  symlinkSync("/etc/passwd", join(input, "escape"))
  assert.throws(() => store.ingestDirectory(input), /Unsupported/)
  rmSync(join(input, "escape"))
})
test("blob publication is idempotent and reads check the immutable digest", async t => {
  const { store } = fixture(t), bytes = new TextEncoder().encode("report")
  const [a, b] = await Promise.all([store.put(bytes), store.put(bytes)])
  assert.deepEqual(a, b)
  assert.deepEqual(new Uint8Array(await store.get(a)), bytes)
})
