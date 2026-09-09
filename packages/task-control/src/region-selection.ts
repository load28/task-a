import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { searchRegions,type RegionEvaluation } from "../../task-causality/src/regions.ts"
import { canonical,digest } from "./value.ts"

const COST_PARTS=["planning","reasoning","context","reexecution","integration","expectedFailure"] as const
interface SelectionInput {id:string;required:string[];candidates:string[][];domainComplete:boolean;context:unknown;evidence:VersionRef[]}
export class RegionSelection {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS region_candidate_evaluations(selection_id TEXT NOT NULL,candidate_id TEXT NOT NULL,obligation_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(selection_id,candidate_id))")
  }
  choose(input:SelectionInput,policy:NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>):ReturnType<typeof searchRegions>|undefined {
    const {store,evidence}=this.runtime
    const candidates=[...new Map(input.candidates.map(nodes=>{const unique=[...new Set(nodes)].sort();return [digest(unique),{id:digest(unique),nodes:unique,lowerBound:0}]})).values()].sort((a,b)=>a.id.localeCompare(b.id))
    const contextHash=digest({context:input.context,policy,candidates,required:input.required})
    let issued=0,pending=false
    for(const candidate of candidates.filter(c=>input.required.every(id=>c.nodes.includes(id)))) {
      if(issued++>=policy.evaluationBudget)break
      const prior=store.db.prepare("SELECT * FROM region_candidate_evaluations WHERE selection_id=? AND candidate_id=?").get(input.id,candidate.id)
      if(prior) {
        if(JSON.parse(String(prior.payload)).contextHash!==contextHash)throw new Error("Region selection inputs changed during feasibility evaluation")
        const obligation=evidence.obligation(String(prior.obligation_id))!
        if(!["failed","passed"].includes(String(store.db.prepare("SELECT state FROM validation_jobs WHERE obligation_id=? AND validator=?").get(obligation.id,policy.validator)?.state)))pending=true
        continue
      }
      const content={candidate,required:input.required,context:input.context,costUnit:policy.costUnit,contract:{feasible:"true, false, or unknown",costs:COST_PARTS,rule:"Report every cost component in the registered common unit. Do not infer feasibility from high prediction error alone."}}
      const tuple=[{entityId:input.id,port:"candidate",view:"region-feasibility",version:1,hash:digest({contextHash,candidate})}]
      const proof=evidence.put({id:`region-candidate:${input.id}:${candidate.id}`,version:1,type:"runtime",source:"controller finite candidate domain",producer:"region-selection",validatorVersion:"region-candidate/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
      const obligation=evidence.createObligation({entityId:input.id,tuple,kind:"region-candidate",mandatory:false,validators:[policy.validator],reason:[...input.evidence,proof]})
      store.db.prepare("INSERT INTO region_candidate_evaluations VALUES(?,?,?,?)").run(input.id,candidate.id,obligation.id,canonical({contextHash,candidate}))
      pending=true
    }
    if(pending)return
    return searchRegions({candidates,affected:input.required,budget:policy.evaluationBudget,domainComplete:input.domainComplete,evaluate:candidate=>{
      const row=store.db.prepare("SELECT obligation_id FROM region_candidate_evaluations WHERE selection_id=? AND candidate_id=?").get(input.id,candidate.id)
      const obligation=row&&evidence.obligation(String(row.obligation_id))
      if(!obligation||!evidence.satisfied(obligation))return {feasible:"unknown",cost:null,evidence:[`unresolved:${candidate.id}`],reason:"Candidate validator failed or its evidence expired"}
      const proof=evidence.require(obligation.evidence[0]!),receipt=(proof.content as {receipt:ValidationReceipt}).receipt
      try {
        if(receipt.truncated)throw new Error("Truncated feasibility verdict")
        const output=JSON.parse(receipt.stdout)
        if(![true,false,"unknown"].includes(output.feasible)||output.costUnit!==policy.costUnit||!output.reason||typeof output.costs!=="object"||!output.costs||COST_PARTS.some(part=>!Number.isFinite(output.costs[part])||output.costs[part]<0))throw new Error("Malformed feasibility or cost output")
        const cost=COST_PARTS.reduce((sum,part)=>sum+output.costs[part],0)
        if(!Number.isFinite(cost))throw new Error("Nonfinite normalized cost")
        return {feasible:output.feasible,cost,evidence:[`${proof.id}@${proof.version}`],reason:output.reason} satisfies RegionEvaluation
      }catch{return {feasible:"unknown",cost:null,evidence:[`${proof.id}@${proof.version}`],reason:"Candidate validator did not provide a valid typed feasibility and normalized cost"}}
    }})
  }
}
