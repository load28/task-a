import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,writeFileSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { controlCompletionMissing,currentInputVector,attemptInputVector } from "../packages/task-control/src/completion.ts"
import type { ObservedInputDefinition } from "../packages/task-control/src/observed-inputs.ts"

function setup(r:ReturnType<typeof createGraphRuntime>,command?:string) {
  const content={authorize:"Observe the fixture tool/config view using an isolated read-only process"}
  const authorization=r.control.evidence.put({id:"input-operator",version:1,type:"code",source:"test controller",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
  r.control.validators.register({id:"observe-config",version:1,command:[process.execPath,"-e",command??`const fs=require('node:fs');console.log(JSON.stringify({status:'known',schemaVersion:'config/v1',value:{config:fs.readFileSync('config.txt','utf8'),environment:process.env.TASK_INPUT_TEST_VALUE}}));`],cwd:".",environment:{TASK_INPUT_TEST_VALUE:"declared test environment"},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
  const definition:ObservedInputDefinition={id:"configuration",version:1,kind:"environment",schemaVersion:"config/v1",validator:"observe-config/v1",authorization:[authorization],maxAgeMs:60000}
  r.control.inputs.register(definition)
  const a=r.engine.createTask({title:"consumer",goal:"Use measured config"}),b=r.engine.createTask({title:"unrelated",goal:"No config input"})
  r.control.inputs.bind(a.id,[definition])
  return {definition,authorization,a,b}
}

test("코드·도구·환경·외부 값은 각각 독립된 실행 입력 view로 고정된다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"observed-kinds-")),r=createGraphRuntime(":memory:")
  try {
    const content={authorize:"Observe every registered external input kind"},authorization=r.control.evidence.put({id:"all-input-kinds",version:1,type:"code",source:"test controller",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    r.control.validators.register({id:"observe-kind",version:1,command:[process.execPath,"-e","console.log(JSON.stringify({status:'known',schemaVersion:'input/v1',value:{version:'pinned'}}))"],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
    const definitions=(["code","tool","environment","external"] as const).map(kind=>({id:`${kind}-input`,version:1,kind,schemaVersion:"input/v1",validator:"observe-kind/v1",authorization:[authorization],maxAgeMs:60000}))
    definitions.forEach(definition=>r.control.inputs.register(definition))
    const task=r.engine.createTask({title:"all inputs",goal:"consume exact external views"})
    r.control.inputs.bind(task.id,definitions);definitions.forEach(definition=>r.control.inputs.refresh(definition))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000})
    const current=currentInputVector(r.engine,task.id)
    const observed=current.filter(item=>item.entityId.startsWith("observed-input:"))
    assert.deepEqual(observed.map(item=>item.port).sort(),["code","environment","external","tool"])
    assert.ok(observed.every(item=>item.view==="input/v1"))
    r.engine.startTask(task.id)
    assert.deepEqual(attemptInputVector(r.engine,task.id),current)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("실제 환경·파일 관찰은 입력 digest와 필수 의무에 연결되고 변경은 등록 소비자만 fence한다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"observed-input-")),r=createGraphRuntime(":memory:")
  try {
    writeFileSync(join(dir,"config.txt"),"before")
    const {definition,a,b}=setup(r)
    assert.equal(r.control.inputs.ensure([definition]),false)
    assert.ok(controlCompletionMissing(r.engine,[a.id]).some(reason=>reason.includes("registered input")))
    const jobs=Number(r.store.db.prepare("SELECT count(*) n FROM validation_jobs").get()!.n)
    assert.equal(r.control.inputs.ensure([definition]),false)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM validation_jobs").get()!.n,jobs)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    assert.equal(r.control.inputs.valid(definition),true)
    assert.deepEqual(r.control.inputs.taskValues(a.id)[0]!.value,{config:"before",environment:"declared test environment"})
    const before=r.engine.signals.capture(a.id),unrelated=r.engine.signals.capture(b.id)
    r.engine.startTask(a.id);r.engine.startTask(b.id)
    writeFileSync(join(dir,"config.txt"),"after")
    r.control.inputs.refresh(definition)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    const after=r.engine.signals.capture(a.id)
    assert.equal(before.specHash,after.specHash,"An input observation cannot rewrite the original goal")
    assert.notEqual(before.digest,after.digest)
    assert.deepEqual(unrelated,r.engine.signals.capture(b.id))
    assert.equal(r.store.currentAttempt(a.id)!.state,"fenced")
    assert.equal(r.store.currentAttempt(b.id)!.state,"running")
    assert.equal(r.control.inputs.taskValues(a.id)[0]!.version,2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,0)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["failure","malformed","missing","unknown","schema","truncated"] as const)test(`불완전한 외부 입력은 관측 성공으로 바뀌지 않는다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"observed-unknown-")),r=createGraphRuntime(":memory:")
  try {
    const command=mode==="failure"?"process.exit(2)":mode==="malformed"?"console.log('not JSON')":mode==="truncated"?"console.log(' '.repeat(3000))":`console.log(JSON.stringify({status:${JSON.stringify(mode==="schema"?"known":mode)},schemaVersion:${JSON.stringify(mode==="schema"?"wrong/v1":"config/v1")},value:null}))`
    const {definition,a}=setup(r,command)
    r.control.inputs.refresh(definition)
    await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:4000})
    assert.equal(r.control.inputs.valid(definition),false)
    assert.throws(()=>r.control.inputs.taskValues(a.id),/unresolved/)
    const generation=r.store.db.prepare("SELECT generation FROM observed_input_state").get()!.generation
    r.control.inputs.ensure([definition])
    assert.equal(r.store.db.prepare("SELECT generation FROM observed_input_state").get()!.generation,generation,"Unknown results do not create an unbounded immediate retry loop")
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["receipt","authorization","restart"] as const)test(`관찰 근거의 철회와 저장된 input binding을 보존한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"observed-lifetime-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    writeFileSync(join(dir,"config.txt"),"stable")
    const {definition,authorization,a,b}=setup(r)
    r.control.inputs.refresh(definition)
    await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:4000})
    const first=r.control.inputs.current(definition)!
    r.engine.startTask(a.id);r.engine.startTask(b.id)
    if(mode==="restart") {
      r.close();r=createGraphRuntime(file)
      assert.equal(r.control.inputs.valid(definition),true)
      assert.deepEqual(r.control.inputs.current(definition),first)
      r.control.inputs.refresh(definition)
      await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:4000})
      assert.equal(r.store.currentAttempt(a.id)!.state,"running","Refreshing equal semantic input must not fence unchanged work")
    }else {
      const independent=r.control.evidence.put({id:"retraction-operator",version:1,type:"user",source:"fixture",producer:"test",validatorVersion:"fixture/v1",timestamp:Date.now(),content:{authorization:true},contentHash:digest({authorization:true}),inputVector:[],confidence:1,expiresAt:null})
      const proof=mode==="authorization"?authorization:r.control.evidence.obligation(first.obligationId)!.evidence[0]!
      r.control.evidence.retract(proof,[independent],"withdraw observation basis")
      assert.equal(r.control.inputs.valid(definition),false)
      assert.equal(r.store.currentAttempt(a.id)!.state,"fenced")
      assert.equal(r.store.currentAttempt(b.id)!.state,"running")
      assert.ok(controlCompletionMissing(r.engine,[a.id]).some(reason=>reason.includes("registered input")))
    }
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
