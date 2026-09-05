import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { OpenCodeConnection } from "../packages/opencode-harness/src/index.ts"

test("OpenCode 연결은 Basic 인증을 전달하고 외부 평문 서버를 거부한다", async () => {
  const seen: string[] = []
  const server = createServer((req, res) => {
    seen.push(req.headers.authorization ?? "")
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ healthy: true, version: "fixture" }))
  })
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok))
  const port = (server.address() as { port: number }).port
  const connection = new OpenCodeConnection({
    baseUrl: `http://127.0.0.1:${port}`,
    username: "test",
    password: "synthetic-test-password",
  })
  try {
    assert.deepEqual(await connection.health(), { healthy: true, version: "fixture" })
    assert.equal(seen[0], `Basic ${Buffer.from("test:synthetic-test-password").toString("base64")}`)
    const unsafe = new OpenCodeConnection({ baseUrl: "http://remote.example:4096" })
    await assert.rejects(unsafe.health(), /requires HTTPS/)
    await unsafe.close()
    await assert.rejects(unsafe.health(), /closed/)
  } finally {
    await connection.close()
    await new Promise<void>((ok) => server.close(() => ok()))
  }
})
