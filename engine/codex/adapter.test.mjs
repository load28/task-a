import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const image=process.env.TASK_AGENT_TEST_IMAGE
const delay=ms=>new Promise(r=>setTimeout(r,ms))
test('golden warmup does not launch Codex; activation and exact-session resume do', { skip:!image, timeout:30000 },async()=>{
 const root=mkdtempSync(join(tmpdir(),'ax-codex-adapter-')),workspace=join(root,'workspace'),fake=join(root,'fake')
 mkdirSync(join(workspace,'work/.task-agent'),{recursive:true});mkdirSync(fake)
 const id='11111111-1111-4111-8111-111111111111'
 writeFileSync(join(fake,'codex'),`#!/usr/bin/env node\nrequire('fs').writeFileSync('/workspace/invocation.json',JSON.stringify(process.argv.slice(2)));console.log(JSON.stringify({type:'thread.started',thread_id:'${id}'}))\n`,{mode:0o755})
 const name='task-agent-adapter-'+Date.now()
 const args=['run','--rm','--name',name,'--network=none','-e','TASK_AGENT_EXECUTION_ID=expected-task','-e','PATH=/fake:/usr/local/bin:/usr/bin:/bin','-v',`${workspace}:/workspace`,'-v',`${fake}:/fake:ro`,'-v',`${resolve('engine/codex/task-agent-codex.mjs')}:/adapter.mjs:ro`,'-w','/workspace/work','--entrypoint','node',image,'/adapter.mjs','test-model','작업 목표']
 const run=()=>{const child=spawn('docker',args,{stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',x=>stderr+=x);return {child,done:new Promise((yes,no)=>{child.once('error',no);child.once('close',code=>code===0?yes():no(Error(stderr)))})}}
 try {
  const first=run();await delay(1200);assert.equal(existsSync(join(workspace,'invocation.json')),false)
  writeFileSync(join(workspace,'work/.task-agent/activation'),'expected-task')
  await first.done
  const initial=JSON.parse(readFileSync(join(workspace,'invocation.json'),'utf8'));assert.equal(initial[0],'exec');assert.equal(initial.includes('resume'),false)
  const second=run();await second.done
  const resumed=JSON.parse(readFileSync(join(workspace,'invocation.json'),'utf8'));assert.deepEqual(resumed.slice(0,3),['exec','resume',id])
  assert.equal(existsSync(join(workspace,'.task-agent/codex/auth.json')),false)
 } finally {spawnSync('docker',['rm','-f',name],{stdio:'ignore'})}
})
