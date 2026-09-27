import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, readdirSync, chmodSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('./', import.meta.url))
function files(directory, prefix = '') {
 return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (entry.isSymbolicLink()) throw Error('Skill source must not contain symlinks')
  const relative = join(prefix, entry.name)
  return entry.isDirectory() ? files(join(directory, entry.name), relative) : [relative]
 })
}
export function installSkill(codex = process.env.CODEX_HOME ?? join(homedir(), '.codex')) {
 const target = join(codex, 'skills/task-agent')
 const backup = join(root, '.state/skill-backups', `${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`)
 mkdirSync(backup, { recursive: true })
 function preserve(file, relative) {
  if (!existsSync(file)) return
  const to = join(backup, relative); mkdirSync(dirname(to), { recursive: true }); copyFileSync(file, to)
 }
 for (const file of files(join(root, 'skill')).filter(file => file !== 'task-agent.toml' && !file.endsWith('.test.mjs'))) {
  const from = join(root, 'skill', file), to = join(target, file)
  preserve(to, file); mkdirSync(dirname(to), { recursive: true })
  if (file === 'engine.json') writeFileSync(to, JSON.stringify({ engineRoot: root }, null, 2) + '\n')
  else { copyFileSync(from, to); chmodSync(to, statSync(from).mode & 0o777) }
 }
 const role = join(codex, 'agents/task-agent.toml'); mkdirSync(dirname(role), { recursive: true })
 preserve(role, 'task-agent.toml')
 writeFileSync(role, readFileSync(join(root, 'skill/task-agent.toml'), 'utf8').replace('~/.codex/skills/task-agent/SKILL.md', join(target, 'SKILL.md')))
 return { skill: target, role, backup }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(installSkill()))
