import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { invocation } from './task-agent.mjs'
test('context resolves AX engine independently of target project', () => {
 const project=mkdtempSync(join(tmpdir(),'task-agent project ')), result=invocation(['--context','--project',project])
 assert.equal(result.projectRoot,realpathSync(project));assert.match(result.cli,/engine\/ax\/bin\/task-agent$/);assert.equal(result.contextOnly,true)
})
test('arguments remain literal and legacy SQLite state is rejected',()=>{
 const value='plan $(touch unwanted); 한글.json',result=invocation(['validate',value])
 assert.equal(result.args.at(-1),value)
 assert.throws(()=>invocation(['--state','old','status','demo']),/not automatically migrated/)
})
