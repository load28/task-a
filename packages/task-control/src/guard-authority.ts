import type { GrantAuthority,GrantAuthorization } from "../../opencode-harness/src/grant-hooks.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { ControlStore } from "./store.ts"
import { canonical } from "./value.ts"
import { cognitiveTools } from "./gateway.ts"
import { randomUUID } from "node:crypto"
import { RoleRegistry } from "../../task-cognition/src/roles.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"

/** The authority reads live fencing state for every model/tool admission. */
export class GuardAuthority implements GrantAuthority {
  readonly store:ControlStore
  readonly roles:RoleRegistry
  constructor(store:ControlStore) {
    this.store=store
    this.roles=new RoleRegistry(store)
    store.db.exec(`CREATE TABLE IF NOT EXISTS grant_sessions(session_id TEXT PRIMARY KEY,grant_id TEXT NOT NULL UNIQUE REFERENCES activation_grants(id),input_used INTEGER NOT NULL,output_used INTEGER NOT NULL,tool_used INTEGER NOT NULL,input_bound INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS grant_tool_calls(session_id TEXT NOT NULL,call_id TEXT NOT NULL,tool TEXT NOT NULL,output_bytes INTEGER,PRIMARY KEY(session_id,call_id));
      CREATE TABLE IF NOT EXISTS grant_model_usage(session_id TEXT NOT NULL,message_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(session_id,message_id));`)
    store.db.exec("CREATE TABLE IF NOT EXISTS grant_tool_arguments(session_id TEXT NOT NULL,call_id TEXT NOT NULL,args_hash TEXT NOT NULL,PRIMARY KEY(session_id,call_id))")
    store.db.exec("CREATE TABLE IF NOT EXISTS grant_model_admissions(session_id TEXT PRIMARY KEY,system_bytes INTEGER,active INTEGER NOT NULL DEFAULT 0)")
  }
  bind(sessionId:string,grantId:string):void {
    this.store.atomic(()=>{
      const row=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
      if(!row||row.state!=="claimed")throw new Error("Only a claimed grant can bind a model session")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      if(grant.worker!==sessionId)throw new Error("Grant worker/session mismatch")
      const prior=this.store.db.prepare("SELECT grant_id FROM grant_sessions WHERE session_id=?").get(sessionId)
      if(prior) {if(prior.grant_id!==grantId)throw new Error("Session already bound to another grant");return}
      this.store.db.prepare("INSERT INTO grant_sessions VALUES(?,?,0,0,0,0)").run(sessionId,grantId)
    })
  }
  async authorize(sessionId:string,operation:Parameters<GrantAuthority["authorize"]>[1]):Promise<GrantAuthorization> {
    return this.store.atomic(()=>{
      const session=this.store.db.prepare("SELECT * FROM grant_sessions WHERE session_id=?").get(sessionId)
      if(!session)throw new Error("No session activation grant")
      const row=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(String(session.grant_id))
      if(!row||row.state!=="claimed")throw new Error("Execution was fenced or completed")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      if(grant.expiresAt<=Date.now()||grant.worker!==sessionId)throw new Error("Expired or foreign session grant")
      if(!this.roles.executable(grant.role,ref=>new EvidenceStore(this.store).valid(ref)))throw new Error("Role lifecycle authorization was withdrawn")
      const run=this.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(grant.id)
      if(!run||Date.now()-Number(JSON.parse(String(run.payload)).startedAt)>=grant.profile.timeoutMs)throw new Error("Execution time budget exhausted")
      const remainingInputTokens=grant.profile.maxInputTokens-Number(session.input_used),remainingOutputTokens=grant.profile.maxOutputTokens-Number(session.output_used)
      let remainingToolCalls=grant.profile.maxToolCalls-Number(session.tool_used)
      if(remainingInputTokens<=0||remainingOutputTokens<=0)throw new Error("Model budget exhausted")
      if(operation.inputBytes!==undefined) {
        if(!Number.isSafeInteger(operation.inputBytes)||operation.inputBytes<0||operation.inputBytes>remainingInputTokens)throw new Error("Serialized context exceeds remaining input budget")
        this.store.db.prepare("UPDATE grant_sessions SET input_bound=? WHERE session_id=?").run(operation.inputBytes,sessionId)
      }
      if(operation.systemBytes!==undefined) {
        if(!Number.isSafeInteger(operation.systemBytes)||operation.systemBytes<0)throw new Error("Invalid system context size")
        this.store.db.prepare("INSERT INTO grant_model_admissions(session_id,system_bytes) VALUES(?,?) ON CONFLICT(session_id) DO UPDATE SET system_bytes=excluded.system_bytes").run(sessionId,operation.systemBytes)
      }
      if(operation.reserveModel) {
        const pending=this.store.db.prepare("SELECT * FROM grant_model_admissions WHERE session_id=?").get(sessionId)
        if(!pending||pending.system_bytes===null||Number(session.input_bound)<=0)throw new Error("Complete model context must be measured before admission")
        if(pending.active===1)throw new Error("Previous model invocation has no usage receipt")
        const toolBytes=Buffer.byteLength(JSON.stringify(cognitiveTools.filter(tool=>grant.allowedTools.includes(`task_graph_${tool.name}`))))
        if(Number(session.input_bound)+Number(pending.system_bytes)+toolBytes>remainingInputTokens)throw new Error("Complete context exceeds remaining input budget")
        this.store.db.prepare("UPDATE grant_model_admissions SET active=1 WHERE session_id=?").run(sessionId)
      }
      if(operation.kind==="tool") {
        if(!operation.tool||!operation.callId||!grant.allowedTools.includes(operation.tool))throw new Error("Tool not granted")
        const prior=this.store.db.prepare("SELECT tool FROM grant_tool_calls WHERE session_id=? AND call_id=?").get(sessionId,operation.callId)
        if(prior&&prior.tool!==operation.tool)throw new Error("Tool call identity conflict")
        const args=this.store.db.prepare("SELECT args_hash FROM grant_tool_arguments WHERE session_id=? AND call_id=?").get(sessionId,operation.callId)
        if(args&&args.args_hash!==operation.argsHash)throw new Error("Tool argument identity conflict")
        if(!prior) {
          if(remainingToolCalls<1)throw new Error("Tool budget exhausted")
          this.store.db.prepare("INSERT INTO grant_tool_calls VALUES(?,?,?,NULL)").run(sessionId,operation.callId,operation.tool)
          this.store.db.prepare("UPDATE grant_sessions SET tool_used=tool_used+1 WHERE session_id=?").run(sessionId)
          if(operation.argsHash) {
            if(!/^[a-f0-9]{64}$/.test(operation.argsHash))throw new Error("Invalid tool argument hash")
            this.store.db.prepare("INSERT INTO grant_tool_arguments VALUES(?,?,?)").run(sessionId,operation.callId,operation.argsHash)
          }
        }
      }
      return {grant,remainingInputTokens,remainingOutputTokens,remainingToolCalls}
    })
  }
  async recordTool(sessionId:string,callId:string,result:{outputBytes:number}):Promise<void> {
    this.store.atomic(()=>{
      if(!Number.isSafeInteger(result.outputBytes)||result.outputBytes<0)throw new Error("Invalid tool output size")
      const row=this.store.db.prepare("SELECT output_bytes FROM grant_tool_calls WHERE session_id=? AND call_id=?").get(sessionId,callId)
      if(!row)throw new Error("Unadmitted tool result")
      if(row.output_bytes!==null&&row.output_bytes!==result.outputBytes)throw new Error("Tool result receipt conflict")
      this.store.db.prepare("UPDATE grant_tool_calls SET output_bytes=? WHERE session_id=? AND call_id=?").run(result.outputBytes,sessionId,callId)
    })
  }
  async recordModel(sessionId:string,messageId:string,usage:{inputTokens:number;outputTokens:number}):Promise<void> {
    this.store.atomic(()=>{
      if(!messageId||Object.values(usage).some(n=>!Number.isSafeInteger(n)||n<0))throw new Error("Missing actual model token usage")
      const prior=this.store.db.prepare("SELECT payload FROM grant_model_usage WHERE session_id=? AND message_id=?").get(sessionId,messageId)
      if(prior) {if(prior.payload!==canonical(usage))throw new Error("Model usage receipt conflict");return}
      const session=this.store.db.prepare("SELECT * FROM grant_sessions WHERE session_id=?").get(sessionId)
      if(!session)throw new Error("Unknown model session")
      const row=this.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(String(session.grant_id))!
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      this.store.db.prepare("INSERT INTO grant_model_usage VALUES(?,?,?)").run(sessionId,messageId,canonical(usage))
      this.store.db.prepare("UPDATE grant_sessions SET input_used=input_used+?,output_used=output_used+?,input_bound=0 WHERE session_id=?").run(usage.inputTokens,usage.outputTokens,sessionId)
      this.store.db.prepare("UPDATE grant_model_admissions SET active=0 WHERE session_id=?").run(sessionId)
      // Preserve actual incurred usage even when the provider violates its bound.
      // Fencing and the receipt must commit together; throwing here would erase both.
      if(Number(session.input_used)+usage.inputTokens>grant.profile.maxInputTokens||Number(session.output_used)+usage.outputTokens>grant.profile.maxOutputTokens) {
        this.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state='claimed'").run(grant.id)
        this.store.event({id:randomUUID(),type:"ModelBudgetExceeded",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:grant.id,messageId,inputTokens:Number(session.input_used)+usage.inputTokens,outputTokens:Number(session.output_used)+usage.outputTokens}})
      }
    })
  }
}
