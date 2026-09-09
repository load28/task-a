import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"
import { decisionValid } from "../../task-control/src/decisions.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { ControlStore } from "../../task-control/src/store.ts"
import { digest } from "../../task-control/src/value.ts"

export interface CognitiveRecord {
  id:string;version:number;kind:"decision"|"analysis"|"test"|"architecture"|"dependency-summary"|"risk"|"research"
  taskSpecHash:string;policy:VersionRef;role:VersionRef;validatorVersion:string;schemaVersion:string
  assumptions:VersionRef[];conclusions:unknown[];unresolvedQuestions:string[];evidenceIndex:VersionRef[]
  dependencyVersion:VersionVector;level:0|1|2|3|4;content:unknown;expiresAt:number|null
}
export class CognitiveMemory {
  readonly store:ControlStore
  constructor(store:ControlStore){this.store=store}
  key(record:Omit<CognitiveRecord,"id"|"version"|"content"|"conclusions"|"unresolvedQuestions"|"level"|"expiresAt">):string {return digest(record)}
  save(record:CognitiveRecord):void {
    this.store.atomic(()=>{
      this.store.put("cognitive_records",record.id,record.version,record)
      for(const dep of record.dependencyVersion) this.store.db.prepare("INSERT OR IGNORE INTO cognitive_dependencies VALUES(?,?,?,?,?,?,?)").run(record.id,record.version,dep.entityId,dep.port,dep.view,dep.version,dep.hash)
    })
  }
  invalidate(entity:string,port:string,view:string,currentHash:string,eventId:string):VersionRef[] {
    return this.store.atomic(()=>{
      const rows=this.store.db.prepare("SELECT record_id,record_version FROM cognitive_dependencies WHERE entity_id=? AND port=? AND view=? AND hash!=?").all(entity,port,view,currentHash)
      for(const row of rows) this.store.db.prepare("INSERT OR IGNORE INTO cognitive_invalidations VALUES(?,?,?)").run(String(row.record_id),Number(row.record_version),eventId)
      return rows.map(r=>({id:String(r.record_id),version:Number(r.record_version)}))
    })
  }
  ingest():number {
    return this.store.consume("cognitive-validity/v1","reference-index/v1",event=>{
      let kind:string,ref:VersionRef|undefined
      if(event.type==="EvidenceExpired"||event.type==="EvidenceRetracted") {kind="evidence";ref=(event.payload as {evidence:VersionRef}).evidence}
      else if(event.type==="DecisionInvalidated") {kind="decision";ref=(event.payload as {decision:VersionRef}).decision}
      else if(event.type==="AssumptionInvalidated") {kind="assumption";ref=(event.payload as {assumption:VersionRef}).assumption}
      else if(event.type==="PolicyRolledBack") {kind="policy";ref=(event.payload as {previous?:{policy:VersionRef}}).previous?.policy}
      else return
      if(!ref)return
      this.store.db.prepare("INSERT OR IGNORE INTO cognitive_retired_references VALUES(?,?,?,?)").run(kind,ref.id,ref.version,event.id)
      for(const row of this.store.db.prepare("SELECT record_id,record_version FROM cognitive_references WHERE kind=? AND ref_id=? AND ref_version=?").all(kind,ref.id,ref.version))this.store.db.prepare("INSERT OR IGNORE INTO cognitive_invalidations VALUES(?,?,?)").run(String(row.record_id),Number(row.record_version),event.id)
    },1000)
  }
  reuse(ref:VersionRef,input:{dependencies:VersionVector;policy:VersionRef;role:VersionRef;taskSpecHash:string;validatorVersion:string;schemaVersion:string;now:number;validEvidence:(r:VersionRef)=>boolean;validAssumption:(r:VersionRef)=>boolean}):CognitiveRecord|undefined {
    const record=this.store.get<CognitiveRecord>("cognitive_records",ref.id,ref.version)
    if(!record||record.unresolvedQuestions.length||record.expiresAt!==null&&record.expiresAt<=input.now) return undefined
    if(this.store.db.prepare("SELECT 1 FROM cognitive_invalidations WHERE record_id=? AND record_version=?").get(ref.id,ref.version)) return undefined
    if(this.store.db.prepare("SELECT 1 FROM cognitive_references c JOIN cognitive_retired_references r ON r.kind=c.kind AND r.ref_id=c.ref_id AND r.ref_version=c.ref_version WHERE c.record_id=? AND c.record_version=?").get(ref.id,ref.version))return undefined
    const evidence=new EvidenceStore(this.store)
    if(record.evidenceIndex.some(item=>!evidence.valid(item,input.now)))return undefined
    for(const ref of record.assumptions) {
      if(!this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='assumption_validity'").get())return undefined
      const state=this.store.db.prepare("SELECT state,obligation_id FROM assumption_validity WHERE id=? AND version=?").get(ref.id,ref.version)
      if(state?.state!=="valid"||!evidence.satisfied(evidence.obligation(String(state.obligation_id))!))return undefined
    }
    for(const dep of record.dependencyVersion.filter(dep=>dep.port==="conclusion"&&dep.view==="decision")) {
      if(!this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='decision_validity'").get()||!decisionValid(this.store,{id:dep.entityId,version:dep.version}))return undefined
    }
    const vector=(v:VersionVector)=>[...v].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
    if(digest(vector(record.dependencyVersion))!==digest(vector(input.dependencies))||digest(record.policy)!==digest(input.policy)||digest(record.role)!==digest(input.role)||record.taskSpecHash!==input.taskSpecHash||record.validatorVersion!==input.validatorVersion||record.schemaVersion!==input.schemaVersion) return undefined
    if(!record.evidenceIndex.every(input.validEvidence)||!record.assumptions.every(input.validAssumption)) return undefined
    return record
  }
}
