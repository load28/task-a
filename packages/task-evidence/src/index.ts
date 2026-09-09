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
    return !!value && digest(value.content)===value.contentHash && (value.expiresAt===null||value.expiresAt>now)
  }
  require(ref:VersionRef,now=Date.now()): Evidence {
    if(!this.valid(ref,now)) throw new Error("Missing or expired evidence")
    return this.store.get<Evidence>("evidence_versions",ref.id,ref.version)!
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
    if(obligation.state!=="satisfied")return false
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
