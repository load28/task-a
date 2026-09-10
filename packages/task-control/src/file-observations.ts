import { lstatSync,realpathSync,openSync,closeSync,readSync,constants } from "node:fs"
import { join,relative,isAbsolute } from "node:path"
import { CausalGraph } from "../../task-causality/src/graph.ts"
import type { DependencyVersion,VersionRef } from "../../task-causality/src/model.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import type { ControlStore } from "./store.ts"
import { canonical,digest } from "./value.ts"

/** Re-observe the exact reads of a reusable cognition. A Pod-local path is not
 * a host source attestation. Unknown, oversized and aliased inputs cannot hit. */
export function observedReadsReusable(store:ControlStore,grantId:string):boolean {
  const evidence=new EvidenceStore(store)
  const rows=store.db.prepare("SELECT r.evidence,v.payload FROM observed_file_reads r JOIN observed_file_versions v ON v.id=r.file_id AND v.version=r.version WHERE r.grant_id=?").all(grantId)
  let remaining=4*1024*1024
  for(const row of rows)try {
    const proof=evidence.require(JSON.parse(String(row.evidence)))
    if(proof.source!=="native cognitive gateway")return false
    const input=JSON.parse(String(row.payload)) as {workspace:string;path:string;hash:string}
    if(isAbsolute(input.path)||input.path.split(/[\\/]/).some(part=>["",".","..",".git",".codex",".agents",".task-agent"].includes(part)))return false
    const root=realpathSync(input.workspace)
    if(root!==input.workspace)return false
    let file=root
    for(const part of input.path.split("/")){file=join(file,part);if(lstatSync(file).isSymbolicLink())return false}
    const stat=lstatSync(file)
    if(!stat.isFile()||stat.size>remaining)return false
    const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW)
    try {
      const buffer=Buffer.alloc(Math.min(remaining+1,65536)),chunks:Buffer[]=[]
      for(;;){
        const size=readSync(fd,buffer,0,Math.min(buffer.length,remaining+1),null)
        if(!size)break
        remaining-=size;if(remaining<0)return false
        chunks.push(Buffer.from(buffer.subarray(0,size)))
      }
      if(digest(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks)))!==input.hash)return false
    }finally{closeSync(fd)}
  }catch{return false}
  return true
}

/** Exact UTF-8 observations attest one file view, never all process inputs. */
export class FileObservations {
  readonly store:ControlStore
  private invalidated?:(taskId:string,input:DependencyVersion,evidence:VersionRef[])=>void
  private cognitionInvalidated?:(grantId:string,input:DependencyVersion,evidence:VersionRef[],cause:string)=>void
  constructor(store:ControlStore,invalidated?:(taskId:string,input:DependencyVersion,evidence:VersionRef[])=>void,cognitionInvalidated?:(grantId:string,input:DependencyVersion,evidence:VersionRef[],cause:string)=>void) {
    this.invalidated=invalidated
    this.cognitionInvalidated=cognitionInvalidated
    this.store=store
    store.db.exec(`CREATE TABLE IF NOT EXISTS observed_file_versions(id TEXT NOT NULL,version INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(id,version));
      CREATE TABLE IF NOT EXISTS observed_file_heads(id TEXT PRIMARY KEY,version INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS observed_file_reads(grant_id TEXT NOT NULL,call_id TEXT NOT NULL,file_id TEXT NOT NULL,version INTEGER NOT NULL,evidence TEXT NOT NULL,PRIMARY KEY(grant_id,call_id));
      CREATE INDEX IF NOT EXISTS observed_file_consumers ON observed_file_reads(file_id,grant_id);
      CREATE TABLE IF NOT EXISTS observed_file_scan_cursors(workspace TEXT PRIMARY KEY,last_id TEXT NOT NULL);
      CREATE TRIGGER IF NOT EXISTS observed_file_immutable_update BEFORE UPDATE ON observed_file_versions BEGIN SELECT RAISE(ABORT,'Immutable file observation'); END;
      CREATE TRIGGER IF NOT EXISTS observed_file_immutable_delete BEFORE DELETE ON observed_file_versions BEGIN SELECT RAISE(ABORT,'Immutable file observation'); END;`)
  }
  read(grant:ActivationGrant,workspace:string,path:string,hash:string,callId:string,adapter:"native"|"pod"="native"):DependencyVersion {
    if(adapter==="native")workspace=realpathSync(workspace)
    return this.store.atomic(()=>{
      const id=`file:${digest({workspace,path})}`,db=this.store.db
      if(db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)?.state!=="claimed")throw new Error("File observation requires a live claimed grant")
      const previous=db.prepare("SELECT version FROM observed_file_heads WHERE id=?").get(id)
      const old=previous&&JSON.parse(String(db.prepare("SELECT payload FROM observed_file_versions WHERE id=? AND version=?").get(id,Number(previous.version))!.payload))
      const repeated=db.prepare("SELECT file_id,version FROM observed_file_reads WHERE grant_id=? AND call_id=?").get(grant.id,callId)
      if(repeated) {
        const value=JSON.parse(String(db.prepare("SELECT payload FROM observed_file_versions WHERE id=? AND version=?").get(String(repeated.file_id),Number(repeated.version))!.payload))
        if(repeated.file_id!==id||value.hash!==hash)throw new Error("File read identity conflict")
        return {entityId:id,port:"content",view:"utf8-exact",version:Number(repeated.version),hash}
      }
      const version=old?.hash===hash?Number(previous!.version):Number(previous?.version??0)+1
      if(old?.hash!==hash) {
        const value={id,version,workspace,path,hash,observedAt:Date.now()}
        db.prepare("INSERT INTO observed_file_versions VALUES(?,?,?)").run(id,version,canonical(value))
        db.prepare("INSERT INTO observed_file_heads VALUES(?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version").run(id,version)
        this.store.event({id:`file-observation:${id}:${version}`,type:"FileVersionObserved",entityId:id,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{before:old??null,after:value,completeness:"observed"}})
      }
      const input:DependencyVersion={entityId:id,port:"content",view:"utf8-exact",version,hash}
      const content={grantId:grant.id,callId,taskId:grant.taskId,input,workspace,path,coverage:"one gateway read; other process inputs unknown"}
      const proof=new EvidenceStore(this.store).put({id:`file-read:${digest({grant:grant.id,callId})}`,version:1,type:"runtime",source:`${adapter} cognitive gateway`,producer:"file-observations",validatorVersion:"exact-file-read/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[input],confidence:1,expiresAt:null})
      db.prepare("INSERT INTO observed_file_reads VALUES(?,?,?,?,?)").run(grant.id,callId,id,version,canonical(proof))
      this.store.event({id:proof.id,type:"FileReadObserved",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:grant.id,input,evidence:proof}})
      return input
    })
  }
  assertObservedReadsCurrent(grantId:string):void {
    const db=this.store.db,seen=new Set<string>()
    const grantRow=db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grantId)
    if(!grantRow)throw new Error("Unknown observed-input grant")
    const grant=JSON.parse(String(grantRow.payload)) as ActivationGrant
    for(const row of db.prepare("SELECT r.file_id,r.version,v.payload,h.version AS current_version,c.payload AS current_payload FROM observed_file_reads r JOIN observed_file_versions v ON v.id=r.file_id AND v.version=r.version JOIN observed_file_heads h ON h.id=r.file_id JOIN observed_file_versions c ON c.id=h.id AND c.version=h.version WHERE r.grant_id=? ORDER BY r.rowid DESC").all(grantId)) {
      if(seen.has(String(row.file_id)))continue
      seen.add(String(row.file_id))
      if(Number(row.current_version)<=Number(row.version))continue
      const before=JSON.parse(String(row.payload)),current=JSON.parse(String(row.current_payload))
      let expected=before.hash
      if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='cognitive_tool_receipts'").get()&&db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_tool_calls'").get()) {
        const write=db.prepare("SELECT r.payload FROM cognitive_tool_receipts r JOIN grant_tool_calls c ON c.session_id=r.session_id AND c.call_id=r.call_id WHERE r.session_id=? AND r.state='completed' AND c.tool='task_graph_cognitive_write' AND json_extract(r.payload,'$.path')=? ORDER BY r.rowid DESC LIMIT 1").get(grant.worker??"",before.path)
        if(write)expected=JSON.parse(String(write.payload)).hash
      }
      if(current.hash!==expected)throw new Error("Question refers to stale observed file inputs")
    }
  }
  /** Observe only previously granted file paths; never crawl an entire workspace. */
  refreshNative(workspace:string,budget:{maxFiles:number;maxBytes:number}):number {
    if(!Number.isSafeInteger(budget.maxFiles)||budget.maxFiles<1||!Number.isSafeInteger(budget.maxBytes)||budget.maxBytes<1)throw new Error("File observation requires finite read budgets")
    const root=realpathSync(workspace),db=this.store.db
    return this.store.atomic(()=>{
      const cursor=String(db.prepare("SELECT last_id FROM observed_file_scan_cursors WHERE workspace=?").get(root)?.last_id??"")
      const rows=db.prepare("SELECT v.payload FROM observed_file_heads h JOIN observed_file_versions v ON v.id=h.id AND v.version=h.version WHERE json_extract(v.payload,'$.workspace')=? AND h.id>? ORDER BY h.id LIMIT ?").all(root,cursor,budget.maxFiles)
      let changed=0,last=""
      for(const row of rows) {
        const old=JSON.parse(String(row.payload)) as {id:string;version:number;workspace:string;path:string;hash:string}
        last=old.id
        let hash:string,status="observed"
        try {
          if(isAbsolute(old.path)||old.path.split(/[\\/]/).some(part=>["",".","..",".git",".codex",".agents",".task-agent"].includes(part)))throw new Error("Invalid observed path")
          let file=root
          for(const part of old.path.split("/")) {file=join(file,part);if(lstatSync(file).isSymbolicLink())throw new Error("Aliased observed path")}
          const resolved=realpathSync(file),path=relative(root,resolved),stat=lstatSync(resolved)
          if(path.startsWith("..")||isAbsolute(path)||!stat.isFile()||stat.size>budget.maxBytes)throw new Error("Unavailable bounded file input")
          const fd=openSync(resolved,constants.O_RDONLY|constants.O_NOFOLLOW)
          try {
            const buffer=Buffer.alloc(Math.min(budget.maxBytes+1,65536)),chunks:Buffer[]=[]
            let total=0
            for(;;) {
              const size=readSync(fd,buffer,0,Math.min(buffer.length,budget.maxBytes+1-total),null)
              if(size===0)break
              total+=size;if(total>budget.maxBytes)throw new Error("Observed file exceeded read budget")
              chunks.push(Buffer.from(buffer.subarray(0,size)))
            }
            hash=digest(Buffer.concat(chunks).toString("utf8"))
          }finally{closeSync(fd)}
        }catch(error) {
          status=(error as {code?:string}).code==="ENOENT"?"missing":"unknown"
          hash=digest({observation:status})
        }
        if(hash===old.hash)continue
        const after={...old,version:old.version+1,hash,status,observedAt:Date.now()}
        const input={entityId:old.id,port:"content",view:"utf8-exact",version:after.version,hash}
        const content={workspace:root,path:old.path,input,status,coverage:"bounded observation of one previously granted native file; all other process inputs remain unknown"}
        const proof=new EvidenceStore(this.store).put({id:`file-refresh:${old.id}:${after.version}`,version:1,type:"runtime",source:"native observed-input refresh",producer:"file-observations",validatorVersion:"native-file-observer/v1",timestamp:after.observedAt,content,contentHash:digest(content),inputVector:[input],confidence:status==="unknown"?0:1,expiresAt:null})
        db.prepare("INSERT INTO observed_file_versions VALUES(?,?,?)").run(old.id,after.version,canonical(after))
        db.prepare("UPDATE observed_file_heads SET version=? WHERE id=?").run(after.version,old.id)
        this.store.event({id:`file-observation:${old.id}:${after.version}`,type:"FileVersionObserved",entityId:old.id,correlationId:old.id,schemaVersion:1,timestamp:after.observedAt,payload:{before:old,after,evidence:proof,completeness:"observed"}})
        changed++
      }
      db.prepare("INSERT INTO observed_file_scan_cursors VALUES(?,?) ON CONFLICT(workspace) DO UPDATE SET last_id=excluded.last_id").run(root,rows.length<budget.maxFiles?"":last)
      return changed
    })
  }
  ingest():number {
    return this.store.consume("file-read-projection/v2","accepted-read-and-planner-binding/v2",event=>{
      if(event.type==="FileVersionObserved"&&(this.invalidated||this.cognitionInvalidated)) {
        const change=event.payload as {before:unknown;after:{id:string;version:number;hash:string};evidence?:VersionRef}
        if(!change.before)return
        const latest=change.after
        if(this.store.db.prepare("SELECT version FROM observed_file_heads WHERE id=?").get(latest.id)?.version!==latest.version)return
        if(this.cognitionInvalidated)for(const row of this.store.db.prepare("SELECT g.id,min(r.evidence) AS evidence FROM observed_file_reads r JOIN observed_file_versions v ON v.id=r.file_id AND v.version=r.version JOIN activation_grants g ON g.id=r.grant_id WHERE r.file_id=? AND g.state IN ('claimed','completed') AND json_extract(g.payload,'$.executionMode')='cognition' AND json_extract(v.payload,'$.hash')<>? GROUP BY g.id").all(latest.id,latest.hash)) {
          const fresh=this.store.db.prepare("SELECT evidence FROM observed_file_reads WHERE file_id=? AND version=? ORDER BY rowid DESC LIMIT 1").get(latest.id,latest.version)
          const proof=change.evidence??(fresh?JSON.parse(String(fresh.evidence)) as VersionRef:undefined)
          if(proof)this.cognitionInvalidated(String(row.id),{entityId:latest.id,port:"content",view:"utf8-exact",version:latest.version,hash:latest.hash},[JSON.parse(String(row.evidence)),proof],event.id)
        }
        if(!this.invalidated)return
        const rows=this.store.db.prepare("SELECT g.task_id,g.payload AS grant_payload,r.evidence FROM observed_file_reads r JOIN observed_file_versions v ON v.id=r.file_id AND v.version=r.version JOIN activation_grants g ON g.id=r.grant_id WHERE r.file_id=? AND g.state='completed' AND json_extract(g.payload,'$.executionMode')='task' AND json_extract(v.payload,'$.hash')<>?").all(latest.id,latest.hash)
        const seen=new Set<string>()
        for(const row of rows) {
          const taskId=String(row.task_id),grant=JSON.parse(String(row.grant_payload)) as ActivationGrant
          const current=this.store.db.prepare("SELECT payload FROM task_attempts WHERE task_id=? ORDER BY rowid DESC LIMIT 1").get(taskId)
          if(seen.has(taskId)||!current)continue
          const attempt=JSON.parse(String(current.payload))
          if(attempt.state==="failed"||attempt.worker?.sessionId!==grant.worker)continue
          seen.add(taskId)
          const fresh=this.store.db.prepare("SELECT evidence FROM observed_file_reads WHERE file_id=? AND version=? ORDER BY rowid DESC LIMIT 1").get(latest.id,latest.version)
          const proof=change.evidence??(fresh?JSON.parse(String(fresh.evidence)) as VersionRef:undefined)
          if(!proof)throw new Error("File change has no measured observation evidence")
          new EvidenceStore(this.store).require(proof)
          this.invalidated(taskId,{entityId:latest.id,port:"content",view:"utf8-exact",version:latest.version,hash:latest.hash},[JSON.parse(String(row.evidence)),proof])
        }
        return
      }
      if(event.type!=="AgentCompleted")return
      const grantId=String((event.payload as {grantId:string}).grantId),db=this.store.db
      // Edges become authoritative after result acceptance, avoiding mutation of
      // the graph pin while the same role is still executing its tools.
      const grant=db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
      if(grant?.state!=="completed")return
      const target=JSON.parse(String(grant.payload)) as ActivationGrant,graph=new CausalGraph(this.store)
      for(const row of db.prepare("SELECT * FROM observed_file_reads WHERE grant_id=? ORDER BY file_id,version,call_id").all(grantId)) {
        const fileId=String(row.file_id),id=digest({fileId,taskId:target.taskId,relation:"depends_on",view:"utf8-exact"})
        const previous=graph.outgoing(fileId).find(edge=>edge.id===id),evidence=JSON.parse(String(row.evidence))
        if(previous?.evidence.some(ref=>ref.id===evidence.id))continue
        graph.put({id,version:(previous?.version??0)+1,source:{entityId:fileId,port:"content",view:"utf8-exact"},target:{entityId:target.taskId,port:"inputs",view:"gateway-file-reads"},relation:"depends_on",changeTypes:["syntactic","implementation","behavior","contract","dependency"],impactWeight:1,critical:true,observedPropagationRate:{successes:0,trials:0,estimate:1,modelVersion:"unmeasured-conservative/v1"},evidence:[...(previous?.evidence??[]),evidence],completeness:"observed"},previous?.version??0)
      }
    },1000)
  }
}
