import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,realpathSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { executeValidator } from "../packages/task-evidence/src/validators.ts"
import { linuxBubblewrap } from "../packages/task-evidence/src/native-sandbox.ts"

test("Linux native 검증기는 전체 host root 없이 bubblewrap 격리 명령을 구성한다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"linux-isolation-contract-")),workspace=join(directory,"workspace")
  mkdirSync(workspace)
  const sandbox=linuxBubblewrap([process.execPath,"-e","process.exit(0)"],workspace,workspace,{},[],"/usr/bin/bwrap")
  try {
    assert.equal(sandbox.receipt.kind,"linux-bubblewrap")
    assert.ok(sandbox.command.includes("--unshare-all"))
    assert.ok(sandbox.command.includes("--die-with-parent"))
    const mountedWorkspace=realpathSync(workspace)
    assert.ok(sandbox.command.some((value,index)=>value==="--ro-bind"&&sandbox.command[index+1]===mountedWorkspace&&sandbox.command[index+2]===mountedWorkspace))
    assert.equal(sandbox.command.some((value,index)=>value==="--ro-bind"&&sandbox.command[index+1]==="/"),false)
    assert.equal(sandbox.environment.HOME,undefined)
  }finally{sandbox.close();rmSync(directory,{recursive:true,force:true})}
})

test("Linux native 검증기는 작업공간 밖 cwd를 격리 명령에 넣지 않는다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"linux-isolation-cwd-")),workspace=join(directory,"workspace"),outside=join(directory,"outside")
  mkdirSync(workspace);mkdirSync(outside)
  try {assert.throws(()=>linuxBubblewrap([process.execPath,"-e","process.exit(0)"],workspace,outside,{},[],"/usr/bin/bwrap"),/cwd must stay inside/)}
  finally{rmSync(directory,{recursive:true,force:true})}
})

test("native 검증기는 외부 파일·네트워크·쓰기·분리된 자식 프로세스를 차단한다",async()=>{
  const directory=mkdtempSync(join(tmpdir(),"native-isolation-test-")),workspace=join(directory,"workspace"),secret=join(directory,"private-credential"),r=createGraphRuntime(":memory:")
  mkdirSync(workspace);writeFileSync(secret,"fixture secret");writeFileSync(join(workspace,"source.txt"),"source")
  try {
    const script=`
      const fs=require('node:fs'),net=require('node:net'),cp=require('node:child_process');
      if(fs.readFileSync('source.txt','utf8')!=='source')process.exit(1);
      const denied=operation=>{try{operation();process.exit(2)}catch(e){if(!['EPERM','EACCES'].includes(e.code))throw e}};
      denied(()=>fs.readFileSync(${JSON.stringify(secret)},'utf8'));
      denied(()=>fs.writeFileSync('source.txt','changed'));
      const child=cp.spawnSync(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true});
      if(!child.error||!['EPERM','EACCES'].includes(child.error.code))process.exit(3);
      fs.writeFileSync(process.env.HOME+'/scratch','temporary');
      const socket=net.createServer();socket.on('error',e=>{if(!['EPERM','EACCES'].includes(e.code))process.exit(4);console.log(JSON.stringify({passed:true,scratch:process.env.HOME}))});socket.listen(9999,'127.0.0.1');
    `
    const result=await executeValidator({id:"native-isolation",version:1,command:[process.execPath,"-e",script],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:4000,inputVector:[]},workspace,r.control.evidence)
    assert.equal(result.receipt.exitCode,0,result.receipt.stderr)
    assert.equal(result.receipt.isolation?.kind,"macos-seatbelt")
    const output=JSON.parse(result.receipt.stdout)
    assert.equal(output.passed,true);assert.equal(existsSync(output.scratch),false)
    assert.equal(readFileSync(secret,"utf8"),"fixture secret")
    assert.equal(readFileSync(join(workspace,"source.txt"),"utf8"),"source")
  }finally{r.close();rmSync(directory,{recursive:true,force:true})}
})

test("native 검증기는 기한이 지나면 제한된 프로세스를 종료하고 임시 공간을 정리한다",async()=>{
  const workspace=mkdtempSync(join(tmpdir(),"native-timeout-")),r=createGraphRuntime(":memory:")
  try {
    const result=await executeValidator({id:"native-timeout",version:1,command:[process.execPath,"-e","console.log(process.env.HOME);setInterval(()=>{},1000)"],cwd:".",environment:{},timeoutMs:500,maxOutputBytes:1000,inputVector:[]},workspace,r.control.evidence)
    assert.equal(result.receipt.timedOut,true)
    assert.equal(result.receipt.signal,"SIGKILL")
    assert.ok(result.receipt.stdout.trim())
    assert.equal(existsSync(result.receipt.stdout.trim()),false)
    assert.equal((r.control.evidence.require(result.evidence).content as {passed:boolean}).passed,false)
  }finally{r.close();rmSync(workspace,{recursive:true,force:true})}
})
