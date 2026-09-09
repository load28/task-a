import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { ContextItem,RoleVersion,ReasoningProfile } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { RELATIONS } from "../../task-causality/src/model.ts"
import { buildTaskContext } from "./index.ts"
import { budgetContext,ContextBudgetExceeded } from "./budget.ts"
import { digest,canonical } from "../../task-control/src/value.ts"

/** Split facts before budgeting; history cannot hide inside a single task item. */
export function controlledContext(runtime:ControlRuntime,taskId:string,role:RoleVersion,policy:VersionRef,profile:ReasoningProfile,extra:ContextItem[]=[]) {
  const source=buildTaskContext(runtime.engine,taskId,false),snapshot=runtime.engine.signals.capture(taskId)
  const dependencies=[{entityId:taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
  const {architectureDecisions,inputArtifacts,verifiedBundles,contracts,learnings,recentHistory,...core}=source
  const items:ContextItem[]=[{id:`task:${taskId}`,version:1,kind:"task",content:canonical(core),required:true,depth:0,relevance:1,level:0,dependencies,path:[taskId],evidence:[]},...extra]
  const append=(id:string,kind:ContextItem["kind"],content:unknown,required:boolean,depth:number,version=1)=>items.push({id,version,kind,content:canonical(content),required,depth,relevance:required?1:.5,level:depth?1:0,dependencies,path:[taskId,id],evidence:[]})
  for(const artifact of [...inputArtifacts,...verifiedBundles])append(`artifact:${artifact.artifactId}`,"dependency",artifact,true,1,artifact.version)
  for(const contract of contracts)append(`contract:${contract.contractId}`,"dependency",contract,true,1,contract.version)
  for(const decision of architectureDecisions)append(`architecture:${decision.artifactId}`,"history",decision,true,0,decision.version)
  for(const learning of learnings)append(`learning:${digest(learning)}`,"knowledge",{legacyHint:learning,validatedEvidence:false},false,0)
  for(const history of recentHistory??[])append(`history:${digest(history)}`,"history",history,false,0)
  for(const selector of role.requiredContext) {
    if(!Number.isSafeInteger(selector.depth)||selector.depth<0||!Array.isArray(selector.ports)||!RELATIONS.includes(selector.relation as typeof RELATIONS[number]))throw new Error("Invalid role context selector")
    let frontier=[taskId];const visited=new Set(frontier)
    for(let depth=1;depth<=selector.depth;depth++) {
      const next:string[]=[]
      for(const entity of frontier) {
        const edges=[...runtime.graph.incoming(entity),...runtime.graph.outgoing(entity)].filter(edge=>edge.relation===selector.relation)
        for(const edge of edges) {
          const port=edge.source.entityId===entity?edge.target:edge.source
          if(selector.ports.length&&!selector.ports.includes(port.port))continue
          if(visited.has(port.entityId))continue
          visited.add(port.entityId);next.push(port.entityId)
          const task=runtime.engine.store.findTask(port.entityId)
          if(!task||!["inputs","outputs"].includes(port.port)) {
            if(selector.required)throw new ContextBudgetExceeded([`unavailable projection ${port.entityId}:${port.port}:${port.view}`])
            continue
          }
          const value=port.port==="inputs"?runtime.engine.signals.capture(task.id):task.outputArtifactRefs.map(ref=>runtime.engine.requireArtifactVersion(ref))
          append(`selector:${edge.id}:${port.entityId}`,"dependency",{port,value,completeness:edge.completeness},selector.required,depth,edge.version)
        }
      }
      frontier=next
    }
  }
  return budgetContext({taskId,role,policy,items,scaffold:canonical({prompt:role.prompt,schema:role.outputSchema}),outputReservation:profile.maxOutputTokens,countTokens:text=>Buffer.byteLength(text)})
}
