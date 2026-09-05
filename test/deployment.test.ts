import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { TaskGraphEngine } from "#task-engine"
import { TaskGraphStore } from "#task-store"

const exec = promisify(execFile)
test("online backup restores the task graph and owner binding without overwriting files", async () => {
  const directory = mkdtempSync(join(tmpdir(), "task-backup-test-"))
  const source = join(directory, "source.db")
  const destination = join(directory, "backup.db")
  const store = new TaskGraphStore(source)
  try {
    store.bindOwner("issuer", "owner")
    const engine = new TaskGraphEngine(store)
    const task = engine.createTask({ title: "복원", goal: "상태와 소유권 유지" })
    engine.startTask(task.id)
    engine.publishArtifact({ taskId: task.id, name: "backup-artifact", type: "note", content: "백업 검증" })
    await exec(process.execPath, ["scripts/backup.ts", source, destination])
    const restored = new TaskGraphStore(destination)
    try {
      assert.deepEqual(new TaskGraphEngine(restored).loadTask(task.id), engine.loadTask(task.id))
      assert.throws(() => restored.bindOwner("issuer", "stranger"), /another owner/)
    } finally { restored.close() }
    await assert.rejects(exec(process.execPath, ["scripts/backup.ts", source, destination]), /destination must be new/)
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("AWS templates retain private data and expose only HTTPS and ACME", () => {
  const infra = JSON.parse(readFileSync("deploy/aws-server.json", "utf8"))
  const auth = JSON.parse(readFileSync("deploy/aws-auth.json", "utf8"))
  assert.deepEqual(infra.Resources.SecurityGroup.Properties.SecurityGroupIngress.map((rule: any) => rule.FromPort), [80, 443])
  assert.equal(infra.Resources.Host.Properties.MetadataOptions.HttpTokens, "required")
  assert.equal(infra.Resources.Host.Properties.BlockDeviceMappings[0].Ebs.Encrypted, true)
  assert.equal(infra.Resources.Host.Properties.BlockDeviceMappings[0].Ebs.DeleteOnTermination, false)
  assert.equal(infra.Resources.Backups.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy, true)
  assert.equal(auth.Resources.Pool.Properties.AdminCreateUserConfig.AllowAdminCreateUserOnly, true)
  assert.equal(auth.Resources.Pool.Properties.MfaConfiguration, "ON")
  assert.equal(auth.Resources.ChatGPTClient.Properties.AccessTokenValidity, 5)
  assert.deepEqual(auth.Resources.WorkClient.Properties.CallbackURLs, ["http://localhost:8765/callback"])
  assert.deepEqual(auth.Resources.WorkClient.Properties.AllowedOAuthFlows, ["code"])
  assert.equal(auth.Resources.WorkClient.Properties.GenerateSecret, false)
  for (const template of [infra, auth]) {
    const names = new Set([...Object.keys(template.Resources), ...Object.keys(template.Parameters)])
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return
      if (typeof value.Ref === "string") assert.ok(names.has(value.Ref) || value.Ref.startsWith("AWS::"), `Unknown Ref ${value.Ref}`)
      Object.values(value).forEach(visit)
    }
    visit(template)
  }
})
