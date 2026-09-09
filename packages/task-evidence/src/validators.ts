import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { realpathSync } from "node:fs"
import { resolve,relative,isAbsolute } from "node:path"
import { EvidenceStore } from "./index.ts"
import { digest } from "../../task-control/src/value.ts"
import type { VersionRef,VersionVector } from "../../task-causality/src/model.ts"
import { decodeSemanticOutput,type SemanticOutput } from "./semantic-output.ts"
import { nativeSandbox,type SandboxReceipt } from "./native-sandbox.ts"

export interface ValidatorSpec {
  id:string;version:number;command:string[];cwd:string;environment:Record<string,string>
  timeoutMs:number;maxOutputBytes:number;inputVector:VersionVector
  output?:"semantic-state"
  input?:unknown
  runtimeReadPaths?:string[]
}
export interface ValidationReceipt {
  validator:VersionRef;exitCode:number|null;signal:string|null;stdout:string;stderr:string;truncated:boolean;timedOut:boolean
  inputVector:VersionVector;commandHash:string;startedAt:number;finishedAt:number
  inputHash?:string
  isolation?:SandboxReceipt
}
/** Runs an already-authorized deterministic validator, never an arbitrary model-proposed command. */
export async function executeValidator(spec:ValidatorSpec,workspace:string,store:EvidenceStore,adapter:{isolation:"native"|"isolated-pod"}={isolation:"native"}):Promise<{receipt:ValidationReceipt;evidence:VersionRef}> {
  if(!spec.command.length||spec.command.some(s=>typeof s!=="string")||!Number.isSafeInteger(spec.timeoutMs)||spec.timeoutMs<1||!Number.isSafeInteger(spec.maxOutputBytes)||spec.maxOutputBytes<1)throw new Error("Invalid validator specification")
  const root=realpathSync(workspace),cwd=realpathSync(resolve(root,spec.cwd)),path=relative(root,cwd)
  if(path===".."||path.startsWith("../")||isAbsolute(path))throw new Error("Validator directory escapes workspace")
  const startedAt=Date.now()
  const sandbox=adapter.isolation==="native"?nativeSandbox(spec.command,root,cwd,spec.environment,spec.runtimeReadPaths):{command:spec.command,environment:spec.environment,receipt:{kind:"isolated-pod",network:false,workspaceReadOnly:true} satisfies SandboxReceipt,close:()=>{}}
  let receipt:ValidationReceipt
  try {receipt=await new Promise<ValidationReceipt>((resolveReceipt,reject)=>{
    const child=spawn(sandbox.command[0]!,sandbox.command.slice(1),{cwd,env:sandbox.environment,stdio:["pipe","pipe","pipe"],detached:process.platform!=="win32"})
    child.stdin.on("error",()=>{ /* a validator may close stdin after rejecting input */ })
    child.stdin.end(spec.input===undefined?undefined:JSON.stringify(spec.input))
    let stdout="",stderr="",bytes=0,truncated=false,timedOut=false
    const append=(target:"stdout"|"stderr",chunk:Buffer)=>{
      const available=Math.max(0,spec.maxOutputBytes-bytes)
      bytes+=chunk.length
      if(chunk.length>available)truncated=true
      const text=chunk.subarray(0,available).toString("utf8")
      if(target==="stdout")stdout+=text;else stderr+=text
    }
    child.stdout.on("data",chunk=>append("stdout",chunk))
    child.stderr.on("data",chunk=>append("stderr",chunk))
    const timer=setTimeout(()=>{
      timedOut=true
      try {if(process.platform!=="win32"&&child.pid)process.kill(-child.pid,"SIGKILL");else child.kill("SIGKILL")}catch(error){if((error as NodeJS.ErrnoException).code!=="ESRCH")reject(error)}
    },spec.timeoutMs)
    child.on("error",error=>{clearTimeout(timer);reject(error)})
    child.on("close",(exitCode,signal)=>{
      clearTimeout(timer)
      resolveReceipt({validator:{id:spec.id,version:spec.version},exitCode,signal,stdout,stderr,truncated,timedOut,inputVector:spec.inputVector,...(spec.input===undefined?{}:{inputHash:digest(spec.input)}),commandHash:digest({command:spec.command,cwd,environment:spec.environment}),isolation:sandbox.receipt,startedAt,finishedAt:Date.now()})
    })
  })}finally{sandbox.close()}
  let semantic:SemanticOutput|undefined,validationError:string|undefined
  if(spec.output==="semantic-state") {
    try {
      if(receipt.truncated)throw new Error("Semantic observation output was truncated")
      semantic=decodeSemanticOutput(receipt.stdout)
    }catch(error){validationError=error instanceof Error?error.message:"Invalid semantic observation"}
  }
  const content={passed:receipt.exitCode===0&&!receipt.timedOut&&!validationError,receipt,...semantic,...(validationError?{validationError}:{})}
  const evidence=store.put({id:randomUUID(),version:1,type:"test",source:`validator:${spec.id}/${spec.version}`,confidence:1,timestamp:receipt.finishedAt,contentHash:digest(content),content,inputVector:spec.inputVector,producer:"deterministic-validator",validatorVersion:`${spec.id}/v${spec.version}`,expiresAt:null})
  return {receipt,evidence}
}
