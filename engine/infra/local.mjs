import { spawnSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url)), lock = JSON.parse(readFileSync(new URL('./substrate.lock.json', import.meta.url)))
const source = resolve(process.env.TASK_AGENT_SUBSTRATE_SOURCE ?? join(root, '.state/substrate'))
const state = join(root, '.state/local'), cluster = 'task-agent-ax-source', context = `kind-${cluster}`
mkdirSync(state, { recursive: true, mode: 0o700 })
const env = { ...process.env, GOTOOLCHAIN: 'go1.27.1', KUBECONFIG: join(state, 'kubeconfig'), KIND_CLUSTER_NAME: cluster, KUBECTL_CONTEXT: context, KO_DOCKER_REPO: 'localhost:5001/task-agent', KO_DEFAULTPLATFORMS: `linux/${process.arch === 'arm64' ? 'arm64' : 'amd64'}` }
function run(command, args, cwd = source, capture = false) {
 const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
 if (result.error || result.status !== 0) throw Error(`${command} failed (${result.status})${capture ? ': ' + result.stderr : ''}`)
 return result.stdout?.trim()
}
const mode = process.argv[2]
if (mode === 'prepare' && !existsSync(source)) { run('git', ['clone', '--no-checkout', '--filter=blob:none', lock.repository, source], root); run('git', ['checkout', '--detach', lock.commit]) }
if (run('git', ['rev-parse', 'HEAD'], source, true) !== lock.commit) throw Error('Substrate source does not match lock')
if (mode === 'prepare') console.log(source)
else if (mode === 'create') {
 if (run('kind', ['get', 'clusters'], source, true).split('\n').includes(cluster)) throw Error('Dedicated cluster exists; refusing upstream delete-and-create')
 const containers = run('docker', ['ps', '-a', '--format', '{{.Names}}'], source, true).split('\n')
 if (containers.includes('kind-registry')) throw Error('Shared registry exists; refusing upstream registry mutation')
 run('bash', ['hack/create-kind-cluster.sh'])
} else if (mode === 'install') {
 run('kubectl', ['--context', context, 'get', 'nodes'])
 run('bash', ['hack/install-ate-kind.sh', '--deploy-ate-system', '--experimental-use-sdsmint', '--experimental-egress-credential-injection'])
} else if (mode === 'deploy') {
 run('kubectl', ['--context', context, 'get', 'svc', '-n', 'ate-system', 'api'])
 const output = join(state, 'manifests'); mkdirSync(output, { recursive: true })
 for (const name of ['redis', 'ax-controller', 'ax-server']) {
  let yaml = readFileSync(join(root, 'ax/deploy', name + '.yaml'), 'utf8')
  if (name === 'ax-controller') yaml = yaml.replace('gs://snapshot-substrate-test-ax-substrate/ate-env/', 'gs://ate-snapshots/ax/')
  if (name === 'redis') {
   yaml = yaml.replace('          ports:', '          args: ["--appendonly", "yes", "--appendfsync", "always"]\n          volumeMounts:\n            - name: data\n              mountPath: /data\n          ports:')
   yaml = yaml.replace('\n---\napiVersion: v1\nkind: Service', '\n      volumes:\n        - name: data\n          persistentVolumeClaim:\n            claimName: ax-redis-data\n---\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: ax-redis-data\n  namespace: ax-system\nspec:\n  accessModes: [ReadWriteOnce]\n  resources:\n    requests:\n      storage: 1Gi\n---\napiVersion: v1\nkind: Service')
  }
  const file = join(output, name + '.yaml'); writeFileSync(file, yaml)
  if (name === 'redis') run('kubectl', ['--context', context, 'apply', '-f', file])
  else run(process.env.KO_BINARY ?? 'ko', ['apply', '-f', file], join(root, 'ax'))
 }
 run(process.env.KO_BINARY ?? 'ko', ['apply', '-f', join(root, 'infra/workers.yaml')], source)
 run('kubectl', ['--context', context, 'rollout', 'status', 'deployment', '-n', 'ax-system', '--timeout=60s'])
} else if (mode !== 'prepare') throw Error('Usage: local.mjs prepare|create|install|deploy')
