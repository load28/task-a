import type { Event } from "@opencode-ai/sdk/v2"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { digest } from "../../task-control/src/value.ts"

export interface GrantAuthorization {
  grant:ActivationGrant; remainingOutputTokens:number|null;remainingInputTokens:number|null;remainingToolCalls:number|null
}
export interface GrantAuthority {
  authorize(sessionId:string,operation:{kind:"model"|"tool";tool?:string;callId?:string;inputBytes?:number;systemBytes?:number;reserveModel?:boolean;argsHash?:string}):Promise<GrantAuthorization>
  recordTool(sessionId:string,callId:string,result:{outputBytes:number}):Promise<void>
  recordModel(sessionId:string,messageId:string,usage:{inputTokens:number;outputTokens:number}):Promise<void>
}
/** OpenCode v1.18.29 plugin hooks. The control authority remains the source of permission.
 * Hook contracts: https://github.com/anomalyco/opencode/blob/v1.18.29/packages/plugin/src/index.ts
 */
export function grantHooks(authority:GrantAuthority) {
  return {
    event:async(input:{event:Event})=>{
      if(input.event.type!=="message.part.updated")return
      const part=input.event.properties.part
      if(part.type!=="step-finish")return
      // The durable part returned by the messages API carries sessionID, but the
      // live event contract owns it on properties. Using the durable-only field
      // here passes undefined to SQLite on current OpenCode releases.
      // Some subscription-backed providers omit zero-valued reasoning or cache
      // counters at runtime even though the generated SDK types mark them required.
      // Normalize those absent counters before crossing the SQLite authority boundary.
      const inputTokens=(part.tokens.input??0)+(part.tokens.cache?.read??0)+(part.tokens.cache?.write??0)
      const outputTokens=(part.tokens.output??0)+(part.tokens.reasoning??0)
      await authority.recordModel(input.event.properties.sessionID,part.id,{inputTokens,outputTokens})
    },
    "chat.params":async(input:{sessionID:string;model:{id:string;providerID:string}},output:{maxOutputTokens?:number})=>{
      const authorization=await authority.authorize(input.sessionID,{kind:"model",reserveModel:true})
      const p=authorization.grant.profile
      if(p.model!==input.model.id||p.provider!==input.model.providerID)throw new Error("Model does not match activation grant")
      if((authorization.remainingInputTokens!==null&&authorization.remainingInputTokens<1)||(authorization.remainingOutputTokens!==null&&authorization.remainingOutputTokens<1))throw new Error("Cognitive budget exhausted")
      if(p.maxOutputTokens===null) delete output.maxOutputTokens
      else output.maxOutputTokens=Math.min(output.maxOutputTokens??Infinity,p.maxOutputTokens,authorization.remainingOutputTokens!)
    },
    "tool.execute.before":async(input:{sessionID:string;tool:string;callID:string},output:{args:Record<string,unknown>})=>{
      if(input.tool.startsWith("task_graph_cognitive_")) {
        if(typeof output.args.capability!=="string"||!/^[a-f0-9]{64}$/.test(output.args.capability))throw new Error("Cognitive tool has no valid session capability")
        if("grantId" in output.args||"workerSessionId" in output.args||"authorizationCallId" in output.args)throw new Error("Model-authored activation identity is prohibited")
      }
      const authorization=await authority.authorize(input.sessionID,{kind:"tool",tool:input.tool,callId:input.callID,argsHash:digest(output.args)})
      if((authorization.remainingToolCalls!==null&&authorization.remainingToolCalls<1)||!authorization.grant.allowedTools.includes(input.tool))throw new Error("Tool is outside the activation grant")
      // Built-in shell/edit/task tools are not allowed. The MCP gateway resolves
      // the opaque per-session capability without trusting plugin arg mutation.
      if(!input.tool.startsWith("task_graph_cognitive_"))throw new Error("Role tools must use the bounded graph gateway")
    },
    "tool.execute.after":async(input:{sessionID:string;callID:string},output:{output?:unknown})=>{
      const observed=typeof output.output==="string"?output.output:JSON.stringify(output.output??output)
      await authority.recordTool(input.sessionID,input.callID,{outputBytes:Buffer.byteLength(observed)})
    },
    "experimental.chat.messages.transform":async(_input:unknown,output:{messages:Array<{info:{sessionID:string};parts:unknown[]}>})=>{
      for(const message of output.messages)for(const value of message.parts) {
        const part=value as {type?:string;state?:{attachments?:unknown[]}}
        if(part.type==="file"||part.state?.attachments?.length)throw new Error("This adapter has no bounded multimodal input profile")
      }
      const sessions=new Set(output.messages.map(m=>m.info.sessionID))
      if(sessions.size!==1)throw new Error("Context combines different execution sessions")
      const session=[...sessions][0]
      if(!session)throw new Error("Role context has no pinned session")
      // UTF-8 bytes provide a conservative bound for the configured byte-tokenizer adapters.
      // Adapters without that attested bound must not advertise tokenLimit capability.
      await authority.authorize(session,{kind:"model",inputBytes:Buffer.byteLength(JSON.stringify(output.messages))})
    },
    "experimental.chat.system.transform":async(input:{sessionID?:string},output:{system:string[]})=>{
      if(!input.sessionID)throw new Error("System context has no activation session")
      await authority.authorize(input.sessionID,{kind:"model",systemBytes:Buffer.byteLength(JSON.stringify(output.system))})
    },
    "experimental.compaction.autocontinue":async(_input:unknown,output:{enabled:boolean})=>{output.enabled=false},
  }
}
