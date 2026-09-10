import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { ContextItem,RoleVersion,ReasoningProfile } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { RELATIONS } from "../../task-causality/src/model.ts"
import { buildTaskContext } from "./index.ts"
import { budgetContext,ContextBudgetExceeded } from "./budget.ts"
import { digest,canonical } from "../../task-control/src/value.ts"
import { currentInputVector } from "../../task-control/src/completion.ts"

/** Split facts before budgeting; history cannot hide inside a single task item. */
export function controlledContext(runtime:ControlRuntime,taskId:string,role:RoleVersion,policy:VersionRef,profile:ReasoningProfile,extra:ContextItem[]=[]) {
  const source=buildTaskContext(runtime.engine,taskId,false)
  const dependencies=currentInputVector(runtime.engine,taskId)
  const {architectureDecisions,inputArtifacts,verifiedBundles,contracts,learnings,recentHistory,...core}=source
  const items:ContextItem[]=[{id:`task:${taskId}`,version:1,kind:"task",content:canonical(core),required:true,depth:0,relevance:1,level:0,dependencies,path:[taskId],evidence:[]},...extra]
  const append=(id:string,kind:ContextItem["kind"],content:unknown,required:boolean,depth:number,version=1)=>items.push({id,version,kind,content:canonical(content),required,depth,relevance:required?1:.5,level:depth?1:0,dependencies,path:[taskId,id],evidence:[]})
  for(const observation of runtime.inputs.taskValues(taskId)) {
    const definition=runtime.inputs.definition(observation.definition)
    items.push({id:observation.id,version:observation.version,kind:"dependency",content:canonical(observation),required:true,depth:0,relevance:1,level:0,dependencies:[{entityId:observation.id,port:definition.kind,view:definition.schemaVersion,version:observation.version,hash:observation.hash}],path:[taskId,observation.id],evidence:observation.evidence})
  }
  for(const artifact of [...inputArtifacts,...verifiedBundles])append(`artifact:${artifact.artifactId}`,"dependency",artifact,true,1,artifact.version)
  for(const contract of contracts)append(`contract:${contract.contractId}`,"dependency",contract,true,1,contract.version)
  for(const decision of architectureDecisions)append(`architecture:${decision.artifactId}`,"history",decision,true,0,decision.version)
  for(const learning of learnings)append(`learning:${digest(learning)}`,"knowledge",{legacyHint:learning,validatedEvidence:false},false,0)
  for(const history of recentHistory??[])append(`history:${digest(history)}`,"history",history,false,0)
  for(const row of runtime.store.db.prepare("SELECT id,version FROM assumption_task_consumers WHERE task_id=?").all(taskId)) {
    const ref={id:String(row.id),version:Number(row.version)}
    if(!runtime.assumptions.valid(ref))throw new ContextBudgetExceeded([`unvalidated assumption ${ref.id}@${ref.version}`])
    const assumption=runtime.store.get<import("../../task-control/src/assumptions.ts").RegisteredAssumption>("assumptions",ref.id,ref.version)!
    items.push({...ref,kind:"assumption",content:canonical(assumption),required:true,depth:0,relevance:1,level:0,dependencies:[...dependencies,{entityId:ref.id,port:"proposition",view:"assumption",version:ref.version,hash:digest(assumption)}],path:[taskId,ref.id],evidence:assumption.evidence})
  }
  for(const row of runtime.store.db.prepare("SELECT id,version FROM decision_task_consumers WHERE task_id=?").all(taskId)) {
    const ref={id:String(row.id),version:Number(row.version)}
    if(!runtime.decisions.valid(ref))throw new ContextBudgetExceeded([`unvalidated decision ${ref.id}@${ref.version}`])
    const decision=runtime.store.get<import("../../task-control/src/decisions.ts").RegisteredDecision>("decision_versions",ref.id,ref.version)!
    items.push({...ref,kind:"decision",content:canonical(decision),required:true,depth:0,relevance:1,level:0,dependencies:[...dependencies,{entityId:ref.id,port:"conclusion",view:"decision",version:ref.version,hash:digest(decision)}],path:[taskId,ref.id],evidence:decision.evidence})
  }
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
  return budgetContext({taskId,role,policy,items,scaffold:canonical({prompt:role.prompt,schema:role.outputSchema}),outputReservation:profile.maxOutputTokens??0,countTokens:text=>Buffer.byteLength(text)})
}
