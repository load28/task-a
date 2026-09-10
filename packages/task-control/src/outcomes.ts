import type { ControlRuntime } from "./runtime.ts"
import type { ControlledRequest } from "./requests.ts"
import type { AgentOutput,ActivationGrant } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { digest } from "./value.ts"

/** Historical measurements are observations, not counterfactual usefulness labels. */
export class OutcomeRecorder {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime}
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("request-outcomes/v1","accepted-measurements/v1",event=>{
      if(event.type!=="RequestCompleted")return
      const payload=event.payload as {requestId:string;evidence:VersionRef},request=this.runtime.requests.get(payload.requestId) as ControlledRequest|undefined
      if(!request||request.state!=="completed")return
      evidence.require(payload.evidence)
      const rows=store.db.prepare("SELECT g.id,g.state,g.payload,r.payload AS run_payload FROM activation_grants g JOIN controlled_tasks t ON t.task_id=g.task_id LEFT JOIN agent_runs r ON r.grant_id=g.id WHERE t.request_id=? ORDER BY g.id").all(request.id)
      const runs=rows.map(row=>{
        const grant=JSON.parse(String(row.payload)) as ActivationGrant
        const result=row.run_payload?JSON.parse(String(row.run_payload)) as {output?:AgentOutput;usage?:{inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}}:undefined
        return {grantId:grant.id,taskId:grant.taskId,role:grant.role,policy:grant.policy,profile:grant.profile,inputBoundary:grant.inputBoundary??null,state:String(row.state),usage:result?.usage??null,outputHash:result?.output?digest(result.output):null}
      })
      const known=runs.filter(run=>run.usage!==null)
      const sum=(key:"inputTokens"|"outputTokens"|"toolCalls"|"elapsedMs")=>known.reduce((total,run)=>total+run.usage![key],0)
      const unknownChannels=[...new Set(runs.flatMap(run=>run.inputBoundary?Object.entries(run.inputBoundary.channels).filter(([,state])=>state==="unknown").map(([channel])=>channel):["legacy-boundary"]))].sort()
      const content={requestId:request.id,program:request.program,goalEvidence:request.evidence,completionEvidence:payload.evidence,runs,cost:{inputTokens:sum("inputTokens"),outputTokens:sum("outputTokens"),toolCalls:sum("toolCalls"),elapsedWorkMs:sum("elapsedMs"),complete:known.length===runs.length},inputCoverage:{complete:unknownChannels.length===0,unknownChannels},sampleType:runs.every(run=>run.profile.provider==="test")?"synthetic":"observed",quality:{requestCompleted:true,completionEvidence:payload.evidence,usefulActivations:null,requiredActivations:null,missedFailures:null},coverage:"Accepted execution receipts; parallel elapsed work is not wall-clock latency. Completion does not prove counterfactual activation usefulness or recall."}
      const ref={id:`request-outcome:${request.id}`,version:1}
      store.put("outcome_labels",ref.id,ref.version,{...ref,type:"request-outcome",timestamp:event.timestamp,...content})
      store.event({id:ref.id,type:"OutcomeRecorded",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:event.timestamp,payload:{outcome:ref,contentHash:digest(content)}})
    },1000)
  }
}
