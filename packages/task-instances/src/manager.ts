import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import { GROUP, VERSION, validateSpec, type ClusterApi, type InstanceSpec, type TaskInstance } from "./types.ts"
export const instanceName = (taskId: string) => `task-${createHash("sha256").update(taskId).digest("hex").slice(0, 32)}`
export class InstanceManager {
  private api: ClusterApi
  readonly namespace: string
  constructor(api: ClusterApi, namespace: string) { this.api = api; this.namespace = namespace }
  async load(taskId: string) {
    const instance = await this.api.get("taskinstances", instanceName(taskId)) as TaskInstance | undefined
    if (!instance) throw new Error("Task instance does not exist")
    if (instance.spec.taskId !== taskId) throw new Error("Task instance identity mismatch")
    return instance
  }
  async create(spec: InstanceSpec) {
    validateSpec(spec)
    const existing = await this.api.get("taskinstances", instanceName(spec.taskId)) as TaskInstance | undefined
    if (existing) {
      for (const key of ["taskId", "image", "storage", "repository", "stages", "reuseSources", "restoreFromTaskId"] as const)
        if (!isDeepStrictEqual(existing.spec[key], spec[key])) throw new Error("Task already has a different execution environment")
      if (existing.spec.archive?.claimName !== spec.archive?.claimName) throw new Error("Task archive store is immutable")
      return existing
    }
    return this.api.create("taskinstances", { apiVersion: `${GROUP}/${VERSION}`, kind: "TaskInstance",
      metadata: { name: instanceName(spec.taskId), namespace: this.namespace }, spec })
  }
  async suspend(taskId: string) {
    const instance = await this.load(taskId)
    if (instance.spec.desiredState === "Suspended") return instance
    return this.api.replace("taskinstances", { ...instance, spec: { ...instance.spec, desiredState: "Suspended" } })
  }
  async resume(taskId: string, run: number) {
    const instance = await this.load(taskId)
    // Explicit generation makes retries safe even after the requested run has already finished.
    if (instance.spec.run === run && instance.spec.desiredState === "Running") return instance
    if (run !== instance.spec.run + 1) throw new Error("Resume must request exactly the next execution generation")
    if (!["Suspended", "Failed", "RecoveryRequired", "Archived"].includes(instance.status?.phase))
      throw new Error("Wait for a stopped or failed instance before resuming")
    if (instance.status?.phase === "RecoveryRequired")
      throw new Error("Lost execution requires operator recovery; confirm old worker termination and restore missing storage first")
    return this.api.replace("taskinstances", { ...instance, spec: { ...instance.spec, desiredState: "Running", run, ...(instance.status?.phase === "Archived" && instance.spec.archive ? { archive: { ...instance.spec.archive, cleanupOnCompletion: false } } : {}) } })
  }
  async remove(taskId: string) {
    const instance = await this.load(taskId)
    await this.api.remove("taskinstances", instance)
    return { taskId, deleting: true, dataPolicy: instance.spec.deletionPolicy }
  }
}
