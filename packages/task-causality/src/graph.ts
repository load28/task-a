import { ControlStore } from "../../task-control/src/store.ts"
import { canonical, digest, unit } from "../../task-control/src/value.ts"
import { CHANGE_SCOPES, RELATIONS, type CausalEdge } from "./model.ts"

export class CausalGraph {
  readonly store: ControlStore
  constructor(store: ControlStore) { this.store=store }
  put(edge: CausalEdge, expected: number): void {
    this.store.atomic(() => {
      if (!edge.id || !Number.isSafeInteger(edge.version) || edge.version !== expected+1) throw new Error("Invalid edge version")
      for (const port of [edge.source,edge.target]) if (!port.entityId || !port.port || !port.view) throw new Error("Incomplete port")
      if (!RELATIONS.includes(edge.relation) || !edge.changeTypes.length || edge.changeTypes.some(s=>!CHANGE_SCOPES.includes(s))) throw new Error("Invalid typed relation")
      unit(edge.impactWeight,"Impact weight")
      if (edge.critical && edge.impactWeight!==1) throw new Error("Critical edges cannot attenuate")
      const stats=edge.observedPropagationRate
      if (!Number.isSafeInteger(stats.trials) || !Number.isSafeInteger(stats.successes) || stats.successes<0 || stats.trials<stats.successes || !stats.modelVersion) throw new Error("Invalid propagation observations")
      unit(stats.estimate,"Propagation estimate")
      const current=Number(this.store.db.prepare("SELECT version FROM causal_edges WHERE id=?").get(edge.id)?.version ?? 0)
      if (current!==expected) throw new Error("Stale edge version")
      this.store.db.prepare("INSERT INTO causal_edge_versions VALUES(?,?,?,?,?,?,?)").run(edge.id,edge.version,edge.source.entityId,edge.target.entityId,edge.relation,canonical(edge),digest(edge))
      this.store.db.prepare("INSERT INTO causal_edges VALUES(?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version").run(edge.id,edge.version)
    })
  }
  outgoing(entity: string): CausalEdge[] { return this.query("WHERE v.source=?",entity) }
  incoming(entity: string): CausalEdge[] { return this.query("WHERE v.target=?",entity) }
  all(): CausalEdge[] { return this.query("") }
  hash(): string { return digest(this.all()) }
  private query(where: string, ...args: string[]): CausalEdge[] {
    return this.store.db.prepare(`SELECT v.payload,v.hash FROM causal_edge_versions v JOIN causal_edges e ON e.id=v.id AND e.version=v.version ${where} ORDER BY v.id`).all(...args).map(row=>{
      const value=JSON.parse(String(row.payload)) as CausalEdge
      if (digest(value)!==row.hash) throw new Error("Corrupted causal edge")
      return value
    })
  }
}
