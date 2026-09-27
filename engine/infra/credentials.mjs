import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)), state=join(root,'.state/local')
const source=process.env.TASK_AGENT_SUBSTRATE_SOURCE
if(!source)throw Error('TASK_AGENT_SUBSTRATE_SOURCE must identify the pinned infrastructure source')
const lock=JSON.parse(readFileSync(new URL('./substrate.lock.json',import.meta.url)))
const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'})
if(revision.stdout?.trim()!==lock.commit)throw Error('Source does not match lock')
const env={...process.env,KUBECONFIG:join(state,'kubeconfig'),KO_DOCKER_REPO:'localhost:5001/task-agent',KO_DEFAULTPLATFORMS:`linux/${process.arch==='arm64'?'arm64':'amd64'}`,GOTOOLCHAIN:'go1.27.1'}
function run(cmd,args,cwd=source){const r=spawnSync(cmd,args,{cwd,env,stdio:'inherit'});if(r.error||r.status)throw Error(`${cmd} failed`)}
run('kubectl',['--context','kind-task-agent-ax-source','get','svc','api','-n','ate-system'])
// Reuse the upstream provider and namespace policy, changing only this deployment's binding.
const policy=readFileSync(join(source,'manifests/egress-credential-injection/namespace-policy.yaml'),'utf8').replace('atespace: team-a','atespace: task-agent').replace('- ns1','- ax-system')
const file=join(state,'credential-policy.yaml');writeFileSync(file,policy)
run('kubectl',['--context','kind-task-agent-ax-source','apply','-f',file])
run(process.env.KO_BINARY??'ko',['apply','-f','manifests/egress-credential-injection/k8s-credential-provider.yaml'])
run('kubectl',['--context','kind-task-agent-ax-source','rollout','restart','deployment/k8s-credential-provider','-n','ate-system'])
