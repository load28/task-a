import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
const root=fileURLToPath(new URL('./',import.meta.url)), codex=process.env.CODEX_HOME??join(homedir(),'.codex')
const target=join(codex,'skills/task-agent'), backup=join(root,'.state/skill-backups',new Date().toISOString().replaceAll(':','-'))
for(const file of ['SKILL.md','scripts/task-agent.mjs','references/planning.md','engine.json']){
 const from=join(root,'skill',file),to=join(target,file)
 if(existsSync(to)){mkdirSync(join(backup,file,'..'),{recursive:true});copyFileSync(to,join(backup,file))}
 mkdirSync(join(to,'..'),{recursive:true})
 if(file==='engine.json')writeFileSync(to,JSON.stringify({engineRoot:root},null,2)+'\n')
 else copyFileSync(from,to)
}
const role=join(codex,'agents/task-agent.toml');mkdirSync(join(role,'..'),{recursive:true})
if(existsSync(role))copyFileSync(role,join(backup,'task-agent.toml'))
writeFileSync(role,readFileSync(join(root,'skill/task-agent.toml'),'utf8').replace('~/.codex/skills/task-agent/SKILL.md',join(target,'SKILL.md')))
console.log(JSON.stringify({skill:target,role,backup}))
