import { readFileSync } from "node:fs"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { InstanceManager } from "../packages/task-instances/src/manager.ts"
const [action, argument, run] = process.argv.slice(2)
const context = process.env.TASK_INSTANCE_CONTEXT
if (!context) throw new Error("Set TASK_INSTANCE_CONTEXT explicitly; no implicit production context")
const namespace = process.env.TASK_INSTANCE_NAMESPACE ?? "task-agent"
const api = new KubectlApi(context, namespace), manager = new InstanceManager(api, namespace)
let result: unknown
switch (action) {
  case "create": result = await manager.create(JSON.parse(readFileSync(argument!, "utf8"))); break
  case "list": result = await api.list("taskinstances"); break
  case "status": result = await manager.load(argument!); break
  case "suspend": result = await manager.suspend(argument!); break
  case "resume": result = await manager.resume(argument!, Number(run)); break
  case "delete": result = await manager.remove(argument!); break
  default: throw new Error("Usage: instances.ts create <spec.json> | list | status/suspend/delete <taskId> | resume <taskId> <next-run>")
}
process.stdout.write(JSON.stringify(result, null, 2) + "\n")
