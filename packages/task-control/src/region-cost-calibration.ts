import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { canonical,digest } from "./value.ts"

type Policy=NonNullable<NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>["calibration"]>
type Usage={inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}
interface RepairSample {id:string;requestId:string;state:string;grantId:string;grantIds?:string[];selection?:{cost:number|null;trace:Array<{id:string;evaluation?:{costComponents?:Record<string,number>;rawCostComponents?:Record<string,number>}}>;region?:{id:string}};startedAt:number;appliedAt?:number;replacementTaskIds?:string[]}

export interface CalibrationSummary {key:string;samples:number;stable:boolean;factor:number;maximumObservedRelativeError:number;reason:string}

/** Converts immutable execution receipts into the same registered unit used by
 * finite-region estimates. Unmeasured samples never influence authorization. */
export class RegionCostCalibration {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS region_cost_calibration_samples(
      id TEXT PRIMARY KEY,calibration_key TEXT NOT NULL,request_id TEXT NOT NULL,repair_id TEXT NOT NULL,
      estimated REAL NOT NULL,actual REAL NOT NULL,relative_error REAL NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS region_cost_calibration_key ON region_cost_calibration_samples(calibration_key);`)
  }
  key(selection:NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>):string {
    return digest({validator:selection.validator,costUnit:selection.costUnit,calibration:selection.calibration})
  }
  private assert(policy:Policy):void {
    if(!Number.isSafeInteger(policy.version)||policy.version<1||!Number.isSafeInteger(policy.minimumSamples)||policy.minimumSamples<1||!Number.isFinite(policy.maximumRelativeError)||policy.maximumRelativeError<0||[policy.inputTokensPerUnit,policy.outputTokensPerUnit,policy.toolCallsPerUnit,policy.elapsedMsPerUnit].some(value=>!Number.isFinite(value)||value<=0))throw new Error("Invalid region cost calibration policy")
  }
  summary(selection:NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>):CalibrationSummary|undefined {
    const policy=selection.calibration
    if(!policy)return
    this.assert(policy)
    const key=this.key(selection),rows=this.runtime.store.db.prepare("SELECT actual,estimated,relative_error FROM region_cost_calibration_samples WHERE calibration_key=? ORDER BY rowid").all(key)
    const samples=rows.length,maximumObservedRelativeError=rows.reduce((maximum,row)=>Math.max(maximum,Number(row.relative_error)),0)
    const ratios=rows.map(row=>Number(row.actual)/Number(row.estimated)),stable=samples>=policy.minimumSamples&&maximumObservedRelativeError<=policy.maximumRelativeError
    return {key,samples,stable,factor:stable?Math.max(1,...ratios):1,maximumObservedRelativeError,reason:stable?"observed execution costs are within the registered error bound":samples<policy.minimumSamples?"insufficient completed repair samples":"observed execution cost exceeds the registered error bound"}
  }
  ingest():number {
    const {store}=this.runtime
    return store.consume("region-cost-calibration/v1","completed-repair-cost/v1",event=>{
      if(event.type!=="RequestCompleted")return
      const request=this.runtime.requests.get((event.payload as {requestId:string}).requestId),program=request?.program&&store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version),selectionPolicy=program?.replanner?.selection
      if(!request||!selectionPolicy?.calibration)return
      const policy=selectionPolicy.calibration;this.assert(policy)
      const repairs=store.db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? AND state='applied' ORDER BY rowid").all(request.id).map(row=>JSON.parse(String(row.payload)) as RepairSample)
      for(const repair of repairs) {
        const sampleId=`region-cost:${repair.id}`
        if(store.db.prepare("SELECT 1 FROM region_cost_calibration_samples WHERE id=?").get(sampleId))continue
        const evaluation=repair.selection?.trace.find(item=>item.id===repair.selection?.region?.id)?.evaluation,selected=evaluation?.rawCostComponents??evaluation?.costComponents
        if(!selected)continue
        const estimated=["planning","reasoning","context","reexecution"].reduce((sum,key)=>sum+(selected[key]??0),0)
        const grantIds=new Set(repair.grantIds?.length?repair.grantIds:[repair.grantId])
        for(const taskId of repair.replacementTaskIds??[])for(const row of store.db.prepare("SELECT g.id,g.payload FROM activation_grants g JOIN agent_runs r ON r.grant_id=g.id WHERE g.task_id=? AND r.state='completed'").all(taskId)) {
          const grant=JSON.parse(String(row.payload)) as ActivationGrant
          const completed=store.db.prepare("SELECT json_extract(payload,'$.timestamp') timestamp FROM event_outbox WHERE type='AgentCompleted' AND json_extract(payload,'$.payload.grantId')=? ORDER BY sequence DESC LIMIT 1").get(String(row.id))
          if(grant.executionMode==="task"&&Number(completed?.timestamp??0)>=repair.startedAt)grantIds.add(String(row.id))
        }
        const runs=[...grantIds].map(id=>store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=? AND state='completed'").get(id)).filter(Boolean).map(row=>JSON.parse(String(row!.payload)) as {usage?:Usage})
        if(!estimated||runs.length!==grantIds.size||runs.some(run=>!run.usage))continue
        const actual=runs.reduce((sum,run)=>sum+run.usage!.inputTokens/policy.inputTokensPerUnit+run.usage!.outputTokens/policy.outputTokensPerUnit+run.usage!.toolCalls/policy.toolCallsPerUnit+run.usage!.elapsedMs/policy.elapsedMsPerUnit,0)
        const relativeError=Math.abs(actual-estimated)/Math.max(actual,estimated)
        const content={requestId:request.id,repairId:repair.id,calibrationKey:this.key(selectionPolicy),policy,estimated,actual,relativeError,runIds:[...grantIds].sort(),scope:"replanner and replacement task model receipts; integration and expected failure are excluded"}
        store.db.prepare("INSERT INTO region_cost_calibration_samples VALUES(?,?,?,?,?,?,?,?)").run(sampleId,content.calibrationKey,request.id,repair.id,estimated,actual,relativeError,canonical(content))
        store.db.prepare("INSERT OR IGNORE INTO execution_costs VALUES(?,?,?,?,?,?,?)").run(sampleId,repair.grantId,"regional-repair","measured",actual,selectionPolicy.costUnit,canonical(content))
        store.event({id:sampleId,type:"RegionCostCalibrated",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:event.timestamp,payload:content})
      }
    },1000)
  }
}
