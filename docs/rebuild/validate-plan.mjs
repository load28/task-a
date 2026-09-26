import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// Documentation tooling only. This does not execute tasks or change product state.
const directory = dirname(fileURLToPath(import.meta.url))
const read = name => readFileSync(resolve(directory, name), "utf8")
const plan = JSON.parse(read("graph.json"))
const flags = new Set(process.argv.slice(2))
for (const flag of flags) assert(["--write", "--self-test"].includes(flag), `Unknown flag: ${flag}`)

function unique(values, context) {
  assert.equal(new Set(values).size, values.length, `Duplicate ${context}`)
}

function validate(value) {
  assert.equal(value.schemaVersion, 1)
  assert.equal(value.kind, "ImplementationPlanDraft")
  assert.equal(value.status, "review")
  assert.equal(value.runtimeExecutable, false)
  assert.deepEqual(value.requirements, ["R1", "R2", "R3", "R4"])
  const contracts = [...read("contracts.md").matchAll(/^### (C\d{2}) /gm)].map(x => x[1])
  const scenarios = [...read("architecture.md").matchAll(/^- \*\*(A\d{2}) /gm)].map(x => x[1])
  assert.deepEqual(value.contractIds, contracts, "Contract index does not match document")
  assert.deepEqual(value.acceptanceScenarioIds, scenarios, "Acceptance index does not match document")
  unique(value.groups.map(x => x.id), "group")
  const groups = new Set(value.groups.map(x => x.id))
  const allNodes = [...value.sources, ...value.tasks]
  unique(allNodes.map(x => x.id), "node")
  const nodes = new Map(allNodes.map(x => [x.id, x]))
  const tasks = new Map(value.tasks.map(x => [x.id, x]))
  for (const source of value.sources) {
    assert(/^S-[A-Z]+$/.test(source.id), `Invalid source ID: ${source.id}`)
    assert(/^[a-z-]+\.md$/i.test(source.document), "Source must be a local review document")
    assert(read(source.document).trim(), `Empty source: ${source.id}`)
    assert(source.output && source.revision, `Missing source reference: ${source.id}`)
  }
  const owners = []
  const dependencies = new Map()
  const contractCoverage = new Set()
  const scenarioCoverage = new Set()
  for (const task of value.tasks) {
    assert(/^T\d{2}$/.test(task.id), `Invalid task ID: ${task.id}`)
    assert(groups.has(task.group), `Missing group: ${task.id}`)
    for (const field of ["title", "objective", "reworkRule"]) assert(task[field]?.trim(), `Missing ${field}: ${task.id}`)
    assert(task.inputs.length > 0 && task.outputs.length > 0, `Missing ports: ${task.id}`)
    unique(task.inputs.map(x => x.port), `input port in ${task.id}`)
    unique(task.outputs.map(x => x.id), `output port in ${task.id}`)
    assert(task.outputs.every(x => x.id && x.description?.trim()), `Incomplete output: ${task.id}`)
    assert(task.definitionOfDone.length >= 2 && task.definitionOfDone.every(x => x.trim()), `Missing completion evidence: ${task.id}`)
    assert(task.contractRefs.length && task.acceptanceScenarioIds.length, `Missing acceptance binding: ${task.id}`)
    unique(task.contractRefs, `contract reference in ${task.id}`)
    unique(task.acceptanceScenarioIds, `scenario reference in ${task.id}`)
    for (const id of task.contractRefs) {
      assert(contracts.includes(id), `Unknown contract ${id}: ${task.id}`)
      contractCoverage.add(id)
    }
    for (const id of task.acceptanceScenarioIds) {
      assert(scenarios.includes(id), `Unknown acceptance ${id}: ${task.id}`)
      scenarioCoverage.add(id)
    }
    const deps = new Set()
    for (const input of task.inputs) {
      const source = nodes.get(input.source)
      assert(source && source.id !== task.id, `Invalid input source: ${task.id}`)
      const outputs = source.outputs?.map(x => x.id) ?? [source.output]
      assert(outputs.includes(input.output), `Missing output ${input.output}: ${task.id}`)
      if (tasks.has(source.id)) deps.add(source.id)
    }
    unique(task.after, `after edge in ${task.id}`)
    for (const predecessor of task.after) {
      assert(tasks.has(predecessor) && predecessor !== task.id, `Invalid after edge: ${task.id}`)
      deps.add(predecessor)
    }
    dependencies.set(task.id, deps)
    assert(task.owns.length > 0, `Missing ownership: ${task.id}`)
    for (const scope of task.owns) {
      assert(/^greenfield\/[a-z0-9-]+\/$/.test(scope), `Invalid ownership scope: ${scope}`)
      for (const prior of owners) assert(!(scope.startsWith(prior.scope) || prior.scope.startsWith(scope)), `Overlapping ownership: ${prior.id}, ${task.id}`)
      owners.push({ id: task.id, scope })
    }
  }
  assert.equal(contractCoverage.size, contracts.length, "Uncovered contract")
  assert.equal(scenarioCoverage.size, scenarios.length, "Uncovered acceptance scenario")
  const remaining = new Set(tasks.keys()), waves = [], completed = new Set()
  while (remaining.size) {
    const wave = [...remaining].filter(id => [...dependencies.get(id)].every(x => completed.has(x))).sort()
    assert(wave.length, `Cycle: ${[...remaining].join(", ")}`)
    waves.push(wave)
    for (const id of wave) { remaining.delete(id); completed.add(id) }
  }
  assert(value.completionTargets.length > 0, "Missing completion targets")
  unique(value.completionTargets, "completion target")
  const reachable = new Set()
  const visit = id => {
    assert(tasks.has(id), `Missing completion target: ${id}`)
    if (reachable.has(id)) return
    reachable.add(id)
    for (const dep of dependencies.get(id)) visit(dep)
  }
  value.completionTargets.forEach(visit)
  assert.equal(reachable.size, tasks.size, "Task does not contribute to completion target")
  return { dependencies, waves }
}

function render(value, analysis) {
  const lines = [
    "# 신규 구현 태스크 그래프", "", "상태: 검토 초안 · 제품 구현 전", "",
    "이 문서는 [graph.json](graph.json)에서 생성한다. 입력 포트가 가리키는 산출물에서 의존성을 도출하며, 별도의 의존성 목록을 수작업으로 유지하지 않는다. 제품 실행용 GraphRevision payload가 아닌 구현 작업의 검토용 DAG다.", "",
    "## 1. 계약을 먼저 고정하고 독립 경로를 병렬 구현한다", "",
    "T01은 계약을 기계적으로 검증 가능한 schema로 만들고, T02는 그 계약을 충족하는 실행·저장 기반을 선택한다. 두 작업 이후 그래프와 실행 계층을 독립 구현한다. 모든 작업의 현재 상태는 미착수다.", "",
    "```mermaid", "flowchart TB",
  ]
  for (const group of value.groups) {
    lines.push(`  subgraph group_${group.id}["${group.title}"]`)
    for (const task of value.tasks.filter(x => x.group === group.id)) lines.push(`    ${task.id}["${task.id} ${task.title}"]`)
    lines.push("  end")
  }
  for (const task of value.tasks) for (const dependency of analysis.dependencies.get(task.id)) lines.push(`  ${dependency} --> ${task.id}`)
  lines.push("```", "", "화살표는 선행 작업의 산출물을 소비한다는 뜻이다. 작업 의존성이 코드의 import 의존성을 강제하지는 않는다. 예를 들어 kernel은 adapter의 계약·검증 fixture를 참고하더라도 adapter 구현을 import하지 않는다. 계약·설계·AX 참고 문서 source 연결은 가독성을 위해 그림에서 생략했으며 JSON과 아래 입력 목록에는 모두 포함한다.", "",
    "## 2. 각 작업은 입력·산출물·소유 범위·완료 증거를 가진다", "",
    "`greenfield/`는 제안된 새 산출물 영역이다. 현재 저장소의 구현 파일을 가리키지 않으며, 이번 문서 작업에서 생성하거나 연결하지 않는다. 기반 기술 선정 후 경로를 확정하더라도 소유권 중복을 다시 검사한다.", "")
  for (const group of value.groups) {
    lines.push(`### ${group.title}`, "")
    for (const task of value.tasks.filter(x => x.group === group.id)) {
      lines.push(`**${task.id} — ${task.title}**`, "", task.objective, "",
        `- 입력: ${task.inputs.map(x => `\`${x.source}/${x.output}\``).join(", ")}`,
        `- 산출물: \`${task.id}/${task.outputs[0].id}\` · 소유 범위: \`${task.owns.join(", ")}\``,
        `- 계약: ${task.contractRefs.join(", ")} · 수용 시나리오: ${task.acceptanceScenarioIds.join(", ")}`,
        `- 완료 증거: ${task.definitionOfDone.join(" ")}`, "")
    }
  }
  lines.push("## 3. 작업 변경은 소비 관계를 따라 재판정한다", "",
    "이 구현 DAG에도 C05–C06을 적용한다. 특정 작업의 산출물이 변경되면 그것을 소비하는 직접 작업부터 영향 후보로 표시한다. 후보가 된 모든 작업을 곧바로 다시 구현하지 않는다. 동일한 계약·내용·검증 증거면 재사용하고, 변경 의미를 검증할 수 있으면 재검증하며, 나머지는 해당 작업만 다시 수행한다.", "",
    "- T01의 계약 schema가 바뀌면 이를 직접 소비하는 경로부터 재판정한다. 계약 변경을 구현 계층에만 숨기지 않는다.",
    "- T07의 영향 분석 산출물이 바뀌면 T08·T15·T17과 그 후속 결과가 후보가 된다. T09의 backend 실행 구현은 직접 소비 관계가 없으므로 유지한다.",
    "- T11의 재개 프로토콜이 바뀌면 T12와 그 후속 결과가 후보가 된다. 독립된 T03의 graph 검증기는 유지한다.",
    "- T02에서 기반 기술을 다시 선택하면 backend·상태·snapshot 구현의 가정을 재검토한다. 외부 포트 계약까지 바꾸는 결정은 계약 revision으로 되돌려 검토한다.", "",
    "T01이 만들어내는 실행 계약 schema 자체가 C01–C12의 의미와 충돌하면 문서 계약을 우선한다. 계약 revision 변경은 먼저 검토하고, 그 이후 새 schema와 후속 설계를 만든다.", "",
    "## 4. 완료는 실제 수용 증거로 판단한다", "",
    `최종 completion target은 ${value.completionTargets.map(x => `\`${x}\``).join(", ")}이다. 모든 선행 작업이 이 target에 연결되어야 하며, 실제 backend의 격리·중단·복구 증거 없이 완료로 표시하지 않는다. 단위 테스트와 mock 통과는 실제 환경 검증을 대신하지 않는다.`, "",
    "계약별 검증은 각 작업에 분산하고 T18에서 장애 경계를, T19에서 R1–R4의 전체 흐름을 검증한다. T16의 자연어 계획 품질은 고정 fixture 평가를 별도로 기록하며 결정적 schema 통과와 구분한다.", "",
    "```sh", "node docs/rebuild/validate-plan.mjs", "node docs/rebuild/validate-plan.mjs --self-test", "```", "",
    "JSON을 수정한 뒤 문서를 갱신할 때만 `node docs/rebuild/validate-plan.mjs --write`를 실행한다. 검증기는 순환·참조·포트·완료 경로·계약/시나리오 연결·소유권 중복과 생성 문서의 일치를 확인한다. 문서 의미나 제품 동작이 검증됐다는 뜻은 아니다.", "")
  return lines.join("\n")
}

const analysis = validate(plan)
if (flags.has("--self-test")) {
  const cases = [
    value => value.tasks[0].inputs.push({ port: "cycle", source: "T19", output: "acceptance-report" }),
    value => { value.tasks[0].inputs[0].output = "missing-output" },
    value => { value.tasks[1].owns = value.tasks[0].owns },
    value => { value.tasks[0].contractRefs = ["C99"] },
    value => { value.completionTargets = ["T01"] },
    value => { value.tasks[0].after = ["missing-task"] },
  ]
  for (const mutate of cases) {
    const invalid = structuredClone(plan)
    mutate(invalid)
    assert.throws(() => validate(invalid))
  }
  console.log(`Negative fixtures: ${cases.length}/${cases.length} rejected`)
}
const markdown = render(plan, analysis)
if (flags.has("--write")) writeFileSync(resolve(directory, "implementation-plan.md"), markdown)
else assert.equal(read("implementation-plan.md"), markdown, "Generated document drift; run --write")
console.log(JSON.stringify({ tasks: plan.tasks.length, sources: plan.sources.length, contracts: plan.contractIds.length,
  acceptanceScenarios: plan.acceptanceScenarioIds.length, dependencyEdges: [...analysis.dependencies.values()].reduce((n, x) => n + x.size, 0),
  parallelWaves: analysis.waves, status: "valid-review-plan" }, null, 2))
