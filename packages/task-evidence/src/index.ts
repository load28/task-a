import { randomUUID } from "node:crypto"
import { ControlStore } from "../../task-control/src/store.ts"
import { digest, unit } from "../../task-control/src/value.ts"
import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"

export interface Evidence {
  id: string; version: number; type: "test"|"code"|"document"|"runtime"|"research"|"user"|"agent"
  source: string; confidence: number; timestamp: number; contentHash: string; content: unknown
  inputVector: VersionVector; producer: string; validatorVersion: string; expiresAt: number | null
}
export interface Obligation {
  id: string; entityId: string; tuple: VersionVector; kind: string; mandatory: boolean
  state: "pending"|"running"|"satisfied"|"failed"|"deferred"
  evidence: VersionRef[]; validators: string[]; reason: VersionRef[]
}
export class EvidenceStore {
  readonly store: ControlStore
  constructor(store:ControlStore) { this.store=store }
  put(evidence:Evidence): VersionRef {
    if(!evidence.source||!evidence.producer||!evidence.validatorVersion||!Number.isFinite(evidence.timestamp)||evidence.contentHash!==digest(evidence.content)) throw new Error("Incomplete evidence provenance")
    unit(evidence.confidence,"Evidence confidence")
    if(evidence.type==="research" && evidence.expiresAt===null) throw new Error("External research needs a revalidation deadline")
    if(evidence.expiresAt!==null && (!Number.isFinite(evidence.expiresAt)||evidence.expiresAt<=evidence.timestamp)) throw new Error("Invalid evidence lifetime")
    this.store.put("evidence_versions",evidence.id,evidence.version,evidence)
    return {id:evidence.id,version:evidence.version}
  }
  valid(ref:VersionRef, now=Date.now()): boolean {
    const value=this.store.get<Evidence>("evidence_versions",ref.id,ref.version)
    return !!value && !this.store.db.prepare("SELECT 1 FROM evidence_retractions WHERE id=? AND version=?").get(ref.id,ref.version) && digest(value.content)===value.contentHash && (value.expiresAt===null||value.expiresAt>now)
  }
  require(ref:VersionRef,now=Date.now()): Evidence {
    if(!this.valid(ref,now)) throw new Error("Missing or expired evidence")
    return this.store.get<Evidence>("evidence_versions",ref.id,ref.version)!
  }
  retract(ref:VersionRef,authorization:VersionRef[],reason:string):void {
    this.store.atomic(()=>{
      if(!reason.trim()||!authorization.length)throw new Error("Evidence retraction requires a reason and authorization")
      if(!this.store.get("evidence_versions",ref.id,ref.version))throw new Error("Unknown evidence")
      for(const source of authorization)if(!["user","code"].includes(this.require(source).type)||source.id===ref.id&&source.version===ref.version)throw new Error("Evidence cannot authorize its own retraction")
      const id=`evidence-retracted:${ref.id}:${ref.version}`
      if(this.store.db.prepare("SELECT 1 FROM evidence_retractions WHERE id=? AND version=?").get(ref.id,ref.version))return
      this.store.db.prepare("INSERT INTO evidence_retractions VALUES(?,?,?)").run(ref.id,ref.version,id)
      this.store.event({id,type:"EvidenceRetracted",entityId:ref.id,correlationId:ref.id,schemaVersion:1,timestamp:Date.now(),payload:{evidence:ref,authorization,reason}})
    })
  }
  expire(now=Date.now(),limit=1000):number {
    if(!Number.isFinite(now)||!Number.isSafeInteger(limit)||limit<1)throw new Error("Invalid evidence timer budget")
    return this.store.atomic(()=>{
      const rows=this.store.db.prepare("SELECT id,version,expires_at FROM evidence_expirations WHERE emitted=0 AND expires_at<=? ORDER BY expires_at,id,version LIMIT ?").all(now,limit)
      for(const row of rows) {
        this.store.db.prepare("UPDATE evidence_expirations SET emitted=1 WHERE id=? AND version=?").run(String(row.id),Number(row.version))
        this.store.event({id:`evidence-expired:${row.id}:${row.version}`,type:"EvidenceExpired",entityId:String(row.id),correlationId:String(row.id),schemaVersion:1,timestamp:now,payload:{evidence:{id:String(row.id),version:Number(row.version)},expiredAt:Number(row.expires_at)}})
      }
      return rows.length
    })
  }
  createObligation(input:Omit<Obligation,"id"|"state"|"evidence">): Obligation {
    return this.store.atomic(()=>{
      if(!input.validators.length||!input.reason.length||!input.entityId) throw new Error("An obligation needs validators and causal evidence")
      input.reason.forEach(ref=>this.require(ref))
      const id=digest({entity:input.entityId,tuple:input.tuple,kind:input.kind,validators:input.validators})
      const existing=this.obligation(id)
      if(existing) {
        // A later hard trigger must never inherit an earlier optional obligation.
        if(input.mandatory&&!existing.mandatory) {
          existing.mandatory=true
          existing.reason=[...new Map([...existing.reason,...input.reason].map(ref=>[`${ref.id}@${ref.version}`,ref])).values()]
          this.store.db.prepare("UPDATE validation_obligations SET mandatory=1,payload=? WHERE id=?").run(JSON.stringify(existing),id)
          this.requiredEvent(existing)
        }
        return existing
      }
      const obligation:Obligation={...input,id,state:"pending",evidence:[]}
      this.store.db.prepare("INSERT INTO validation_obligations VALUES(?,?,?,?,?,?)").run(id,input.entityId,digest(input.tuple),Number(input.mandatory),obligation.state,JSON.stringify(obligation))
      this.requiredEvent(obligation)
      return obligation
    })
  }
  private requiredEvent(obligation:Obligation):void {
    this.store.event({id:randomUUID(),type:"ValidationRequired",entityId:obligation.entityId,correlationId:obligation.entityId,schemaVersion:1,timestamp:Date.now(),payload:{obligationId:obligation.id,mandatory:obligation.mandatory,evidence:obligation.reason}})
  }
  obligation(id:string): Obligation|undefined {
    const row=this.store.db.prepare("SELECT payload FROM validation_obligations WHERE id=?").get(id)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  resolve(id:string,refs:VersionRef[]): Obligation {
    return this.store.atomic(()=>{
      const obligation=this.obligation(id)
      if(!obligation) throw new Error("Unknown obligation")
      const evidence=refs.map(ref=>this.require(ref))
      for(const validator of obligation.validators) {
        const proof=evidence.find(e=>e.validatorVersion===validator && ["test","runtime"].includes(e.type) && digest(e.inputVector)===digest(obligation.tuple) && (e.content as {passed?:boolean})?.passed===true)
        if(!proof) throw new Error("Missing actual validation for the pinned tuple")
      }
      obligation.state="satisfied"; obligation.evidence=refs
      this.store.db.prepare("UPDATE validation_obligations SET state=?,payload=? WHERE id=?").run(obligation.state,JSON.stringify(obligation),id)
      this.store.event({id:randomUUID(),type:"ValidationSatisfied",entityId:obligation.entityId,correlationId:obligation.entityId,schemaVersion:1,timestamp:Date.now(),payload:{obligationId:id,evidence:refs}})
      return obligation
    })
  }
  unresolved(entityId:string): Obligation[] {
    return this.store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=? AND mandatory=1").all(entityId)
      .map(r=>JSON.parse(String(r.payload)) as Obligation).filter(o=>this.applicable(o)&&!this.satisfied(o))
  }
  /** An attempt-scoped observation is replaced only by a mandatory obligation
   * atomically pinned for the current attempt. Historical failures remain stored. */
  applicable(obligation:Obligation):boolean {
    if(obligation.kind==="role-output"&&this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='specialist_question_resumptions'").get()) {
      const resumed=this.store.db.prepare("WITH RECURSIVE chain(decision_id,grant_id) AS (SELECT decision_id,new_grant FROM specialist_question_resumptions WHERE old_obligation=? UNION SELECT r.decision_id,r.new_grant FROM specialist_question_resumptions r JOIN chain c ON r.old_grant=c.grant_id AND r.decision_id=c.decision_id) SELECT 1 FROM chain c JOIN specialist_demands d ON d.decision_id=c.decision_id AND d.grant_id=c.grant_id WHERE d.mandatory=1").get(obligation.id)
      if(resumed)return false
    }
    if(obligation.kind.startsWith("integration:")&&this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='boundary_validation_state'").get()) {
      const current=this.store.db.prepare("SELECT version,tuple_hash FROM boundary_validation_state WHERE boundary_id=?").get(obligation.entityId)
      if(current) {
        const policy=obligation.tuple.find(input=>input.entityId===obligation.entityId&&input.port==="boundary"&&input.view==="integration-policy")
        if(policy&&policy.version!==Number(current.version))return false
        if(current.tuple_hash!=="pending")return current.tuple_hash===digest(obligation.tuple)
      }
    }
    if(obligation.kind!=="prediction-state")return true
    const pinned=obligation.tuple.find(v=>v.entityId===obligation.entityId&&v.port==="validation-attempt"&&v.view==="attempt")
    if(!pinned)return true
    const current=this.store.db.prepare("SELECT id FROM task_attempts WHERE task_id=? ORDER BY rowid DESC LIMIT 1").get(obligation.entityId)
    if(!current||pinned.hash===digest({attemptId:String(current.id)}))return true
    return !this.store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=? AND mandatory=1").all(obligation.entityId).some(row=>{
      const replacement=JSON.parse(String(row.payload)) as Obligation
      return replacement.kind===obligation.kind&&replacement.tuple.some(v=>v.entityId===obligation.entityId&&v.port==="validation-attempt"&&v.view==="attempt"&&v.hash===digest({attemptId:String(current.id)}))
    })
  }
  /** Satisfaction is a live evidence predicate, not a permanent status bit. */
  satisfied(obligation:Obligation,now=Date.now()):boolean {
    if(obligation.state!=="satisfied"||obligation.reason.some(ref=>!this.valid(ref,now)))return false
    const evidence=obligation.evidence.filter(ref=>this.valid(ref,now)).map(ref=>this.require(ref,now))
    return obligation.validators.every(validator=>evidence.some(e=>
      e.validatorVersion===validator&&["test","runtime"].includes(e.type)&&
      digest(e.inputVector)===digest(obligation.tuple)&&(e.content as {passed?:boolean})?.passed===true))
  }
}
export function aggregateConfidence(values:number[], weights?:number[]):number|null {
  if(!values.length) return null
  values.forEach(x=>unit(x,"Confidence"))
  if(!weights) return Math.min(...values)
  if(weights.length!==values.length) throw new Error("Confidence weight mismatch")
  return values.reduce((product,c,i)=>product*c**unit(weights[i]!,"Confidence weight"),1)
}
export function aggregateRisk(values:number[],independent:boolean):{value:number|null;kind:"probability"|"score"} {
  values.forEach(x=>unit(x,"Risk"))
  return {value:values.length ? independent ? 1-values.reduce((p,r)=>p*(1-r),1) : Math.max(...values) : null,kind:independent?"probability":"score"}
}
