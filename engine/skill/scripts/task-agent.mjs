import { readFileSync, realpathSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
export function invocation(argv, cwd = process.cwd(), env = process.env) {
 const args = [], options = new Map()
 for (let i = 0; i < argv.length; i++) {
  const arg = argv[i]
  if (arg === '--context') { if (options.has(arg)) throw Error('Duplicate --context'); options.set(arg, true); continue }
  if (arg === '--project') { if (options.has(arg) || !argv[i + 1]) throw Error('Invalid --project'); options.set(arg, argv[++i]); continue }
  if (arg === '--state') throw Error('AX uses project-scoped Redis state; legacy SQLite state is not automatically migrated')
  args.push(arg)
 }
 const config = JSON.parse(readFileSync(new URL('../engine.json', import.meta.url), 'utf8'))
 const configured = env.TASK_AGENT_ENGINE_ROOT ? resolve(cwd, env.TASK_AGENT_ENGINE_ROOT) : resolve(fileURLToPath(new URL('../', import.meta.url)), config.engineRoot)
 const engineRoot = realpathSync(configured)
 const cli = join(engineRoot, 'ax/bin/task-agent')
 if (!existsSync(join(engineRoot, 'upstream.lock.json'))) throw Error('AX source engine is unavailable')
 const projectRoot = realpathSync(resolve(cwd, options.get('--project') ?? '.'))
 if (!statSync(projectRoot).isDirectory()) throw Error('Project is not a directory')
 if (options.has('--context') && args.length) throw Error('--context cannot include a command')
 return { engineRoot, cli, projectRoot, contextOnly: options.has('--context'), args: ['--project', projectRoot, ...args] }
}
async function main() {
 const target = invocation(process.argv.slice(2))
 if (target.contextOnly) { console.log(JSON.stringify({ ...target, engine: 'ax-source', state: 'project-scoped Redis', cliBuilt: existsSync(target.cli) })); return }
 if (!existsSync(target.cli)) throw Error('Build the AX engine with node engine/build.mjs before execution')
 const connection = join(target.engineRoot, '.state/local/connection.json')
 const settings = existsSync(connection) ? JSON.parse(readFileSync(connection, 'utf8')) : {}
 const allowed = /^(TASK_AGENT_(AX_ENDPOINT|REDIS_ADDR|SUBSTRATE_ENDPOINT|SUBSTRATE_AUTHORITY|ROUTER|ATESPACE|CODEX_CREDENTIAL_URI)|SUBSTRATE_(TOKEN_FILE|CA_FILE))$/
 if (Object.keys(settings).some(k => !allowed.test(k))) throw Error('Unexpected connection setting')
 const child = spawn(target.cli, target.args, { cwd: target.projectRoot, stdio: 'inherit', env: { ...settings, ...process.env } })
 const interrupt = () => child.kill('SIGINT'), stop = () => child.kill('SIGTERM')
 process.on('SIGINT', interrupt); process.on('SIGTERM', stop)
 try { process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (code, signal) => resolve(code ?? (signal === 'SIGINT' ? 130 : 143))) }) }
 finally { process.off('SIGINT', interrupt); process.off('SIGTERM', stop) }
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
