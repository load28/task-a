import { randomUUID } from "node:crypto"
import { ControlStore } from "../../task-control/src/store.ts"
import { canonical, unit } from "../../task-control/src/value.ts"
import type { RoleVersion } from "./model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"

export interface RoleEvaluation {
  evidence:VersionRef[];specializedEpisodes:string[];existingCapabilityGap:boolean;reusableCapability:boolean
  usefulGainLowerBound:number;overlapUpperBound:number;effectiveSamples:number;authorized:boolean
}
export class RoleRegistry {
  readonly store:ControlStore
  constructor(store:ControlStore){this.store=store}
  register(role:RoleVersion,expected:number,evaluation:RoleEvaluation,gate:{minimumSamples:number;maxOverlap:number;approvalRequired:boolean},validEvidence:(ref:VersionRef)=>boolean):void {
    this.store.atomic(()=>{
      if(!role.id||!role.purpose||!role.prompt||!role.capabilities.length||!role.validators.length)throw new Error("Incomplete executable role definition")
      if(role.version!==expected+1||this.store.head("role_versions",role.id)!==expected)throw new Error("Stale role version")
      if(!evaluation.evidence.length||!evaluation.evidence.every(validEvidence))throw new Error("Role lifecycle needs evidence")
      unit(evaluation.overlapUpperBound,"Role overlap")
      if(!Number.isFinite(evaluation.usefulGainLowerBound)||!Number.isSafeInteger(evaluation.effectiveSamples)||evaluation.effectiveSamples<0)throw new Error("Invalid role evaluation")
      const prior=expected?this.store.get<RoleVersion>("role_versions",role.id,expected):undefined
      const next=prior?.lifecycle==="candidate"?"temporary":prior?.lifecycle==="temporary"?"validated":prior?.lifecycle==="validated"?"persistent":"candidate"
      if(role.lifecycle!==next)throw new Error("Role lifecycle cannot skip stages")
      if(!evaluation.existingCapabilityGap||!evaluation.reusableCapability||new Set(evaluation.specializedEpisodes).size<2)throw new Error("A reusable capability gap requires independent repeated work")
      if(role.lifecycle==="validated"||role.lifecycle==="persistent") {
        if(evaluation.effectiveSamples<gate.minimumSamples||evaluation.usefulGainLowerBound<=0||evaluation.overlapUpperBound>gate.maxOverlap)throw new Error("Role has not met quality/cost gates")
      }
      if(role.lifecycle==="persistent"&&gate.approvalRequired&&!evaluation.authorized)throw new Error("Persistent role requires configured authorization")
      this.store.put("role_versions",role.id,role.version,role)
      this.store.advance("role_versions",role.id,expected,role.version)
      this.store.event({id:randomUUID(),type:"RoleUpdated",entityId:role.id,correlationId:role.id,schemaVersion:1,timestamp:Date.now(),payload:{role:{id:role.id,version:role.version},evaluation}})
    })
  }
}
