import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { ChatGPTModelBroker } from './model-broker.ts'
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
function fixture(t: any) {
  const root = mkdtempSync(join(tmpdir(), 'task-model-broker-'))
  for (const name of ['requests','responses','claims']) mkdirSync(join(root,name))
  const authFile = join(root,'auth.json')
  writeFileSync(authFile,JSON.stringify({auth_mode:'chatgpt',tokens:{access_token:'test-credential',account_id:'test-account'}}))
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  return {root,authFile}
}
async function result(root: string,id: string) {
  const path=join(root,'responses',id)
  for(let i=0;i<100&&!existsSync(path);i++)await pause(10)
  return JSON.parse(readFileSync(path,'utf8'))
}
test('model broker fixes destination and credentials, preserves SSE, and delivers each request once',async t=>{
  const {root,authFile}=fixture(t);let calls=0
  const transport: typeof fetch=async(url,options)=>{
    calls++;assert.equal(url,'https://chatgpt.com/backend-api/codex/responses')
    assert.equal(new Headers(options!.headers).get('authorization'),'Bearer test-credential')
    assert.equal(options!.redirect,'error');assert.equal(JSON.parse(options!.body as string).store,false)
    return new Response('data: {"type":"response.completed"}\n\n',{headers:{'content-type':'text/event-stream'}})
  }
  const broker=new ChatGPTModelBroker({authFile},transport), second=new ChatGPTModelBroker({authFile},transport)
  t.after(()=>{broker.close();second.close()})
  const id=randomUUID()+'.json'
  writeFileSync(join(root,'requests',id),JSON.stringify({method:'POST',path:'/responses',body:JSON.stringify({model:'test',store:true})}))
  broker.pump(root);second.pump(root)
  const response=await result(root,id);assert.equal(response.status,200);assert.match(response.body,/response.completed/)
  assert.ok(!JSON.stringify(response).includes('test-credential'));broker.pump(root);assert.equal(calls,1)
})
test('model broker rejects arbitrary routes and symlink requests without issuing an authenticated request',async t=>{
  const {root,authFile}=fixture(t);let calls=0
  const broker=new ChatGPTModelBroker({authFile},async()=>{calls++;return new Response('unexpected')});t.after(()=>broker.close())
  const first=randomUUID()+'.json',second=randomUUID()+'.json'
  writeFileSync(join(root,'requests',first),JSON.stringify({method:'POST',path:'https://attacker.invalid',body:'{}'}))
  symlinkSync(authFile,join(root,'requests',second))
  broker.pump(root)
  assert.equal((await result(root,first)).status,502);assert.equal((await result(root,second)).status,502);assert.equal(calls,0)
})
test('model broker does not replay an uncertain request left by a dead controller',async t=>{
  const {root,authFile}=fixture(t);let calls=0
  const broker=new ChatGPTModelBroker({authFile},async()=>{calls++;return new Response('unexpected')});t.after(()=>broker.close())
  const id=randomUUID()+'.json'
  writeFileSync(join(root,'requests',id),JSON.stringify({method:'POST',path:'/responses',body:'{"model":"test"}'}))
  writeFileSync(join(root,'claims',id),JSON.stringify({pid:process.pid,startedAt:0}))
  broker.pump(root);assert.equal((await result(root,id)).status,502);assert.equal(calls,0)
})
