import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { searchRegions,type RegionEvaluation } from "../../task-causality/src/regions.ts"
import { shouldSwitch } from "../../task-causality/src/prediction.ts"
import { canonical,digest } from "./value.ts"

const COST_PARTS=["planning","reasoning","context","reexecution","integration","interruption","discardedWork","warmSessionLoss","dataMigration","expectedFailure"] as const
interface SelectionInput {id:string;required:string[];candidates:string[][];domainComplete:boolean;context:unknown;evidence:VersionRef[]}
type SelectionResult=ReturnType<typeof searchRegions>&{calibration?:ReturnType<ControlRuntime["regionCosts"]["summary"]>;switchDecision?:{switch:boolean;keepExpectedFailure:{estimate:number;lower:number;upper:number};newExpectedFailure:{estimate:number;lower:number;upper:number};switchCost:{estimate:number;upper:number};currentValid:boolean;rule:string}}
export class RegionSelection {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS region_candidate_evaluations(selection_id TEXT NOT NULL,candidate_id TEXT NOT NULL,obligation_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(selection_id,candidate_id))")
  }
  choose(input:SelectionInput,policy:NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>):SelectionResult|undefined {
    const {store,evidence}=this.runtime
    const calibration=this.runtime.regionCosts.summary(policy)
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
      const content={candidate,required:input.required,context:input.context,costUnit:policy.costUnit,contract:{feasible:"true, false, or unknown",costs:COST_PARTS,switching:{currentValid:"boolean; false for a critical invariant violation",keep:"estimate and lower/upper bounds",newFailure:"estimate and lower/upper bounds; estimate equals costs.expectedFailure"},rule:"Report every cost component and both uncertainty intervals in the registered common unit. Do not infer feasibility from high prediction error alone."}}
      const tuple=[{entityId:input.id,port:"candidate",view:"region-feasibility",version:1,hash:digest({contextHash,candidate})}]
      const proof=evidence.put({id:`region-candidate:${input.id}:${candidate.id}`,version:1,type:"runtime",source:"controller finite candidate domain",producer:"region-selection",validatorVersion:"region-candidate/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
      const obligation=evidence.createObligation({entityId:input.id,tuple,kind:"region-candidate",mandatory:true,validators:[policy.validator],reason:[...input.evidence,proof]})
      store.db.prepare("INSERT INTO region_candidate_evaluations VALUES(?,?,?,?)").run(input.id,candidate.id,obligation.id,canonical({contextHash,candidate}))
      pending=true
    }
    if(pending)return
    const result=searchRegions({candidates,affected:input.required,budget:policy.evaluationBudget,domainComplete:input.domainComplete,evaluate:candidate=>{
      const row=store.db.prepare("SELECT obligation_id FROM region_candidate_evaluations WHERE selection_id=? AND candidate_id=?").get(input.id,candidate.id)
      const obligation=row&&evidence.obligation(String(row.obligation_id))
      if(!obligation||!evidence.independentlySatisfied(obligation))return {feasible:"unknown",cost:null,evidence:[`unresolved:${candidate.id}`],reason:"Candidate validator failed, lost authority, or its evidence expired"}
      const proof=evidence.require(obligation.evidence[0]!),receipt=(proof.content as {receipt:ValidationReceipt}).receipt
      try {
        if(receipt.truncated)throw new Error("Truncated feasibility verdict")
        const output=JSON.parse(receipt.stdout)
        const estimate=output.switching,interval=(value:any)=>value&&[value.estimate,value.lower,value.upper].every(Number.isFinite)&&value.lower>=0&&value.lower<=value.estimate&&value.estimate<=value.upper
        if(![true,false,"unknown"].includes(output.feasible)||output.costUnit!==policy.costUnit||!output.reason||typeof output.costs!=="object"||!output.costs||COST_PARTS.some(part=>!Number.isFinite(output.costs[part])||output.costs[part]<0)||!estimate||typeof estimate.currentValid!=="boolean"||!interval(estimate.keep)||!interval(estimate.newFailure)||estimate.newFailure.estimate!==output.costs.expectedFailure)throw new Error("Malformed feasibility, switching estimate, or normalized cost output")
        const calibratedParts=new Set<string>(COST_PARTS.filter(part=>part!=="expectedFailure")),scalable=[...calibratedParts].reduce((sum,part)=>sum+output.costs[part],0),factor=calibration?.stable?calibration.factor:1
        const cost=scalable*factor+output.costs.expectedFailure
        if(!Number.isFinite(cost))throw new Error("Nonfinite normalized cost")
        const switching={currentValid:estimate.currentValid,keep:estimate.keep,newFailure:estimate.newFailure}
        return {feasible:output.feasible,cost,evidence:[`${proof.id}@${proof.version}`],reason:output.reason,switching,costComponents:Object.fromEntries(COST_PARTS.map(part=>[part,calibratedParts.has(part)?output.costs[part]*factor:output.costs[part]])),rawCostComponents:Object.fromEntries(COST_PARTS.map(part=>[part,output.costs[part]]))} satisfies RegionEvaluation
      }catch{return {feasible:"unknown",cost:null,evidence:[`${proof.id}@${proof.version}`],reason:"Candidate validator did not provide a valid typed feasibility and normalized cost"}}
    }})
    const selected=result.trace.find(item=>item.id===result.region?.id)?.evaluation
    if(!selected?.switching)return {...result,calibration,switchDecision:undefined}
    if(calibration&&!calibration.stable)return {...result,minimumProven:false,reason:`cost calibration unavailable: ${calibration.reason}`,calibration,switchDecision:undefined}
    const components=selected.costComponents!,replanningCost=components.planning!+components.reasoning!+components.context!+components.interruption!+components.warmSessionLoss!,executionChangeCost=components.reexecution!+components.integration!+components.discardedWork!+components.dataMigration!,switchUpper=replanningCost+executionChangeCost+selected.switching.newFailure.upper
    const switchDecision={switch:shouldSwitch(selected.switching.keep.lower,replanningCost,executionChangeCost,selected.switching.newFailure.upper,selected.switching.currentValid),keepExpectedFailure:selected.switching.keep,newExpectedFailure:selected.switching.newFailure,replanningCost,executionChangeCost,switchCost:{estimate:selected.cost!,upper:switchUpper},currentValid:selected.switching.currentValid,rule:"switch when current plan is invalid or conservative keep lower bound exceeds switch upper bound"}
    return {...result,calibration,switchDecision}
  }
}
