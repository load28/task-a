import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"
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
  reuse(ref:VersionRef,input:{dependencies:VersionVector;policy:VersionRef;role:VersionRef;taskSpecHash:string;validatorVersion:string;schemaVersion:string;now:number;validEvidence:(r:VersionRef)=>boolean;validAssumption:(r:VersionRef)=>boolean}):CognitiveRecord|undefined {
    const record=this.store.get<CognitiveRecord>("cognitive_records",ref.id,ref.version)
    if(!record||record.unresolvedQuestions.length||record.expiresAt!==null&&record.expiresAt<=input.now) return undefined
    if(this.store.db.prepare("SELECT 1 FROM cognitive_invalidations WHERE record_id=? AND record_version=?").get(ref.id,ref.version)) return undefined
    const vector=(v:VersionVector)=>[...v].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
    if(digest(vector(record.dependencyVersion))!==digest(vector(input.dependencies))||digest(record.policy)!==digest(input.policy)||digest(record.role)!==digest(input.role)||record.taskSpecHash!==input.taskSpecHash||record.validatorVersion!==input.validatorVersion||record.schemaVersion!==input.schemaVersion) return undefined
    if(!record.evidenceIndex.every(input.validEvidence)||!record.assumptions.every(input.validAssumption)) return undefined
    return record
  }
}
