import { lstatSync, realpathSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { FileObservations } from "./file-observations.ts"
import { durableReplace } from "./durable-file.ts"
import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import type { ActivationGrant, ContextManifest } from "../../task-cognition/src/model.ts"
import { canonical, digest } from "./value.ts"
import { ScopedReplanning } from "./replanning.ts"
import type { ReplanPatch } from "../../task-causality/src/replan.ts"
import type { PlanNode } from "#task-domain"

const identity={grantId:{type:"string"},workerSessionId:{type:"string"},authorizationCallId:{type:"string"}}
export const cognitiveTools=[
  {name:"cognitive_context",description:"Read the immutable context authorized for this role.",inputSchema:{type:"object",properties:{...identity},additionalProperties:false}},
  {name:"cognitive_read",description:"Read one granted UTF-8 file with its content hash. Required oversized files are rejected rather than truncated.",inputSchema:{type:"object",properties:{...identity,path:{type:"string"}},required:["path"],additionalProperties:false}},
  {name:"cognitive_write",description:"Atomically replace one granted file if its previous hash still matches; null previousHash creates a new file. Parent directory must exist.",inputSchema:{type:"object",properties:{...identity,path:{type:"string"},content:{type:"string"},previousHash:{type:["string","null"]}},required:["path","content","previousHash"],additionalProperties:false}},
  {name:"cognitive_replan_stage",description:"Propose a scoped patch under the controller-pinned lease. This stages validation and cannot approve or commit a plan.",inputSchema:{type:"object",properties:{...identity,patch:{type:"object"},specifications:{type:"array",items:{type:"object"}},summary:{type:"string",minLength:1}},required:["patch","specifications","summary"],additionalProperties:false}},
]

/** The model receives no arbitrary shell, raw graph mutation or database handle. */
export class CognitiveGateway {
  private engine:TaskGraphEngine
  private workspace:string
  private files:FileObservations
  constructor(engine:TaskGraphEngine,workspace:string) {
    this.engine=engine;this.workspace=realpathSync(workspace);this.files=new FileObservations(engine.store.control)
    engine.store.db.exec(`CREATE TABLE IF NOT EXISTS cognitive_tool_receipts(session_id TEXT NOT NULL,call_id TEXT NOT NULL,signature TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(session_id,call_id));
      CREATE TABLE IF NOT EXISTS execution_reads(grant_id TEXT NOT NULL,path TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(grant_id,path,hash));`)
  }
  execute(name:string,input:Record<string,unknown>):unknown {
    if(name==="cognitive_write") {
      if(this.engine.store.inTransaction)throw new Error("File mutation cannot be nested in a graph transaction")
      this.step(name,input,"prepare")
      return this.step(name,input,"apply")
    }
    return this.step(name,input)
  }
  private step(name:string,input:Record<string,unknown>,writeStage?:"prepare"|"apply"):unknown {
    const {grantId,workerSessionId,authorizationCallId,...args}=input
    if(typeof grantId!=="string"||typeof workerSessionId!=="string"||typeof authorizationCallId!=="string")throw new Error("Tool has no injected activation identity")
    return this.engine.atomic(()=>{
      const db=this.engine.store.db,signature=digest({name,args})
      const row=db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
      if(!row||row.state!=="claimed")throw new Error("Tool has no live activation grant")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      if(grant.worker!==workerSessionId||grant.expiresAt<=Date.now()||!grant.allowedTools.includes(`task_graph_${name}`)||!this.engine.store.executionAllowed(grant.taskId))throw new Error("Tool exceeds activation scope")
      const snapshot=this.engine.signals.capture(grant.taskId)
      const pinned=grant.inputVector.find(input=>input.entityId===grant.taskId&&input.port==="inputs"&&input.view==="legacy-complete-input")
      if(snapshot.specHash!==grant.specHash||(pinned?pinned.hash!==snapshot.digest:!this.engine.signals.matches(grant.taskId)))throw new Error("Task inputs changed before tool execution")
      const call=db.prepare("SELECT c.tool,a.args_hash FROM grant_tool_calls c JOIN grant_tool_arguments a ON a.session_id=c.session_id AND a.call_id=c.call_id WHERE c.session_id=? AND c.call_id=?").get(workerSessionId,authorizationCallId)
      if(call?.tool!==`task_graph_${name}`||call.args_hash!==digest(args))throw new Error("Tool arguments were not admitted by the model adapter")
      const receipt=db.prepare("SELECT * FROM cognitive_tool_receipts WHERE session_id=? AND call_id=?").get(workerSessionId,authorizationCallId)
      if(receipt) {
        if(receipt.signature!==signature)throw new Error("Tool receipt identity conflict")
        if(receipt.state==="completed")return JSON.parse(String(receipt.payload))
        if(name!=="cognitive_write"||receipt.state!=="prepared")throw new Error("An interrupted file mutation requires reconciliation")
        if(writeStage==="prepare")return JSON.parse(String(receipt.payload))
      }
      const session=db.prepare("SELECT input_used FROM grant_sessions WHERE session_id=?").get(workerSessionId)
      const remaining=grant.profile.maxInputTokens-Number(session?.input_used??grant.profile.maxInputTokens)
      let result:unknown
      if(name==="cognitive_context") {
        const context=this.engine.store.control.get<ContextManifest>("context_manifests",grant.context.id,grant.context.version)
        if(!context||context.hash!==grant.contextHash)throw new Error("Context pin mismatch")
        result=context
      } else if(name==="cognitive_replan_stage") {
        if(!grant.replanLease)throw new Error("Replanning requires a pinned lease")
        const replanning=new ScopedReplanning(this.engine)
        const lease=replanning.leases.get(grant.replanLease.id,grant.replanLease.version)
        if(this.engine.store.findWorkPlan(lease.planId)?.rootTaskId!==grant.taskId)throw new Error("Replanning lease belongs to another plan")
        result=replanning.stage(lease.id,args.patch as ReplanPatch,args.specifications as PlanNode[],String(args.summary))
      } else if(name==="cognitive_read") {
        const path=this.path(args.path,grant.readScopes??[],false)
        const metadata=lstatSync(path)
        if(!metadata.isFile()||metadata.size>remaining)throw new Error("Required file exceeds context budget")
        const bytes=readFileSync(path),content=new TextDecoder("utf-8",{fatal:true}).decode(bytes)
        result={path:args.path,content,hash:digest(content)}
        db.prepare("INSERT OR IGNORE INTO execution_reads VALUES(?,?,?)").run(grant.id,String(args.path),digest(content))
        this.files.read(grant,this.workspace,String(args.path),digest(content),authorizationCallId)
      } else if(name==="cognitive_write") {
        const path=this.path(args.path,grant.writeScopes,true)
        const attempt=this.engine.store.currentAttempt(grant.taskId)
        const reservation=db.prepare("SELECT scopes FROM task_reservations WHERE task_id=?").get(grant.taskId)
        if(attempt?.state!=="running"||attempt.worker?.sessionId!==workerSessionId||!reservation||!within(String(args.path),JSON.parse(String(reservation.scopes))))throw new Error("File write has no current worker reservation")
        if(typeof args.content!=="string"||!(args.previousHash===null||typeof args.previousHash==="string"))throw new Error("Invalid file replacement")
        const current=lstatSync(path,{throwIfNoEntry:false})
        const previous=current?digest(readFileSync(path,"utf8")):null
        const hash=digest(args.content)
        result={path:args.path,hash}
        if(writeStage==="prepare") {
          if(previous!==args.previousHash)throw new Error("File changed since the authorized read")
          db.prepare("INSERT INTO cognitive_tool_receipts VALUES(?,?,?,'prepared',?)").run(workerSessionId,authorizationCallId,signature,canonical(result))
          return result
        }
        if(!receipt)throw new Error("File mutation intent is missing")
        if(previous!==hash) {
          if(previous!==args.previousHash)throw new Error("File changed since the authorized read")
          durableReplace(path,args.content,current?current.mode&0o777:0o600)
        }
        const observed=this.files.write(grant,this.workspace,String(args.path),args.previousHash as string|null,hash,authorizationCallId)
        this.engine.store.control.event({id:`file:${workerSessionId}:${authorizationCallId}`,type:"CognitiveFileWritten",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId,path:args.path,before:args.previousHash,after:hash,observed}})
      } else throw new Error("Unknown cognitive tool")
      if(Buffer.byteLength(JSON.stringify(result))>remaining)throw new Error("Tool result exceeds remaining context budget")
      db.prepare("INSERT INTO cognitive_tool_receipts VALUES(?,?,?,'completed',?) ON CONFLICT(session_id,call_id) DO UPDATE SET state='completed',payload=excluded.payload").run(workerSessionId,authorizationCallId,signature,canonical(result))
      return result
    })
  }
  assertReadsCurrent(grantId:string):void {
    const db=this.engine.store.db,row=db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
    if(row?.state!=="claimed")throw new Error("Read validation needs a live grant")
    const grant=JSON.parse(String(row.payload)) as ActivationGrant
    const seen=new Set<string>()
    for(const read of db.prepare("SELECT v.payload FROM observed_file_reads r JOIN observed_file_versions v ON v.id=r.file_id AND v.version=r.version WHERE r.grant_id=? ORDER BY r.rowid DESC").all(grantId)) {
      const value=JSON.parse(String(read.payload)) as {workspace:string;path:string;hash:string}
      if(value.workspace!==this.workspace)throw new Error("Read observation belongs to another workspace")
      if(seen.has(value.path))continue
      seen.add(value.path)
      // A successful own replacement is an explicit output, not a foreign input change.
      const ownWrite=db.prepare("SELECT r.payload FROM cognitive_tool_receipts r JOIN grant_tool_calls c ON c.session_id=r.session_id AND c.call_id=r.call_id WHERE r.session_id=? AND r.state='completed' AND c.tool='task_graph_cognitive_write' AND json_extract(r.payload,'$.path')=? ORDER BY r.rowid DESC LIMIT 1").get(grant.worker!,value.path)
      const expected=ownWrite?JSON.parse(String(ownWrite.payload)).hash:value.hash
      const file=this.path(value.path,grant.readScopes??[],false)
      if(digest(readFileSync(file,"utf8"))!==expected)throw new Error(`Observed file changed before result acceptance: ${value.path}`)
    }
  }
  private path(value:unknown,scopes:string[],create:boolean):string {
    if(typeof value!=="string"||!value||value.includes("\\")||value.includes("\0")||value.startsWith("/")||value.split("/").some(p=>["",".","..",".git",".codex",".agents",".task-agent"].includes(p))||!within(value,scopes))throw new Error("File path is outside the grant")
    const path=resolve(this.workspace,value)
    let cursor=this.workspace
    for(const part of value.split("/")) {
      cursor=join(cursor,part)
      const stat=lstatSync(cursor,{throwIfNoEntry:false})
      if(!stat) {if(create&&cursor===path)break;throw new Error("Missing file or parent")}
      if(stat.isSymbolicLink()||stat.isFile()&&stat.nlink!==1)throw new Error("Aliased paths are not permitted")
    }
    const parent=realpathSync(dirname(path)),rel=relative(this.workspace,parent)
    if(rel===".."||rel.startsWith(`..${sep}`))throw new Error("File parent escapes workspace")
    return path
  }
}
function within(path:string,scopes:string[]):boolean {
  return scopes.some(scope=>scope==="."||scope===path||path.startsWith(scope.replace(/\/$/,"")+"/"))
}
