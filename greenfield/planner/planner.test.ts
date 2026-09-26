import test from "node:test"
import assert from "node:assert/strict"
import { fixtureBundle } from "../contracts/fixtures.ts"
import { withDigest } from "../contracts/canonical.ts"
import { CommandProposalSource, DECOMPOSITION_REQUIREMENTS, GraphPlanner, JsonProposalSource, ProposalValidationError } from "./index.ts"
import type { ProposalInput, ProposalSource } from "./index.ts"

test("planner accepts only validated immutable graph proposals from an injected source", async () => {
  const fixture = fixtureBundle(), planner = new GraphPlanner(new JsonProposalSource(async input => { assert.equal(input.objective, "제안 생성"); return JSON.stringify(fixture) }))
  const result = await planner.propose({ objective: "제안 생성" })
  assert.deepEqual(result, fixture); assert.ok(Object.isFrozen(result.graph))
  const bad = structuredClone(fixture)
  bad.graph = withDigest({ ...bad.graph, completionTargets: ["missing"] })
  await assert.rejects(new GraphPlanner({ async propose() { return bad } }).propose({ objective: "bad graph" }), /Completion target/)
})

test("planner requires a proposal to extend the current graph revision", async () => {
  const current = fixtureBundle()
  await assert.rejects(new GraphPlanner({ async propose() { return current } }).propose({ objective: "update", current }), /exact current/)
  const next = { ...current, graph: withDigest({ ...current.graph, revision: 2, baseRevision: 1 }) }
  assert.equal((await new GraphPlanner({ async propose() { return next } }).propose({ objective: "update", current })).graph.revision, 2)
})

test("explicit command adapter exchanges JSON through stdin without shell interpolation", async () => {
  const source = new CommandProposalSource({ argv: [process.execPath, "-e", "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>console.log(JSON.stringify({seen:JSON.parse(s).objective})))"] })
  assert.deepEqual(await source.propose({ objective: "literal $(false) `false` 한글" }), { seen: "literal $(false) `false` 한글" })
  await assert.rejects(new CommandProposalSource({ argv: [process.execPath, "-e", "setInterval(()=>{},1000)"], timeoutMs: 30 }).propose({ objective: "timeout" }), /deadline/)
  await assert.rejects(new CommandProposalSource({ argv: [process.execPath, "-e", "process.stdout.write('x'.repeat(1000))"], maxBytes: 10 }).propose({ objective: "oversize" }), /limit/)
})

test("invalid proposals receive bounded repair feedback and valid corrected proposals pass", async () => {
  const valid = fixtureBundle(), invalid = structuredClone(valid), calls: ProposalInput[] = []
  invalid.graph = withDigest({ ...invalid.graph, completionTargets: ["missing"] })
  const planner = new GraphPlanner({ async propose(input) { calls.push(input); return input.feedback ? valid : invalid } })
  assert.deepEqual(await planner.propose({ objective: "결과 파일을 생성하고 검증해 주세요" }), valid)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0]!.requirements, DECOMPOSITION_REQUIREMENTS)
  assert.equal(calls[1]!.feedback?.attempt, 1)
  assert.match(calls[1]!.feedback!.issues.join(), /Completion target/)
  assert.deepEqual(calls[1]!.feedback!.previousProposal, invalid)
  let attempts = 0
  await assert.rejects(new GraphPlanner({ async propose() { attempts++; return invalid } }, { maxRepairs: 1 }).propose({ objective: "repair" }), error => error instanceof ProposalValidationError && error.attempts === 2)
  assert.equal(attempts, 2)
})

test("JSON syntax repair is distinct from unavailable provider failure", async () => {
  let attempts = 0
  const source = new JsonProposalSource(async input => { attempts++; return input.feedback ? JSON.stringify(fixtureBundle()) : "invalid JSON" })
  assert.equal((await new GraphPlanner(source).propose({ objective: "repair JSON" })).graph.id, "sample")
  assert.equal(attempts, 2)
  attempts = 0
  await assert.rejects(new GraphPlanner({ async propose() { attempts++; throw new Error("provider unavailable") } }).propose({ objective: "offline" }), /unavailable/)
  assert.equal(attempts, 1)
})

test("fixed objective fixtures evaluate provider protocol and structural decomposition without a hosted model claim", async () => {
  const objective = "하나의 독립 작업에서 결과 파일을 만들고 무결성을 확인해 주세요", valid = fixtureBundle()
  class FixtureObjectiveProvider implements ProposalSource {
    async propose(input: ProposalInput) {
      assert.equal(input.objective, objective)
      assert.deepEqual(input.requirements, DECOMPOSITION_REQUIREMENTS)
      return structuredClone(valid)
    }
  }
  const proposal = await new GraphPlanner(new FixtureObjectiveProvider()).propose({ objective })
  assert.equal(proposal.tasks.length, 1)
  assert.equal(proposal.tasks[0]!.outputPorts.length, 1)
  assert.equal(proposal.tasks[0]!.design.acceptance.length, 1)
  assert.deepEqual(proposal.graph.completionTargets, [proposal.tasks[0]!.id])
})
