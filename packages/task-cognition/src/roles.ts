import { randomUUID } from "node:crypto"
import { ControlStore } from "../../task-control/src/store.ts"
import { canonical, digest, unit } from "../../task-control/src/value.ts"
import type { RoleVersion } from "./model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"

export interface RoleEvaluation {
  evidence:VersionRef[];specializedEpisodes:string[];existingCapabilityGap:boolean;reusableCapability:boolean
  usefulGainLowerBound:number;overlapUpperBound:number;effectiveSamples:number;authorization:VersionRef[]
}
export interface RoleGate {minimumSamples:number;maxOverlap:number;approvalRequired:boolean}
export interface RoleLifecycleRecord {
  role:VersionRef;roleHash:string;source:"configured"|"learned";stage:RoleVersion["lifecycle"]
  evaluation?:RoleEvaluation;gate?:RoleGate;configuration?:string;recordedAt:number
}

/** The only execution trust source for roles. A role row without a matching
 * immutable lifecycle record remains inert even when written directly. */
export class RoleRegistry {
  readonly store:ControlStore
  constructor(store:ControlStore){
    this.store=store
    store.db.exec(`CREATE TABLE IF NOT EXISTS role_lifecycle_records(
      role_id TEXT NOT NULL,role_version INTEGER NOT NULL,role_hash TEXT NOT NULL,source TEXT NOT NULL,payload TEXT NOT NULL,
      PRIMARY KEY(role_id,role_version));
      CREATE TRIGGER IF NOT EXISTS role_lifecycle_record_update BEFORE UPDATE ON role_lifecycle_records BEGIN SELECT RAISE(ABORT,'Immutable role lifecycle'); END;
      CREATE TRIGGER IF NOT EXISTS role_lifecycle_record_delete BEFORE DELETE ON role_lifecycle_records BEGIN SELECT RAISE(ABORT,'Immutable role lifecycle'); END;`)
  }
  installConfigured(role:RoleVersion,configuration:string):void {
    this.store.atomic(()=>{
      this.definition(role)
      if(role.lifecycle!=="persistent"||!configuration.trim())throw new Error("Configured roles require a named persistent baseline")
      const existing=this.record({id:role.id,version:role.version})
      if(existing){
        if(existing.source!=="configured"||existing.configuration!==configuration||existing.roleHash!==digest(role))throw new Error("Role lifecycle identity conflict")
        return
      }
      const expected=role.version-1
      if(this.store.head("role_versions",role.id)!==expected)throw new Error("Stale configured role version")
      this.write(role,{role:{id:role.id,version:role.version},roleHash:digest(role),source:"configured",stage:role.lifecycle,configuration,recordedAt:Date.now()},expected)
    })
  }
  register(role:RoleVersion,expected:number,evaluation:RoleEvaluation,gate:RoleGate,validEvidence:(ref:VersionRef)=>boolean):void {
    this.store.atomic(()=>{
      this.definition(role)
      if(!role.capabilities.length||!role.validators.length)throw new Error("Incomplete learned role definition")
      const existing=this.record({id:role.id,version:role.version})
      if(existing){
        if(existing.source!=="learned"||existing.roleHash!==digest(role)||digest(existing.evaluation)!==digest(evaluation)||digest(existing.gate)!==digest(gate))throw new Error("Role lifecycle identity conflict")
        return
      }
      if(role.version!==expected+1||this.store.head("role_versions",role.id)!==expected)throw new Error("Stale role version")
      if(!evaluation.evidence.length||digest(role.evidence)!==digest(evaluation.evidence)||!evaluation.evidence.every(validEvidence))throw new Error("Role lifecycle needs current pinned evidence")
      if(evaluation.authorization.some(ref=>!validEvidence(ref)))throw new Error("Role authorization is not current")
      unit(evaluation.overlapUpperBound,"Role overlap")
      if(!Number.isFinite(evaluation.usefulGainLowerBound)||!Number.isSafeInteger(evaluation.effectiveSamples)||evaluation.effectiveSamples<0)throw new Error("Invalid role evaluation")
      const prior=expected?this.store.get<RoleVersion>("role_versions",role.id,expected):undefined
      const next=prior?.lifecycle==="candidate"?"temporary":prior?.lifecycle==="temporary"?"validated":prior?.lifecycle==="validated"?"persistent":"candidate"
      if(role.lifecycle!==next)throw new Error("Role lifecycle cannot skip stages")
      if(!evaluation.existingCapabilityGap||!evaluation.reusableCapability||new Set(evaluation.specializedEpisodes).size<2)throw new Error("A reusable capability gap requires independent repeated work")
      if(role.lifecycle==="validated"||role.lifecycle==="persistent") {
        if(evaluation.effectiveSamples<gate.minimumSamples||evaluation.usefulGainLowerBound<=0||evaluation.overlapUpperBound>gate.maxOverlap)throw new Error("Role has not met quality/cost gates")
      }
      if(role.lifecycle==="persistent"&&gate.approvalRequired&&!evaluation.authorization.length)throw new Error("Persistent role requires configured authorization")
      this.write(role,{role:{id:role.id,version:role.version},roleHash:digest(role),source:"learned",stage:role.lifecycle,evaluation,gate,recordedAt:Date.now()},expected)
    })
  }
  record(ref:VersionRef):RoleLifecycleRecord|undefined {
    const row=this.store.db.prepare("SELECT payload FROM role_lifecycle_records WHERE role_id=? AND role_version=?").get(ref.id,ref.version)
    return row?JSON.parse(String(row.payload)):undefined
  }
  executable(ref:VersionRef,validEvidence:(ref:VersionRef)=>boolean):boolean {
    const role=this.store.get<RoleVersion>("role_versions",ref.id,ref.version),record=this.record(ref)
    if(!role||!record||record.roleHash!==digest(role)||record.stage!==role.lifecycle||role.lifecycle==="candidate")return false
    if(record.source==="learned")return !!record.evaluation&&record.evaluation.evidence.every(validEvidence)&&record.evaluation.authorization.every(validEvidence)
    return true
  }
  private definition(role:RoleVersion):void {
    if(!role.id.trim()||!role.name.trim()||!role.purpose.trim()||!role.prompt.trim())throw new Error("Incomplete executable role definition")
    if(!Number.isSafeInteger(role.version)||role.version<1||new Set(role.allowedTools).size!==role.allowedTools.length||new Set(role.validators).size!==role.validators.length)throw new Error("Invalid role definition")
  }
  private write(role:RoleVersion,record:RoleLifecycleRecord,expected:number):void {
    this.store.put("role_versions",role.id,role.version,role)
    this.store.db.prepare("INSERT INTO role_lifecycle_records VALUES(?,?,?,?,?)").run(role.id,role.version,record.roleHash,record.source,canonical(record))
    this.store.advance("role_versions",role.id,expected,role.version)
    this.store.event({id:randomUUID(),type:"RoleUpdated",entityId:role.id,correlationId:role.id,schemaVersion:1,timestamp:record.recordedAt,payload:{role:record.role,source:record.source,stage:record.stage,evaluation:record.evaluation??null,gate:record.gate??null}})
  }
}
