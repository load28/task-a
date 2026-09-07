export const GROUP = "tasks.task-agent.dev"
export const VERSION = "v1alpha1"
export const FINALIZER = `${GROUP}/stop-before-delete`
export interface InstanceSpec {
  taskId: string
  image: string
  desiredState: "Running" | "Suspended"
  run: number
  storage: { size: string; className?: string }
  repository?: { url: string; commit: string }
  stages: Array<{ id: string; command: string[] }>
  envSecret?: string
  resources?: { requests?: Record<string, string>; limits?: Record<string, string> }
  deletionPolicy: "Retain" | "Delete"
}
export interface Resource {
  apiVersion?: string
  kind?: string
  metadata: {
    name: string; namespace?: string; uid?: string; resourceVersion?: string; generation?: number
    deletionTimestamp?: string; finalizers?: string[]; labels?: Record<string, string>
    annotations?: Record<string, string>; ownerReferences?: Array<Record<string, unknown>>
  }
  spec?: any
  status?: any
}
export interface TaskInstance extends Resource { spec: InstanceSpec }
export interface ClusterApi {
  get(resource: string, name: string): Promise<Resource | undefined>
  list(resource: string): Promise<Resource[]>
  create(resource: string, value: Resource): Promise<Resource>
  replace(resource: string, value: Resource): Promise<Resource>
  status(value: TaskInstance, status: Record<string, unknown>): Promise<void>
  remove(resource: string, value: Resource): Promise<void>
}
export function validateSpec(spec: InstanceSpec) {
  if (!spec.taskId?.trim() || !spec.image?.trim()) throw new Error("taskId and image are required")
  if (!Number.isInteger(spec.run) || spec.run < 1) throw new Error("run must be a positive integer")
  if (!["Running", "Suspended"].includes(spec.desiredState)) throw new Error("Invalid desiredState")
  if (!["Retain", "Delete"].includes(spec.deletionPolicy)) throw new Error("Invalid deletionPolicy")
  if (!spec.storage?.size) throw new Error("storage.size is required")
  if (!Array.isArray(spec.stages) || !spec.stages.length) throw new Error("At least one stage is required")
  const ids = new Set<string>()
  for (const stage of spec.stages) {
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(stage.id) || ids.has(stage.id)) throw new Error("Stage IDs must be unique DNS labels")
    ids.add(stage.id)
    if (!Array.isArray(stage.command) || !stage.command.length || stage.command.some(x => typeof x !== "string" || !x || x.includes("\0")))
      throw new Error("Stage command must be a nonempty argv array")
  }
  if (spec.repository && (!/^https:\/\//.test(spec.repository.url) || !/^[a-f0-9]{40,64}$/.test(spec.repository.commit)))
    throw new Error("Repository requires an HTTPS URL and exact commit hash")
}
