import { request } from "node:https"
import { readFileSync } from "node:fs"
import { GROUP, VERSION, type ClusterApi, type Resource, type TaskInstance } from "./types.ts"

export class ApiError extends Error { readonly code: number; constructor(code: number, message: string) { super(message); this.code = code } }
/** In-cluster API access; authentication and CA verification are never disabled. */
export class KubernetesApi implements ClusterApi {
  readonly namespace: string
  private endpoint: string
  private credentialDirectory: string
  constructor(namespace: string, endpoint = "https://kubernetes.default.svc",
    credentialDirectory = "/var/run/secrets/kubernetes.io/serviceaccount") {
    this.namespace = namespace; this.endpoint = endpoint; this.credentialDirectory = credentialDirectory
  }
  private path(resource: string, name?: string) {
    const prefix = resource === "taskinstances" ? `/apis/${GROUP}/${VERSION}` : "/api/v1"
    return `${prefix}/namespaces/${encodeURIComponent(this.namespace)}/${resource}${name ? `/${encodeURIComponent(name)}` : ""}`
  }
  private async send(method: string, path: string, body?: unknown, raw=false): Promise<any> {
    const token = readFileSync(`${this.credentialDirectory}/token`, "utf8").trim()
    const ca = readFileSync(`${this.credentialDirectory}/ca.crt`)
    return new Promise((resolve, reject) => {
      const req = request(new URL(path, this.endpoint), { method, ca, headers: {
        Authorization: `Bearer ${token}`, "Content-Type": "application/json",
      } }, res => {
        let text = ""
        res.setEncoding("utf8").on("data", chunk => { text += chunk }).on("end", () => {
          if ((res.statusCode ?? 500) >= 400) return reject(new ApiError(res.statusCode!, text.slice(0, 2000)))
          try { resolve(raw?text:text ? JSON.parse(text) : {}) } catch (error) { reject(error) }
        })
      })
      req.setTimeout(15000, () => req.destroy(new Error("Kubernetes request timed out")))
      req.on("error", reject)
      req.end(body === undefined ? undefined : JSON.stringify(body))
    })
  }
  async get(resource: string, name: string) {
    try { return await this.send("GET", this.path(resource, name)) as Resource }
    catch (error) { if (error instanceof ApiError && error.code === 404) return; throw error }
  }
  async logs(pod:string,container:string,maxBytes:number):Promise<string> {
    if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>1048576)throw new Error("Invalid Pod log budget")
    return this.send("GET",`${this.path("pods",pod)}/log?container=${encodeURIComponent(container)}&limitBytes=${maxBytes}`,undefined,true)
  }
  async list(resource: string) { return (await this.send("GET", this.path(resource))).items as Resource[] }
  async create(resource: string, value: Resource) { return this.send("POST", this.path(resource), value) }
  async replace(resource: string, value: Resource) { return this.send("PUT", this.path(resource, value.metadata.name), value) }
  async status(value: TaskInstance, status: Record<string, unknown>) {
    await this.send("PUT", `${this.path("taskinstances", value.metadata.name)}/status`, { ...value, status })
  }
  async remove(resource: string, value: Resource) {
    try {
      await this.send("DELETE", this.path(resource, value.metadata.name), {
        apiVersion: "v1", kind: "DeleteOptions", preconditions: { uid: value.metadata.uid },
        propagationPolicy: "Foreground",
      })
    } catch (error) { if (!(error instanceof ApiError && error.code === 404)) throw error }
  }
}
