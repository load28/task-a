import type { ControlRuntime } from "./runtime.ts"
import { digest } from "./value.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { PolicyProposal } from "../../task-policy/src/index.ts"
import type { ShadowPrediction,ShadowTrial } from "../../task-policy/src/replay.ts"

export type AcceptanceScenario="shared-infrastructure"|"local-a1-repair"|"external-contract-change"
export interface AcceptanceStage {name:string;eventId:string}
export interface PreservationClaim {entityId:string;beforeHash:string;afterHash:string}
export interface ArchitectureAcceptanceTrace {
  id:string;version:1;scenario:AcceptanceScenario;episode:string;stages:AcceptanceStage[]
  proposal:VersionRef;evidence:VersionRef[];reconsidered:string[];preserved:PreservationClaim[];hash:string
}

const CONTRACTS:Record<AcceptanceScenario,Array<[string,string[]]>>={
  "shared-infrastructure":[
    ["infrastructure-change",["ARTIFACT_VERSIONED","CONTRACT_UPDATED","FileVersionObserved"]],
    ["static-validation",["ValidatorPassed","ValidationSatisfied"]],
    ["role-selection",["ActivationGrantIssued"]],
    ["integration-failure",["INTEGRATION_FAILED","JointIntegrationFailed"]],
    ["causal-repair",["TASK_CREATED","TASK_STALE","TASK_REOPENED","RegionalRepairApplied"]],
    ["learned-policy",["PolicyProposed"]],
    ["shadow-improvement",["PolicyShadowPredicted"]],
  ],
  "local-a1-repair":[
    ["a1-change",["ARTIFACT_VERSIONED","FileVersionObserved"]],
    ["causal-propagation",["ARTIFACT_STALE","TASK_STALE","InputObservationChanged"]],
    ["scoped-revision",["TASK_REOPENED","TASK_STARTED","RegionalRepairApplied"]],
    ["integration-recheck",["INTEGRATION_STARTED","ValidationRequired"]],
    ["learned-policy",["PolicyProposed"]],
  ],
  "external-contract-change":[
    ["contract-change",["CONTRACT_UPDATED","InputObservationChanged","FileVersionObserved"]],
    ["consumer-wakeup",["TASK_STALE","TaskStateCommitted","InputObservationChanged","FileInputInvalidated"]],
    ["learned-policy",["PolicyProposed"]],
  ],
}

/** Durable proof that a full acceptance scenario is connected through actual runtime records. */
export class ArchitectureAcceptance {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime}
  record(input:Omit<ArchitectureAcceptanceTrace,"version"|"hash">):ArchitectureAcceptanceTrace {
    const {store}=this.runtime,contract=CONTRACTS[input.scenario]
    if(!input.id.trim()||!input.episode.trim()||input.stages.length!==contract.length)throw new Error("Incomplete architecture acceptance trace")
    if(new Set(input.reconsidered).size!==input.reconsidered.length||new Set(input.preserved.map(item=>item.entityId)).size!==input.preserved.length)throw new Error("Duplicate acceptance scope")
    if(input.reconsidered.some(id=>input.preserved.some(item=>item.entityId===id))||input.preserved.some(item=>!item.entityId||item.beforeHash!==item.afterHash))throw new Error("Preserved scope changed or overlaps reconsidered scope")
    if(input.scenario!=="shared-infrastructure"&&(!input.reconsidered.length||!input.preserved.length))throw new Error("Sparse acceptance trace requires changed and preserved scopes")
    const proposal=store.get<PolicyProposal>("policy_proposals",input.proposal.id,input.proposal.version)
    if(!proposal)throw new Error("Acceptance trace requires a learned policy proposal")
    input.evidence.forEach(ref=>this.runtime.evidence.require(ref))
    if(!input.evidence.length||input.evidence.some(ref=>![...proposal.evidence,...proposal.supportingCases].some(item=>digest(item)===digest(ref))))throw new Error("Learned policy does not cite the trace evidence")
    let previous=0
    for(let index=0;index<contract.length;index++) {
      const expected=contract[index]!,stage=input.stages[index]!
      const row=store.db.prepare("SELECT sequence,type,payload FROM event_outbox WHERE id=?").get(stage.eventId)
      if(stage.name!==expected[0]||!row||!expected[1].includes(String(row.type))||Number(row.sequence)<=previous)throw new Error("Acceptance stages are missing, out of order, or semantically mismatched")
      previous=Number(row.sequence);this.assertBacked(String(row.type),JSON.parse(String(row.payload)),input.proposal)
    }
    const value={...input,version:1 as const,hash:digest(input)},prior=store.get<ArchitectureAcceptanceTrace>("architecture_acceptance_traces",input.id,1)
    if(prior){if(prior.hash!==value.hash)throw new Error("Architecture acceptance trace is immutable");return prior}
    store.atomic(()=>{
      store.put("architecture_acceptance_traces",value.id,1,value)
      store.event({id:`architecture-acceptance:${value.id}`,type:"ArchitectureAcceptanceRecorded",entityId:value.episode,correlationId:value.episode,causationId:value.stages.at(-1)!.eventId,schemaVersion:1,timestamp:Date.now(),payload:{trace:{id:value.id,version:1},scenario:value.scenario,proposal:value.proposal}})
    })
    return value
  }
  private assertBacked(type:string,event:{entityId?:string;payload?:any},proposal:VersionRef):void {
    const {store}=this.runtime,payload=event.payload??{}
    if(type==="ActivationGrantIssued") {
      const row=store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(String(payload.grantId??""))
      if(!row||digest(JSON.parse(String(row.payload)).role)!==digest(payload.role))throw new Error("Role selection event has no matching grant")
    }
    if(type==="ValidatorPassed") {
      const job=store.db.prepare("SELECT state,payload FROM validation_jobs WHERE id=?").get(String(payload.jobId??""))
      if(job?.state!=="passed"||!this.runtime.evidence.valid(payload.evidence))throw new Error("Static pass has no executed validator receipt")
    }
    if(type==="TaskStateCommitted"&&payload.task?.id!==event.entityId)throw new Error("Consumer wakeup event has no matching task projection")
    if(type==="PolicyProposed"&&digest(payload.proposal)!==digest(proposal))throw new Error("Trace policy event does not match the learned proposal")
    if(type==="PolicyShadowPredicted") {
      const prediction=store.get<ShadowPrediction>("policy_shadow_predictions",payload.prediction?.id,payload.prediction?.version)
      const trial=prediction&&store.get<ShadowTrial>("policy_shadow_trials",prediction.trial.id,prediction.trial.version)
      if(!prediction||!trial||digest(trial.proposal)!==digest(proposal)||prediction.predicted!=="activate"||prediction.actual==="activate")throw new Error("Shadow stage does not demonstrate an additional useful activation candidate")
    }
  }
}
