import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { canonical,digest } from "./value.ts"

type Policy=NonNullable<NonNullable<NonNullable<ControllerProgram["replanner"]>["selection"]>["calibration"]>
type Usage={inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}
interface RepairSample {id:string;requestId:string;state:string;grantId:string;grantIds?:string[];selection?:{cost:number|null;trace:Array<{id:string;evaluation?:{costComponents?:Record<string,number>;rawCostComponents?:Record<string,number>}}>;region?:{id:string}};startedAt:number;appliedAt?:number;replacementTaskIds?:string[]}
const RECEIPT_COMPONENTS=["integration","interruption","discardedWork","warmSessionLoss","dataMigration","expectedFailure"] as const
type ReceiptComponent=typeof RECEIPT_COMPONENTS[number]
interface ComponentReceipt {id:string;repairId:string;category:ReceiptComponent;amount:number;unit:string;evidence:import("../../task-causality/src/model.ts").VersionRef[];source:string;recordedAt:number}

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
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS region_cost_component_receipts(id TEXT PRIMARY KEY,repair_id TEXT NOT NULL,category TEXT NOT NULL,amount REAL NOT NULL,unit TEXT NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS region_cost_component_repair ON region_cost_component_receipts(repair_id,category);
      CREATE TRIGGER IF NOT EXISTS region_cost_component_receipt_update BEFORE UPDATE ON region_cost_component_receipts BEGIN SELECT RAISE(ABORT,'Immutable cost receipt'); END;
      CREATE TRIGGER IF NOT EXISTS region_cost_component_receipt_delete BEFORE DELETE ON region_cost_component_receipts BEGIN SELECT RAISE(ABORT,'Immutable cost receipt'); END;`)
  }
  record(input:Omit<ComponentReceipt,"id"|"recordedAt">):ComponentReceipt {
    if(!RECEIPT_COMPONENTS.includes(input.category)||!Number.isFinite(input.amount)||input.amount<0||!input.unit.trim()||!input.source.trim()||!input.evidence.length)throw new Error("Invalid regional cost component receipt")
    const row=this.runtime.store.db.prepare("SELECT payload FROM request_region_repairs WHERE id=?").get(input.repairId)
    const repair=row&&JSON.parse(String(row.payload)) as RepairSample|undefined
    const request=repair&&this.runtime.requests.get(repair.requestId),program=request?.program&&this.runtime.store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version)
    if(!repair||program?.replanner?.selection?.costUnit!==input.unit)throw new Error("Cost receipt is outside the registered repair unit")
    input.evidence.forEach(ref=>this.runtime.evidence.require(ref))
    const id=`region-cost-receipt:${digest({repairId:input.repairId,category:input.category,source:input.source,evidence:input.evidence})}`,receipt:ComponentReceipt={...input,id,recordedAt:Date.now()}
    const prior=this.runtime.store.db.prepare("SELECT payload FROM region_cost_component_receipts WHERE id=?").get(id)
    if(prior) {
      const saved=JSON.parse(String(prior.payload)) as ComponentReceipt
      if(canonical({...saved,recordedAt:0})!==canonical({...receipt,recordedAt:0}))throw new Error("Cost receipt identity conflict")
      return saved
    }
    this.runtime.store.atomic(()=>{
      this.runtime.store.db.prepare("INSERT INTO region_cost_component_receipts VALUES(?,?,?,?,?,?)").run(id,input.repairId,input.category,input.amount,input.unit,canonical(receipt))
      this.runtime.store.db.prepare("INSERT OR IGNORE INTO execution_costs VALUES(?,?,?,?,?,?,?)").run(id,input.repairId,input.category,"measured",input.amount,input.unit,canonical(receipt))
      this.runtime.store.event({id:`component-recorded:${id}`,type:"RegionCostComponentRecorded",entityId:repair.requestId,correlationId:repair.requestId,schemaVersion:1,timestamp:receipt.recordedAt,payload:{repairId:repair.id,receiptId:id}})
    })
    return receipt
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
      if(!["RequestCompleted","RegionCostComponentRecorded","GrantDispatchTransition"].includes(event.type))return
      const requestedId=event.type==="RequestCompleted"?(event.payload as {requestId:string}).requestId:event.type==="GrantDispatchTransition"?event.correlationId:String(store.db.prepare("SELECT request_id FROM request_region_repairs WHERE id=?").get((event.payload as {repairId:string}).repairId)?.request_id??"")
      const request=this.runtime.requests.get(requestedId),program=request?.program&&store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version),selectionPolicy=program?.replanner?.selection
      if(!request||!selectionPolicy?.calibration)return
      const completionRow=store.db.prepare("SELECT json_extract(payload,'$.timestamp') timestamp,payload FROM event_outbox WHERE type='RequestCompleted' AND correlation_id=? ORDER BY sequence DESC LIMIT 1").get(request.id)
      if(!completionRow)return
      const policy=selectionPolicy.calibration;this.assert(policy)
      const repairs=store.db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? AND state='applied' ORDER BY rowid").all(request.id).map(row=>JSON.parse(String(row.payload)) as RepairSample)
      for(const repair of repairs) {
        const sampleId=`region-cost:${repair.id}`
        if(store.db.prepare("SELECT 1 FROM region_cost_calibration_samples WHERE id=?").get(sampleId))continue
        const evaluation=repair.selection?.trace.find(item=>item.id===repair.selection?.region?.id)?.evaluation,selected=evaluation?.rawCostComponents??evaluation?.costComponents
        if(!selected)continue
        const modelEstimated=["planning","reasoning","context","reexecution"].reduce((sum,key)=>sum+(selected[key]??0),0)
        const grantIds=new Set(repair.grantIds?.length?repair.grantIds:[repair.grantId])
        for(const taskId of repair.replacementTaskIds??[])for(const row of store.db.prepare("SELECT g.id,g.payload FROM activation_grants g JOIN agent_runs r ON r.grant_id=g.id WHERE g.task_id=? AND r.state='completed'").all(taskId)) {
          const grant=JSON.parse(String(row.payload)) as ActivationGrant
          const completed=store.db.prepare("SELECT json_extract(payload,'$.timestamp') timestamp FROM event_outbox WHERE type='AgentCompleted' AND json_extract(payload,'$.payload.grantId')=? ORDER BY sequence DESC LIMIT 1").get(String(row.id))
          if(grant.executionMode==="task"&&Number(completed?.timestamp??0)>=repair.startedAt)grantIds.add(String(row.id))
        }
        const runs=[...grantIds].map(id=>store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=? AND state='completed'").get(id)).filter(Boolean).map(row=>JSON.parse(String(row!.payload)) as {usage?:Usage})
        if(!modelEstimated||runs.length!==grantIds.size||runs.some(run=>!run.usage))continue
        const completion=(JSON.parse(String(completionRow.payload)).payload as {evidence:import("../../task-causality/src/model.ts").VersionRef}).evidence
        if((selected.expectedFailure??0)>0&&!store.db.prepare("SELECT 1 FROM region_cost_component_receipts WHERE repair_id=? AND category='expectedFailure'").get(repair.id))this.record({repairId:repair.id,category:"expectedFailure",amount:0,unit:selectionPolicy.costUnit,evidence:[completion],source:"terminal RequestCompleted conjunction"})
        if((selected.integration??0)>0)for(const row of store.db.prepare("SELECT j.id,j.payload,o.payload obligation FROM validation_jobs j JOIN validation_obligations o ON o.id=j.obligation_id WHERE j.state='passed' AND json_extract(o.payload,'$.kind') LIKE 'integration:%'").all()) {
          const obligation=JSON.parse(String(row.obligation)) as {tuple:Array<{entityId:string}>;evidence:import("../../task-causality/src/model.ts").VersionRef[]}
          if(!(repair.replacementTaskIds??[]).some(id=>obligation.tuple.some(input=>input.entityId===id)))continue
          const job=JSON.parse(String(row.payload)) as {evidence:import("../../task-causality/src/model.ts").VersionRef;receipt:{startedAt:number;finishedAt:number}}
          if(!this.runtime.evidence.valid(job.evidence)||!Number.isFinite(job.receipt?.startedAt)||!Number.isFinite(job.receipt?.finishedAt)||job.receipt.finishedAt<job.receipt.startedAt)continue
          this.record({repairId:repair.id,category:"integration",amount:(job.receipt.finishedAt-job.receipt.startedAt)/policy.elapsedMsPerUnit,unit:selectionPolicy.costUnit,evidence:[job.evidence],source:`validation-job:${row.id}`})
        }
        if((selected.interruption??0)>0&&!store.db.prepare("SELECT 1 FROM region_cost_component_receipts WHERE repair_id=? AND category='interruption'").get(repair.id)&&store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()) {
          const dispatches=store.db.prepare("SELECT d.grant_id,d.payload FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id JOIN controlled_tasks t ON t.task_id=g.task_id WHERE t.request_id=?").all(request.id).map(row=>({grantId:String(row.grant_id),payload:JSON.parse(String(row.payload)) as {transitions?:Array<{from:string;to:string;at:number;detail:unknown}>}}))
          if(dispatches.length&&dispatches.every(item=>Array.isArray(item.payload.transitions))) {
            const intervals=dispatches.flatMap(item=>{
              const transitions=item.payload.transitions!,result:Array<{grantId:string;startedAt:number;finishedAt:number}>=[]
              for(let index=0;index<transitions.length;index++)if(transitions[index]!.to==="stopping") {
                const end=transitions.slice(index+1).find(next=>["failed","cancelled","completed"].includes(next.to))
                if(end)result.push({grantId:item.grantId,startedAt:transitions[index]!.at,finishedAt:end.at})
              }
              return result
            }).filter(interval=>interval.startedAt>=repair.startedAt&&interval.finishedAt<=Number(completionRow.timestamp))
            const content={repairId:repair.id,requestId:request.id,intervals,source:"durable grant dispatch stop transitions",completion}
            const proof=this.runtime.evidence.put({id:`regional-interruption:${digest(content)}`,version:1,type:"runtime",source:"durable dispatch transition measurement",producer:"region-cost-calibration",validatorVersion:"dispatch-interruption/v1",timestamp:Number(completionRow.timestamp),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
            this.record({repairId:repair.id,category:"interruption",amount:intervals.reduce((sum,interval)=>sum+(interval.finishedAt-interval.startedAt)/policy.elapsedMsPerUnit,0),unit:selectionPolicy.costUnit,evidence:[proof],source:"durable grant dispatch stop transitions"})
          }
        }
        const componentRows=store.db.prepare("SELECT category,amount,payload FROM region_cost_component_receipts WHERE repair_id=? ORDER BY category,id").all(repair.id)
        const measured=new Map<string,number>()
        for(const row of componentRows)measured.set(String(row.category),(measured.get(String(row.category))??0)+Number(row.amount))
        const required=RECEIPT_COMPONENTS.filter(category=>(selected[category]??0)>0)
        if(required.some(category=>!measured.has(category)))continue
        const modelActual=runs.reduce((sum,run)=>sum+run.usage!.inputTokens/policy.inputTokensPerUnit+run.usage!.outputTokens/policy.outputTokensPerUnit+run.usage!.toolCalls/policy.toolCallsPerUnit+run.usage!.elapsedMs/policy.elapsedMsPerUnit,0)
        const estimated=Object.values(selected).reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0),actual=modelActual+required.reduce((sum,category)=>sum+measured.get(category)!,0)
        const relativeError=Math.abs(actual-estimated)/Math.max(actual,estimated)
        const content={requestId:request.id,repairId:repair.id,calibrationKey:this.key(selectionPolicy),policy,estimated,actual,relativeError,runIds:[...grantIds].sort(),components:{model:{estimated:modelEstimated,actual:modelActual},...Object.fromEntries(required.map(category=>[category,{estimated:selected[category],actual:measured.get(category)}]))},componentReceipts:componentRows.map(row=>(JSON.parse(String(row.payload)) as ComponentReceipt).id),scope:"all nonzero registered cost components require immutable measured receipts"}
        store.db.prepare("INSERT INTO region_cost_calibration_samples VALUES(?,?,?,?,?,?,?,?)").run(sampleId,content.calibrationKey,request.id,repair.id,estimated,actual,relativeError,canonical(content))
        store.db.prepare("INSERT OR IGNORE INTO execution_costs VALUES(?,?,?,?,?,?,?)").run(sampleId,repair.grantId,"regional-repair","measured",actual,selectionPolicy.costUnit,canonical(content))
        store.event({id:sampleId,type:"RegionCostCalibrated",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Number(completionRow.timestamp),payload:content})
      }
    },1000)
  }
}
