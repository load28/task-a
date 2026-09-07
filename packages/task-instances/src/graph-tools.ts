import { KubernetesApi } from "./api.ts"
import { KubectlApi } from "./kubectl.ts"
import { InstanceManager } from "./manager.ts"
export function configuredInstances(): InstanceManager | undefined {
  if (process.env.TASK_INSTANCE_BACKEND !== "kubernetes") return
  const namespace = process.env.TASK_INSTANCE_NAMESPACE
  if (!namespace) throw new Error("TASK_INSTANCE_NAMESPACE is required for Kubernetes execution")
  const api = process.env.TASK_INSTANCE_CONTEXT ? new KubectlApi(process.env.TASK_INSTANCE_CONTEXT, namespace) : new KubernetesApi(namespace)
  return new InstanceManager(api, namespace)
}
const taskId = { type: "string", minLength: 1 }
export const instanceTools = [
  { name: "task_instance_create", description: "Create the durable Kubernetes execution environment for an existing runnable leaf. Stages run argv commands in order. The configured worker image and envSecret are defaults when omitted; model commands may use node /app/scripts/instance-model-stage.ts with a self-contained prompt, graph context and acceptance criteria. Pass exact repository commit and environment image. For selective reuse, stages declare outputs (relative paths), inputDigest (SHA-256 covering effective requirements and inputs) and dependsOn (earlier stage IDs); spec.reuseSources lists {taskId, stages} of stopped source instances. Never run the same task in a native subagent as well.",
    inputSchema: { type: "object", properties: { taskId, spec: { type: "object" } }, required: ["taskId", "spec"] } },
  { name: "task_instance_status", description: "Load the same execution environment from any conversation, including Pod phase and persistent volume identity.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
  { name: "task_instance_suspend", description: "Request graceful stop and retain the task's files and stage checkpoints. Poll status until Suspended before claiming it stopped.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
  { name: "task_instance_resume", description: "Resume a suspended or failed environment using the next explicit run generation. Completed stages remain completed; interrupted stages inspect prior partial effects.",
    inputSchema: { type: "object", properties: { taskId, run: { type: "integer", minimum: 2 } }, required: ["taskId", "run"] } },
  { name: "task_instance_delete", description: "Delete a task environment only on explicit cleanup request. Its configured deletionPolicy determines whether its volume is retained or deleted.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
]
export const INSTANCE_INSTRUCTIONS = `Kubernetes execution is enabled. For runnable leaf work use task_instance_create instead of native task subagents or local execution. Creation atomically claims the graph leaf for Kubernetes; do not call task_start again for that leaf. Each instance owns an isolated checkout and durable OpenCode session data. Load task_instance_status when resuming from another host conversation. Stop and wait for Suspended before resuming with the next run number. Use the configured image and envSecret defaults. For model-driven work, run ["node", "/app/scripts/instance-model-stage.ts", "<self-contained task prompt>"] inside the instance. Include task context and exact acceptance criteria in that prompt. The model can use tools inside its own PVC; the manager records graph results from actual output evidence. A completed Pod is only command completion, not graph verification: publish evidence and complete the graph task separately. Pass required tools, remote graph connection and credentials through a preconfigured environment image/Secret; never put credentials in instance specifications. Follow the leaf dependencies and worker capacity. When a plan revision exposes reusable work, create a new instance with reuseSources and explicit stage inputDigest/outputs; only matching verified stage files are imported. Include the graph attemptToken from task_load in completion and artifact reports. Transfer verified commits to the integration instance before downstream validation. Do not assume isolated files have been merged into the user's checkout.`
