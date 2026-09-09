import test from "node:test"
import assert from "node:assert/strict"
import { prepareLocalRelease, sourceRevision } from "../packages/host-integration/src/reload.ts"
import type { HostConfig } from "../packages/host-integration/src/config.ts"

const config: HostConfig = { version: 1, directory: "/tmp/test", database: "/tmp/test/db", socket: "/tmp/test/socket", workspaces: [], autoContinue: true, maxRuns: 20,
  kubernetes: { namespace: "custom", context: "kind-development", image: "old-worker", envSecret: "keep-secret" } }
test("로컬 갱신은 검증과 두 이미지 빌드 후 설정된 kind에 배포한다", async () => {
  const calls: Array<[string, string[]]> = []
  const release = await prepareLocalRelease(process.cwd(), config, async (command, args) => {
    calls.push([command, args])
    return command === "helm" && args[0] === "list" ? JSON.stringify([{ name: "existing-release", chart: "task-instances-0.1.0" }]) : ""
  })
  assert.equal(release.revision, sourceRevision(process.cwd()))
  assert.deepEqual(calls[0], ["npm", ["run", "check"]])
  const build = calls.filter(([cmd]) => cmd === "docker")
  assert.equal(build.length, 2)
  assert.ok(build[1]![1].includes(`INSTANCE_IMAGE=${release.controllerImage}`))
  const load = calls.find(([cmd]) => cmd === "kind")!
  assert.deepEqual(load[1].slice(-2), ["--name", "development"])
  const deploy = calls.at(-1)!
  assert.equal(deploy[0], "helm")
  assert.equal(deploy[1][1], "existing-release")
  assert.ok(deploy[1].includes("--reuse-values"))
  assert.ok(deploy[1].includes("--atomic"))
  assert.equal(config.kubernetes!.image, "old-worker")
})

test("검사 또는 이미지 빌드 실패 시 실행 환경 배포를 시작하지 않는다", async () => {
  for (const failure of ["npm", "docker"]) {
    const calls: string[] = []
    await assert.rejects(prepareLocalRelease(process.cwd(), config, async (command, args) => {
      calls.push(`${command} ${args[0]}`)
      if (command === failure) throw new Error("검증 실패")
      return command === "helm" ? JSON.stringify([{ name: "existing", chart: "task-instances-0.1.0" }]) : ""
    }), /검증 실패/)
    assert.ok(!calls.includes("kind load"))
    assert.ok(!calls.includes("helm upgrade"))
  }
})

test("Kubernetes 미사용 설정은 호스트만 갱신하고 원격 클러스터는 거부한다", async () => {
  const calls: string[] = []
  const result = await prepareLocalRelease(process.cwd(), { ...config, kubernetes: undefined }, async command => { calls.push(command); return "" })
  assert.deepEqual(calls, ["npm"])
  assert.equal(result.workerImage, undefined)
  await assert.rejects(prepareLocalRelease(process.cwd(), { ...config, kubernetes: { namespace: "prod", context: "production" } }, async () => ""), /local kind/)
})

test("종료 중 연결 리셋은 완료로 간주하지 않고 기존 소켓의 종료까지 확인한다", async () => {
  const { stopHost } = await import("../packages/host-integration/src/reload.ts")
  const calls: string[] = []
  await stopHost("socket", async (_socket, path) => {
    calls.push(path)
    if (calls.length <= 2) throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" })
    throw Object.assign(new Error("stopped"), { code: "ENOENT" })
  })
  assert.deepEqual(calls, ["/shutdown", "/health", "/health"])
  await assert.rejects(stopHost("socket", async () => { throw Object.assign(new Error("permission denied"), { code: "EACCES" }) }), /permission denied/)
})
