import { spawn } from "node:child_process"
import { ApiError } from "./api.ts"
import type { ClusterApi, Resource, TaskInstance } from "./types.ts"
/** Local development uses kubeconfig via kubectl; server controllers use service accounts. */
export class KubectlApi implements ClusterApi {
  readonly context: string
  readonly namespace: string
  constructor(context: string, namespace: string) {
    if (!context || !namespace) throw new Error("Explicit Kubernetes context and namespace are required")
    this.context = context; this.namespace = namespace
  }
  async command(args: string[], body?: unknown): Promise<any> {
    return new Promise((done, fail) => {
      const child = spawn("kubectl", ["--context", this.context, "--namespace", this.namespace, ...args], { stdio: ["pipe", "pipe", "pipe"] })
      let out = "", err = ""
      child.stdout.on("data", chunk => { out += chunk }); child.stderr.on("data", chunk => { err += chunk })
      child.on("error", fail)
      child.on("exit", code => {
        if (code !== 0) return fail(new ApiError(/NotFound/.test(err) ? 404 : /Conflict|AlreadyExists/.test(err) ? 409 : 500, err))
        try { done(out.trim() ? JSON.parse(out) : {}) } catch (error) { fail(error) }
      })
      child.stdin.end(body === undefined ? undefined : JSON.stringify(body))
    })
  }
  async get(resource: string, name: string) {
    const result = await this.command(["get", resource, name, "--ignore-not-found", "-o", "json"])
    return result.metadata ? result as Resource : undefined
  }
  async list(resource: string) { return (await this.command(["get", resource, "-o", "json"])).items as Resource[] }
  async create(_resource: string, value: Resource) { return this.command(["create", "-f", "-", "-o", "json"], value) }
  async replace(_resource: string, value: Resource) { return this.command(["replace", "-f", "-", "-o", "json"], value) }
  async status(value: TaskInstance, status: Record<string, unknown>) {
    await this.command(["replace", "--subresource=status", "-f", "-", "-o", "json"], { ...value, status })
  }
  async remove(resource: string, value: Resource) {
    const current = await this.get(resource, value.metadata.name)
    if (!current) return
    if (current.metadata.uid !== value.metadata.uid) throw new Error("Resource identity changed")
    // Delete through the API with UID preconditions, rather than kubectl's name-only delete.
    const group = resource === "taskinstances" ? "/apis/tasks.task-agent.dev/v1alpha1" : "/api/v1"
    await this.command(["delete", "--raw", `${group}/namespaces/${this.namespace}/${resource}/${value.metadata.name}`, "-f", "-"],
      { apiVersion: "v1", kind: "DeleteOptions", preconditions: { uid: value.metadata.uid }, propagationPolicy: "Foreground" })
  }
}
