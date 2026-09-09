import { executeValidator,type ValidationReceipt } from "../packages/task-evidence/src/validators.ts"
import type { RegisteredValidator } from "../packages/task-evidence/src/registry.ts"
import type { Obligation,Evidence } from "../packages/task-evidence/src/index.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { snapshotCode } from "../packages/task-snapshots/src/index.ts"
const input=JSON.parse(process.env.TASK_VALIDATION_INPUT??"null") as {snapshotHash:string;validators:Array<{spec:RegisteredValidator;obligation:Obligation;evidence:Evidence[]}>;budget:{maxJobs:number;maxDurationMs:number}}
if(!input||!input.budget||input.validators.length>input.budget.maxJobs||input.validators.reduce((sum,item)=>sum+item.spec.timeoutMs,0)>input.budget.maxDurationMs)throw new Error("Isolated validation budget is missing or exceeded")
if(snapshotCode("/data/workspace").hash!==input.snapshotHash)throw new Error("Validation workspace differs from the stopped model output")
const local=createGraphRuntime(":memory:"),receipts:ValidationReceipt[]=[]
try {
  for(const {spec,obligation,evidence} of input.validators) {
    const result=await executeValidator({...spec,inputVector:obligation.tuple,input:{obligation,evidence}},"/data/workspace",local.control.evidence,{isolation:"isolated-pod"})
    receipts.push(result.receipt)
  }
  if(snapshotCode("/data/workspace").hash!==input.snapshotHash)throw new Error("Validation workspace changed during measurement")
  process.stdout.write(JSON.stringify({snapshotHash:input.snapshotHash,receipts})+"\n")
}finally{local.close()}
