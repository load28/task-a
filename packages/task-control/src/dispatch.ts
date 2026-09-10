import { CacheFallbackBudgetUnavailable } from "./cognitive-cache.ts"
import { randomUUID } from "node:crypto"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import type { ControlRuntime } from "./runtime.ts"
import { canonical,digest } from "./value.ts"

export interface GrantedExecutor {
  execute(grantId:string):Promise<unknown>
  stop(sessionId:string):Promise<{stopped:boolean;evidence:string}>
  close():Promise<void>
  completion?(grantId:string):Promise<boolean>
  stopGrant?(grantId:string):Promise<{stopped:boolean;evidence:string}>
}

/** Durable delivery, not a planner: only already-issued grants can enter this queue. */
export class GrantDispatcher {
  private owner=randomUUID()
  private active=new Map<string,Promise<void>>()
  private closed=false
  readonly runtime:ControlRuntime
  readonly executor:GrantedExecutor
  readonly maxWorkers:number
  readonly ownerLeaseMs:number
  constructor(runtime:ControlRuntime,executor:GrantedExecutor,maxWorkers:number,ownerLeaseMs=30000) {
    this.runtime=runtime;this.executor=executor;this.maxWorkers=maxWorkers;this.ownerLeaseMs=ownerLeaseMs
    if(!Number.isSafeInteger(maxWorkers)||maxWorkers<1||maxWorkers>16)throw new Error("Invalid dispatch capacity")
    if(!Number.isSafeInteger(ownerLeaseMs)||ownerLeaseMs<1000)throw new Error("Invalid dispatcher lease")
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS grant_dispatches(grant_id TEXT PRIMARY KEY REFERENCES activation_grants(id),state TEXT NOT NULL,owner TEXT,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS grant_dispatch_queue ON grant_dispatches(state);
      CREATE TABLE IF NOT EXISTS grant_dispatch_transitions(id TEXT PRIMARY KEY,grant_id TEXT NOT NULL REFERENCES activation_grants(id),from_state TEXT NOT NULL,to_state TEXT NOT NULL,occurred_at INTEGER NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS grant_dispatch_transition_grant ON grant_dispatch_transitions(grant_id,occurred_at);
      CREATE TRIGGER IF NOT EXISTS grant_dispatch_transition_update BEFORE UPDATE ON grant_dispatch_transitions BEGIN SELECT RAISE(ABORT,'Immutable dispatch transition'); END;
      CREATE TRIGGER IF NOT EXISTS grant_dispatch_transition_delete BEFORE DELETE ON grant_dispatch_transitions BEGIN SELECT RAISE(ABORT,'Immutable dispatch transition'); END;
      CREATE TABLE IF NOT EXISTS grant_dispatcher_leases(owner TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);`)
    this.heartbeat()
  }
  private get db(){return this.runtime.store.db}
  private heartbeat():void {this.db.prepare("INSERT INTO grant_dispatcher_leases VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET expires_at=excluded.expires_at").run(this.owner,Date.now()+this.ownerLeaseMs)}
  /** Nonblocking pump. A committed delivery intent always precedes the external call. */
  tick():void {
    if(this.closed)return
    this.heartbeat()
    const selected=this.runtime.store.atomic(()=>{
      this.db.prepare("INSERT INTO grant_dispatches(grant_id,state,owner,payload) SELECT id,'pending',NULL,'{}' FROM activation_grants WHERE state='issued' AND id NOT IN (SELECT grant_id FROM grant_dispatches)").run()
      const running=Number(this.db.prepare("SELECT count(*) AS n FROM grant_dispatches WHERE state IN ('dispatching','stopping')").get()!.n)
      const rows=this.db.prepare("SELECT d.grant_id,g.state AS grant_state,g.payload FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE d.state='pending' ORDER BY d.rowid").all()
      const ids:string[]=[]
      for(const row of rows) {
        const grant=JSON.parse(String(row.payload)) as ActivationGrant,id=String(row.grant_id)
        if(row.grant_state!=="issued"||grant.expiresAt<=Date.now()) {
          this.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state='issued'").run(id)
          this.save(id,"cancelled",{reason:"Grant is no longer executable"});continue
        }
        if(running+ids.length>=this.maxWorkers)break
        this.db.prepare("UPDATE grant_dispatches SET owner=? WHERE grant_id=?").run(this.owner,id)
        this.save(id,"dispatching",{startedAt:Date.now()})
        ids.push(id)
      }
      return ids
    })
    for(const id of selected) {
      const work=this.execute(id).finally(()=>this.active.delete(id))
      this.active.set(id,work)
    }
  }
  private async execute(id:string):Promise<void> {
    const heartbeat=setInterval(()=>{if(!this.closed)try{this.heartbeat()}catch{/* recovery will retain the unknown external call */}},Math.max(500,Math.floor(this.ownerLeaseMs/3)))
    try {
      const input=JSON.parse(String(this.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
      if(input.profile.level!==0||this.runtime.cognitiveCache.execute(id)===undefined)await this.executor.execute(id)
      this.runtime.store.atomic(()=>{
        const delivery=this.db.prepare("SELECT state,owner FROM grant_dispatches WHERE grant_id=?").get(id)
        if(delivery?.state!=="dispatching"||delivery.owner!==this.owner)return
        const row=this.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(id)
        if(row?.state!=="completed")throw new Error("Executor returned without an accepted usage-bound result")
        this.save(id,"completed",{completedAt:Date.now()})
      })
    } catch(error) {
      if(error instanceof CacheFallbackBudgetUnavailable){this.save(id,"pending",{reason:error.message});return}
      this.runtime.store.atomic(()=>{
        const delivery=this.db.prepare("SELECT state,owner FROM grant_dispatches WHERE grant_id=?").get(id)
        if(delivery?.state!=="dispatching"||delivery.owner!==this.owner)return
        this.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(id)
        const grant=JSON.parse(String(this.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
        this.save(id,grant.worker||this.executor.stopGrant?"stopping":"failed",{error:error instanceof Error?error.message:"Grant delivery failed"})
      })
    } finally {clearInterval(heartbeat)}
  }
  /** A lost acknowledgement is never permission to submit another model request. */
  async recover():Promise<void> {
    this.heartbeat()
    for(const row of this.db.prepare("SELECT d.*,g.payload AS grant_payload,g.state AS grant_state FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE d.state IN ('dispatching','stopping')").all()) {
      const id=String(row.grant_id)
      if(this.active.has(id)&&row.grant_state!=="fenced")continue
      if(row.owner&&row.owner!==this.owner&&Number(this.db.prepare("SELECT expires_at FROM grant_dispatcher_leases WHERE owner=?").get(String(row.owner))?.expires_at??0)>Date.now())continue
      if(row.grant_state==="completed") {
        const completedGrant=JSON.parse(String(row.grant_payload)) as ActivationGrant
        if(completedGrant.profile.level!==0&&this.executor.completion&&!await this.executor.completion(id))continue
        this.save(id,"completed",{recoveredReceipt:true});continue
      }
      const grant=JSON.parse(String(row.grant_payload)) as ActivationGrant
      this.runtime.store.atomic(()=>{
        this.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(id)
        this.save(id,grant.worker||this.executor.stopGrant?"stopping":"failed",{reason:"Interrupted delivery; no automatic retry"})
      })
      if(!grant.worker) {
        if(this.executor.stopGrant) {
          let stopped:{stopped:boolean;evidence:string}
          try{stopped=await this.executor.stopGrant(id)}catch(error){stopped={stopped:false,evidence:String(error)}}
          this.save(id,stopped.stopped?"failed":"stopping",{stop:stopped})
        }
        continue
      }
      let stopped:{stopped:boolean;evidence:string}
      try {stopped=await this.executor.stop(grant.worker)}
      catch(error){stopped={stopped:false,evidence:error instanceof Error?error.message:"Stop status unavailable"}}
      this.save(id,stopped.stopped?"failed":"stopping",{stop:stopped})
    }
  }
  private save(id:string,state:string,payload:unknown):void {
    this.runtime.store.atomic(()=>{
      const row=this.db.prepare("SELECT d.state,d.payload,g.task_id FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE d.grant_id=?").get(id)
      if(!row)return
      const now=Date.now(),prior=JSON.parse(String(row.payload||"{}")),transition={from:String(row.state),to:state,at:now,detail:payload}
      const value={...prior,...(payload&&typeof payload==="object"?payload:{}),updatedAt:now,transitions:[...(Array.isArray(prior.transitions)?prior.transitions:[]),transition]}
      this.db.prepare("UPDATE grant_dispatches SET state=?,payload=? WHERE grant_id=?").run(state,canonical(value),id)
      if(row.state!==state) {
        const owner=this.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(String(row.task_id)),correlationId=String(owner?.request_id??row.task_id)
        const transitionId=`dispatch-transition:${digest({id,from:row.state,to:state,at:now,index:value.transitions.length})}`
        this.db.prepare("INSERT INTO grant_dispatch_transitions VALUES(?,?,?,?,?,?)").run(transitionId,id,String(row.state),state,now,canonical(transition))
        this.runtime.store.event({id:transitionId,type:"GrantDispatchTransition",entityId:String(row.task_id),correlationId,schemaVersion:1,timestamp:now,payload:{grantId:id,transition}})
        if(["failed","cancelled"].includes(state)&&String(row.state)==="stopping") {
          const transitions=Array.isArray(prior.transitions)?prior.transitions as Array<{to:string;at:number}>:[],started=transitions.find(item=>item.to==="dispatching"),stopping=[...transitions].reverse().find(item=>item.to==="stopping"),session=this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='grant_sessions'").get()?this.db.prepare("SELECT input_used,output_used,tool_used FROM grant_sessions WHERE grant_id=?").get(id):undefined
          if(started&&stopping)this.runtime.regionCosts.operational({grantId:id,category:"discardedWork",elapsedMs:Math.max(0,stopping.at-started.at),usage:session?{inputTokens:Number(session.input_used),outputTokens:Number(session.output_used),toolCalls:Number(session.tool_used),elapsedMs:0}:undefined,source:"grant-dispatcher confirmed aborted execution",content:{startedAt:started.at,stoppingAt:stopping.at,terminalAt:now}})
        }
      }
    })
  }
  status(){return this.db.prepare("SELECT grant_id,state,payload FROM grant_dispatches ORDER BY rowid").all().map(row=>({grantId:String(row.grant_id),state:String(row.state),payload:JSON.parse(String(row.payload)) as unknown}))}
  async stopAll():Promise<{stopped:boolean;evidence:string}> {
    const workers=this.runtime.store.atomic(()=>{
      const rows=this.db.prepare("SELECT id,payload FROM activation_grants WHERE state IN ('issued','claimed','fenced')").all()
      this.db.prepare("UPDATE activation_grants SET state='fenced' WHERE state IN ('issued','claimed')").run()
      return rows.map(row=>({id:String(row.id),grant:JSON.parse(String(row.payload)) as ActivationGrant}))
    })
    const pending:string[]=[]
    for(const {id,grant} of workers) {
      if(!grant.worker){
        const result=this.executor.stopGrant?await this.executor.stopGrant(id):{stopped:true,evidence:"Cancelled before external admission"}
        this.save(id,result.stopped?"cancelled":"stopping",{stop:result})
        if(!result.stopped)pending.push(id)
        continue
      }
      this.save(id,"stopping",{reason:"Cancellation requested"})
      let result:{stopped:boolean;evidence:string}
      try {result=await this.executor.stop(grant.worker)}catch(error){result={stopped:false,evidence:String(error)}}
      this.save(id,result.stopped?"cancelled":"stopping",{stop:result})
      if(!result.stopped)pending.push(grant.worker)
    }
    return {stopped:pending.length===0,evidence:pending.length?`Controlled workers still require stop confirmation: ${pending.join(", ")}`:"Controlled grants fenced and bound workers stopped"}
  }
  async settle():Promise<void>{await Promise.all(this.active.values())}
  async close():Promise<void> {
    this.closed=true
    // Revoke live admission before stopping the transport. Unknown spent budget is retained.
    this.runtime.store.atomic(()=>{for(const id of this.active.keys())this.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(id)})
    await this.executor.close()
    await this.settle()
    this.db.prepare("DELETE FROM grant_dispatcher_leases WHERE owner=?").run(this.owner)
  }
}
