import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
import { names } from "../packages/task-instances/src/controller.ts"
import type { InstanceSpec } from "../packages/task-instances/src/types.ts"
const context = process.env.TASK_INSTANCE_CONTEXT
if (!context?.startsWith("kind-")) throw new Error("An explicit local kind context is required")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
const taskId = `archive-smoke-${randomUUID()}`, forkId = `${taskId}-fork`
const base: Omit<InstanceSpec, "taskId" | "stages"> = { image: process.env.TASK_INSTANCE_IMAGE ?? "task-agent-instances:worktree", desiredState: "Running", run: 1, storage: { size: "1Gi" }, deletionPolicy: "Delete", archive: { claimName: "task-workspace-archives", cleanupOnCompletion: true } }
const setup = `const fs=require('fs'),{execFileSync}=require('child_process');const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();fs.writeFileSync('tracked','base');git('add','tracked');git('-c','commit.gpgsign=false','-c','user.name=Test','-c','user.email=test@localhost','commit','-m','base');fs.writeFileSync('tracked','staged');git('add','tracked');fs.writeFileSync('tracked','dirty');fs.writeFileSync('untracked','keep');fs.writeFileSync('runs','once');fs.writeFileSync('/data/home/session.db',Buffer.from([0,1,255]));console.log('worktree-state-prepared')`
const check = `const fs=require('fs'),a=require('assert/strict'),{execFileSync}=require('child_process');a.match(fs.readFileSync('.git','utf8'),/gitdir:/);a.equal(execFileSync('git',['show',':tracked'],{encoding:'utf8'}).trim(),'staged');a.equal(fs.readFileSync('tracked','utf8'),'dirty');a.equal(fs.readFileSync('untracked','utf8'),'keep');a.equal(fs.readFileSync('runs','utf8'),'once');a.deepEqual(fs.readFileSync('/data/home/session.db'),Buffer.from([0,1,255]));a.ok(Number(execFileSync('git',['rev-list','--count','HEAD'],{encoding:'utf8'}))>=2);console.log('complete-worktree-state-restored')`
async function waitFor(check: () => Promise<boolean>, label: string) {
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    if (await check()) return
    for (const id of [taskId, forkId]) {
      const current = await api.get("taskinstances", (await import("../packages/task-instances/src/manager.ts")).instanceName(id))
      if (current && !current.metadata.deletionTimestamp && ["Failed", "RecoveryRequired"].includes(current.status?.phase)) {
        let logs = ""
        try { logs = execFileSync("kubectl", ["--context", context!, "-n", namespace, "logs", names(current as any).pod], { encoding: "utf8" }) } catch {}
        throw new Error(`Execution failed during ${label}: ${JSON.stringify(current.status)}\n${logs}`)
      }
    }
    await new Promise(ok => setTimeout(ok, 500))
  }
  throw new Error(`Timed out: ${label}`)
}
let auditName: string | undefined
try {
  const source = await manager.create({ ...base, taskId, stages: [{ id: "work", command: ["node", "-e", setup] }] })
  const ids = names(source as any)
  await waitFor(async () => !!await api.get("persistentvolumeclaims", ids.volume), "original PVC")
  const oldVolume = await api.get("persistentvolumeclaims", ids.volume)
  await waitFor(async () => (await manager.load(taskId)).status?.phase === "Archived", "automatic archival and cleanup")
  const archived = await manager.load(taskId)
  assert.equal(await api.get("pods", ids.pod), undefined)
  assert.equal(await api.get("persistentvolumeclaims", ids.volume), undefined)
  assert.match(archived.status.archive.sha256, /^[a-f0-9]{64}$/)
  await manager.resume(taskId, 2)
  await waitFor(async () => (await manager.load(taskId)).status?.phase === "Completed", "restore on a new PVC")
  const newVolume = await api.get("persistentvolumeclaims", ids.volume)
  assert.notEqual(newVolume!.metadata.uid, oldVolume!.metadata.uid)
  const restored = await manager.load(taskId)
  assert.equal(restored.spec.archive?.cleanupOnCompletion, false)
  auditName = `archive-audit-${randomUUID().slice(0, 8)}`
  await api.create("pods", { apiVersion: "v1", kind: "Pod", metadata: { name: auditName, namespace }, spec: {
    restartPolicy: "Never", automountServiceAccountToken: false,
    securityContext: { runAsUser: 1000, runAsGroup: 1000, runAsNonRoot: true },
    containers: [{ name: "audit", image: base.image, imagePullPolicy: "IfNotPresent", workingDir: "/data/workspace", command: ["node", "-e", check], volumeMounts: [{ name: "data", mountPath: "/data", readOnly: true }] }],
    volumes: [{ name: "data", persistentVolumeClaim: { claimName: ids.volume, readOnly: true } }],
  } })
  await waitFor(async () => ["Succeeded", "Failed"].includes((await api.get("pods", auditName!))?.status?.phase), "read-only audit")
  assert.equal((await api.get("pods", auditName))!.status.phase, "Succeeded")
  await manager.create({ ...base, taskId: forkId, restoreFromTaskId: taskId, stages: [{ id: "new-work", command: ["node", "-e", check + ";require('fs').writeFileSync('new-work','continued')"] }] })
  await waitFor(async () => (await manager.load(forkId)).status?.phase === "Archived", "new task from full prior workspace")
  console.log(JSON.stringify({ passed: true, checks: ["private Git worktree", "archive committed before cleanup", "completed Pod and PVC deleted", "new PVC UID on restore", "commits/index/dirty/untracked/session history restored", "completed stage not rerun", "new task continues from full prior workspace"], source: taskId, archive: archived.status.archive.sha256 }))
} finally {
  if (auditName) { const pod = await api.get("pods", auditName); if (pod) await api.remove("pods", pod) }
  for (const id of [forkId, taskId]) {
    try { await manager.remove(id); await waitFor(async () => { try { await manager.load(id); return false } catch { return true } }, "test cleanup") } catch {}
  }
}
