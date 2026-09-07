import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
import { names } from "../packages/task-instances/src/controller.ts"
import type { TaskInstance, InstanceSpec } from "../packages/task-instances/src/types.ts"

const context = process.env.TASK_INSTANCE_CONTEXT
if (!context?.startsWith("kind-")) throw new Error("Smoke tests require an explicit kind context")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
const taskId = `smoke-${randomUUID()}`
const input: InstanceSpec = { taskId, image: process.env.TASK_INSTANCE_IMAGE ?? "task-agent-instances:local",
  run: 1, desiredState: "Running", deletionPolicy: "Delete", storage: { size: "1Gi" }, stages: [
    { id: "research", command: ["node", "-e", "require('fs').appendFileSync('research.txt','once\\n')"] },
    { id: "implementation", command: ["node", "-e", "const f=require('fs');if(f.existsSync('partial.txt'))process.exit(0);f.writeFileSync('partial.txt','preserved');setInterval(()=>{},1000)"] },
    { id: "validation", command: ["node", "-e", "const f=require('fs');if(f.readFileSync('research.txt','utf8')!=='once\\n'||f.readFileSync('partial.txt','utf8')!=='preserved')process.exit(1);f.writeFileSync('validated.txt','passed')"] },
  ] }
async function waitFor(check: () => Promise<boolean>, label: string, timeout = 120000) {
  const deadline = Date.now() + timeout
  do { if (await check()) return; await new Promise(ok => setTimeout(ok, 500)) } while (Date.now() < deadline)
  throw new Error(`Timed out: ${label}`)
}
async function checkpoint(pod: string) {
  return api.command(["exec", pod, "--", "cat", "/data/checkpoint.json"])
}
const cli = (args: string[]) => new Promise<void>((done, fail) => {
  const child = spawn(process.execPath, ["scripts/instances.ts", ...args], { env: { ...process.env, TASK_INSTANCE_CONTEXT: context, TASK_INSTANCE_NAMESPACE: namespace }, stdio: "pipe" })
  let error = ""
  child.stderr.on("data", chunk => { error += chunk })
  child.on("error", fail); child.on("exit", code => code === 0 ? done() : fail(new Error(error)))
})
await manager.create(input)
const instance = await manager.load(taskId), ids = names(instance)
try {
  await waitFor(async () => {
    try { return (await checkpoint(ids.pod)).active === "implementation" } catch { return false }
  }, "implementation checkpoint")
  const volumeUid = (await api.get("persistentvolumeclaims", ids.volume))!.metadata.uid
  const firstPodUid = (await api.get("pods", ids.pod))!.metadata.uid
  // Independent CLI processes model a different host conversation, using only the task ID.
  await cli(["suspend", taskId])
  await waitFor(async () => (await manager.load(taskId)).status?.phase === "Suspended", "graceful suspension")
  assert.equal(await api.get("pods", ids.pod), undefined)
  const controllers = (await api.list("pods")).filter(p => p.metadata.labels?.["app.kubernetes.io/name"] === "task-instance-controller")
  for (const pod of controllers) await api.remove("pods", pod)
  await cli(["resume", taskId, "2"])
  await waitFor(async () => {
    const status = (await manager.load(taskId)).status
    if (["Failed", "RecoveryRequired"].includes(status?.phase)) throw new Error(JSON.stringify(status))
    return status?.phase === "Completed"
  }, "resumed completion")
  const done = await manager.load(taskId)
  assert.equal((await api.get("persistentvolumeclaims", ids.volume))!.metadata.uid, volumeUid)
  assert.notEqual((await api.get("pods", ids.pod))!.metadata.uid, firstPodUid)
  assert.deepEqual(JSON.parse(done.status.result.message).completed, ["research", "implementation", "validation"])
  process.stdout.write(JSON.stringify({ passed: true, taskId, checks: ["partial files preserved", "completed stage executed once", "new CLI session resumed", "controller restart recovered", "same PVC and new Pod", "validation passed"] }) + "\n")
} finally {
  const current = await manager.load(taskId)
  await api.remove("taskinstances", current)
  await waitFor(async () => !(await api.get("taskinstances", current.metadata.name)), "instance cleanup")
  assert.equal(await api.get("persistentvolumeclaims", ids.volume), undefined)
}
