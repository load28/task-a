import {spawn} from 'node:child_process'
import {mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {join} from 'node:path'
const cwd=fileURLToPath(new URL('.',import.meta.url))
const output=fileURLToPath(new URL('../.state/runner',import.meta.url))
mkdirSync(output,{recursive:true})
const binary=join(output,'task-step')
const child=spawn(process.env.GO_BINARY??'go',['build','-trimpath','-o',binary,'./cmd/task-step'],{cwd,stdio:'inherit',env:{...process.env,GOOS:'linux',GOARCH:process.env.TASK_AGENT_RUNNER_ARCH??(process.arch==='arm64'?'arm64':'amd64'),CGO_ENABLED:'0'}})
child.once('error',error=>{console.error(error.message);process.exitCode=1})
child.once('exit',code=>{process.exitCode=code??1;if(code===0)console.log(JSON.stringify({supervisorPath:binary}))})
