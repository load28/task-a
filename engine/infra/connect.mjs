import { spawn, spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),state=join(root,'.state/local')
const args=['--kubeconfig',join(state,'kubeconfig'),'--context','kind-task-agent-ax-source']
function capture(extra){const r=spawnSync('kubectl',[...args,...extra],{encoding:'utf8'});if(r.error||r.status)throw Error('Could not prepare Substrate control credentials');return r.stdout}
const token=capture(['create','token','ax-controller','-n','ax-system','--audience=api.ate-system.svc','--duration=2h'])
writeFileSync(join(state,'token'),token,{mode:0o600})
const bundles=JSON.parse(capture(['get','clustertrustbundles','-l','podcert.ate.dev/canarying=live','-o','json']))
const ca=bundles.items.filter(x=>x.spec.signerName==='servicedns.podcert.ate.dev/identity').map(x=>x.spec.trustBundle).join('\n')
if(!ca)throw Error('Substrate CA unavailable');writeFileSync(join(state,'ca.pem'),ca,{mode:0o600})
const connections=[['ax-system','ax-server','18080:8080'],['ax-system','ax-redis','16379:6379'],['ate-system','api','18443:443'],['ate-system','atenet-router','18081:80']]
const children=connections.map(([ns,svc,port])=>spawn('kubectl',[...args,'-n',ns,'port-forward',`svc/${svc}`,port,'--address=127.0.0.1'],{stdio:['ignore','inherit','inherit']}))
let stopping=false
const stop=()=>{stopping=true;for(const child of children)child.kill('SIGTERM')}
process.on('SIGINT',stop);process.on('SIGTERM',stop)
for(const child of children){child.on('error',()=>{process.exitCode=1;stop()});child.on('exit',code=>{if(!stopping)process.exitCode=code??1;stop()})}
writeFileSync(join(state,'connection.json'),JSON.stringify({TASK_AGENT_AX_ENDPOINT:'127.0.0.1:18080',TASK_AGENT_REDIS_ADDR:'127.0.0.1:16379',TASK_AGENT_SUBSTRATE_ENDPOINT:'127.0.0.1:18443',TASK_AGENT_SUBSTRATE_AUTHORITY:'api.ate-system.svc',SUBSTRATE_TOKEN_FILE:join(state,'token'),SUBSTRATE_CA_FILE:join(state,'ca.pem'),TASK_AGENT_ROUTER:'127.0.0.1:18081',TASK_AGENT_ATESPACE:'task-agent',TASK_AGENT_CODEX_CREDENTIAL_URI:'ate-secret://k8s.io/default/ax-system/task-agent-codex'},null,2))
console.log('Local AX ports: 18080; Redis: 16379; Substrate TLS: 18443; router: 18081')
