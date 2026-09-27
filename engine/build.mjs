import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('./', import.meta.url)), cwd = join(root, 'ax')
mkdirSync(join(cwd, 'bin/linux'), { recursive: true })
for (const name of ['task-agent', 'ax', 'ax-controller', 'ax-server', 'ax-task-runner', 'task-agent-exec']) {
 const linux = name === 'ax-task-runner' || name === 'task-agent-exec'
 const result = spawnSync(process.env.GO_BINARY ?? 'go', ['build', '-trimpath', '-o', join(cwd, 'bin', linux ? 'linux' : '', name), `./cmd/${name}`], { cwd, stdio: 'inherit', env: { ...process.env, GOTOOLCHAIN: 'go1.27.1', ...(linux ? { GOOS: 'linux', GOARCH: process.arch === 'arm64' ? 'arm64' : 'amd64', CGO_ENABLED: '0' } : {}) } })
 if (result.error || result.status) throw Error(`Building ${name} failed`)
}
