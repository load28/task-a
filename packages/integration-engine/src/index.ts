import { createHash, randomUUID } from "node:crypto"
import type {
  ArtifactVersionRef,
  ContractVersionRef,
  IntegrationFailure,
  IntegrationFailureType,
  IntegrationPolicy,
  IntegrationRun,
  IntegrationScenario,
  IntegrationSet,
  ScenarioVersionRef,
  Task,
  VerifiedBundle,
} from "#task-domain"
import type { TaskGraphEngine } from "#task-engine"

export interface ScenarioProposal {
  name: string
  expectedBehavior: string[]
  participants?: string[]
  requirementIds?: string[]
  fixtureRefs?: ArtifactVersionRef[]
}

export interface IntegrationSetProposal {
  name: string
  parentTaskId?: string
  policy?: IntegrationPolicy
  members: string[]
  scenarios: ScenarioProposal[]
}

export interface IntegrationProposal {
  integrationSets: IntegrationSetProposal[]
}

export interface IntegrationProposalResult {
  sets: IntegrationSet[]
  warnings: string[]
}

export interface StartRunResult {
  run: IntegrationRun
  set: IntegrationSet
  scenarios: IntegrationScenario[]
  cached: boolean
}

export interface ScenarioReport {
  scenarioId: string
  status: "passed" | "failed"
  observed?: string
}

export interface RunReport {
  scenarios: ScenarioReport[]
  failure?: {
    type?: IntegrationFailureType
    affectedTaskIds?: string[]
    evidenceRefs?: ArtifactVersionRef[]
    recommendedActions?: string[]
  }
}

export interface ReportRunResult {
  run: IntegrationRun
  set: IntegrationSet
  bundle?: VerifiedBundle
  diagnosticTask?: Task
}

export function bundleArtifactName(setName: string): string {
  return `bundle:${setName}`
}

export class IntegrationEngine {
  private engine: TaskGraphEngine

  constructor(engine: TaskGraphEngine) {
    this.engine = engine
  }

  proposeIntegration(proposal: IntegrationProposal): IntegrationProposalResult {
    const store = this.engine.store
    return this.engine.atomic(() => {
      if (!Array.isArray(proposal.integrationSets) || proposal.integrationSets.length === 0) {
        throw new Error("Integration proposal requires at least one integration set")
      }
      const proposedNames = new Set(proposal.integrationSets.map((set) => set.name.trim()))
      if (proposedNames.size !== proposal.integrationSets.length) throw new Error("Integration set names must be unique")
      const now = new Date().toISOString()
      const created: IntegrationSet[] = []
      const memberEdges = new Map<string, string[]>()
      for (const setProposal of proposal.integrationSets) {
        requireText(setProposal.name, "integration set name")
        if (store.findIntegrationSetByName(setProposal.name.trim())) throw new Error(`Integration set already exists: ${setProposal.name}`)
        if (setProposal.parentTaskId) this.engine.requireTask(setProposal.parentTaskId)
        if (!Array.isArray(setProposal.members) || setProposal.members.length < 2) {
          throw new Error(`Integration set ${setProposal.name} requires at least two members`)
        }
        if (!Array.isArray(setProposal.scenarios) || setProposal.scenarios.length === 0) {
          throw new Error(`Missing integration boundary: set ${setProposal.name} has no scenario`)
        }
        const memberRefs: ArtifactVersionRef[] = []
        const memberNames = new Map<string, string>()
        const bundleDependencies: string[] = []
        for (const member of setProposal.members) {
          const resolved = this.resolveMember(member, proposedNames, now)
          if (memberNames.has(resolved.name)) throw new Error(`Duplicate member in set ${setProposal.name}: ${member}`)
          memberNames.set(resolved.name, resolved.artifactId)
          memberNames.set(member.trim(), resolved.artifactId)
          memberRefs.push({ artifactId: resolved.artifactId, version: resolved.version })
          if (resolved.bundleOfSet) bundleDependencies.push(resolved.bundleOfSet)
        }
        memberEdges.set(setProposal.name.trim(), bundleDependencies)
        const covered = new Set<string>()
        const set: IntegrationSet = {
          id: randomUUID(),
          name: setProposal.name.trim(),
          parentTaskId: setProposal.parentTaskId,
          memberRefs,
          scenarioIds: [],
          policy: setProposal.policy ?? "targeted",
          status: "pending",
          createdAt: now,
          updatedAt: now,
        }
        store.insertIntegrationSet(set)
        for (const scenarioProposal of setProposal.scenarios) {
          requireText(scenarioProposal.name, "scenario name")
          if (!Array.isArray(scenarioProposal.expectedBehavior) || scenarioProposal.expectedBehavior.length === 0) {
            throw new Error(`Scenario ${scenarioProposal.name} requires expected behavior`)
          }
          const participants = scenarioProposal.participants?.map((participant) => {
            const artifactId = memberNames.get(participant.trim())
            if (!artifactId) throw new Error(`Scenario ${scenarioProposal.name} references non-member participant: ${participant}`)
            return artifactId
          }) ?? memberRefs.map((member) => member.artifactId)
          for (const requirementId of scenarioProposal.requirementIds ?? []) {
            if (!store.findRequirement(requirementId)) throw new Error(`Unknown requirement: ${requirementId}`)
          }
          for (const fixture of scenarioProposal.fixtureRefs ?? []) this.engine.requireArtifactVersion(fixture)
          participants.forEach((artifactId) => covered.add(artifactId))
          store.insertScenario({
            id: randomUUID(),
            integrationSetId: set.id,
            name: scenarioProposal.name.trim(),
            participantRefs: participants.map((artifactId) => ({ artifactId, version: 0 })),
            requirementIds: scenarioProposal.requirementIds ?? [],
            fixtureRefs: scenarioProposal.fixtureRefs ?? [],
            expectedBehavior: scenarioProposal.expectedBehavior,
            version: 1,
            createdAt: now,
          })
        }
        const uncovered = memberRefs.filter((member) => !covered.has(member.artifactId))
        if (uncovered.length > 0) {
          const names = uncovered.map((member) => store.findArtifact(member.artifactId)?.name ?? member.artifactId)
          throw new Error(`Missing consumer: members not exercised by any scenario in ${setProposal.name}: ${names.join(", ")}`)
        }
        this.engine.emit("INTEGRATION_CREATED", setProposal.parentTaskId, { integrationSetId: set.id, name: set.name })
        created.push(set)
      }
      this.assertNoSetCycle(memberEdges)
      for (const set of created) {
        this.engine.refreshIntegrationSetReadiness(set.id)
        if (set.parentTaskId) this.engine.refreshAncestors(set.parentTaskId)
      }
      const warnings = this.orphanWarnings()
      return { sets: created.map((set) => store.findIntegrationSet(set.id)!), warnings }
    })
  }

  startRun(setRef: string): StartRunResult {
    const store = this.engine.store
    return this.engine.atomic(() => {
      const set = store.findIntegrationSet(setRef) ?? store.findIntegrationSetByName(setRef)
      if (!set) throw new Error(`Integration set not found: ${setRef}`)
      if (set.status === "running") throw new Error(`Integration set ${set.name} already has a running integration`)
      const resolved: ArtifactVersionRef[] = []
      for (const member of set.memberRefs) {
        const artifact = store.findArtifact(member.artifactId)
        const latest = this.engine.latestValidVersion(member.artifactId)
        if (!latest) throw new Error(`Unverified promoted artifact: ${artifact?.name ?? member.artifactId} has no valid version`)
        const producer = this.engine.requireTask(latest.producerTaskId)
        if (latest.type !== "bundle" && !["verified", "integrating", "integrated"].includes(producer.status)) {
          throw new Error(`Member ${artifact?.name ?? member.artifactId} is not verified (producer status: ${producer.status})`)
        }
        resolved.push({ artifactId: member.artifactId, version: latest.version })
      }
      const scenarios = store.scenariosOf(set.id)
      const contractRefs = this.contractRefsFor(resolved)
      const integrationKey = this.integrationKey(resolved, contractRefs, scenarios)
      const now = new Date().toISOString()
      const cached = store.passedRunByKey(integrationKey)
      if (cached) {
        if (set.status !== "passed") {
          store.updateIntegrationSet({ ...set, memberRefs: resolved, status: "passed", updatedAt: now })
        }
        return { run: cached, set: store.findIntegrationSet(set.id)!, scenarios, cached: true }
      }
      const run: IntegrationRun = {
        id: randomUUID(),
        integrationSetId: set.id,
        integrationKey,
        memberRefs: resolved,
        scenarioResults: [],
        status: "running",
        startedAt: now,
      }
      store.insertIntegrationRun(run)
      store.updateIntegrationSet({ ...set, memberRefs: resolved, status: "running", updatedAt: now })
      for (const member of resolved) {
        const producer = this.engine.requireTask(this.engine.requireArtifactVersion(member).producerTaskId)
        this.engine.markTaskIntegrating(producer.id)
      }
      this.engine.emit("INTEGRATION_STARTED", set.parentTaskId, { integrationSetId: set.id, runId: run.id, integrationKey })
      return { run, set: store.findIntegrationSet(set.id)!, scenarios, cached: false }
    })
  }

  reportRun(runId: string, report: RunReport): ReportRunResult {
    const store = this.engine.store
    return this.engine.atomic(() => {
      const run = store.findIntegrationRun(runId)
      if (!run) throw new Error(`Integration run not found: ${runId}`)
      if (run.status !== "running") throw new Error(`Integration run is already ${run.status}`)
      const set = store.findIntegrationSet(run.integrationSetId)!
      const scenarios = store.scenariosOf(set.id)
      const reported = new Map((report.scenarios ?? []).map((scenario) => [scenario.scenarioId, scenario]))
      const missing = scenarios.filter((scenario) => !reported.has(scenario.id))
      if (missing.length > 0) throw new Error(`Scenario results missing: ${missing.map((scenario) => scenario.name).join(", ")}`)
      if (reported.size !== scenarios.length) throw new Error("Report contains unknown scenario results")
      const now = new Date().toISOString()
      for (const scenario of scenarios) {
        const result = reported.get(scenario.id)!
        if (!["passed", "failed"].includes(result.status)) throw new Error(`Invalid scenario status: ${result.status}`)
        store.updateScenario({ ...scenario, result: { status: result.status, observed: result.observed, recordedAt: now } })
      }
      run.scenarioResults = scenarios.map((scenario) => ({
        scenarioId: scenario.id,
        scenarioVersion: scenario.version,
        status: reported.get(scenario.id)!.status,
        observed: reported.get(scenario.id)!.observed,
      }))
      const failed = run.scenarioResults.filter((result) => result.status === "failed")
      if (failed.length === 0) {
        return this.finishPassed(run, set, scenarios, now)
      }
      return this.finishFailed(run, set, scenarios, failed.map((result) => result.scenarioId), report.failure, now)
    })
  }

  private finishPassed(run: IntegrationRun, set: IntegrationSet, scenarios: IntegrationScenario[], now: string): ReportRunResult {
    const store = this.engine.store
    run.status = "passed"
    run.finishedAt = now
    store.updateIntegrationRun(run)
    const contractRefs = this.contractRefsFor(run.memberRefs)
    const bundleName = bundleArtifactName(set.name)
    let head = store.findArtifactByName(bundleName)
    if (!head) {
      head = { id: randomUUID(), name: bundleName, type: "bundle", latestVersion: 0, createdAt: now }
      store.insertArtifact(head)
    }
    const version = head.latestVersion + 1
    const producerTaskId = set.parentTaskId
      ?? this.engine.requireArtifactVersion(run.memberRefs[0]!).producerTaskId
    store.insertArtifactVersion({
      artifactId: head.id,
      version,
      type: "bundle",
      producerTaskId,
      inputs: run.memberRefs,
      contractVersionRefs: contractRefs,
      contentRef: `bundle:${set.name}@${version}`,
      status: "valid",
      createdAt: now,
    })
    store.updateArtifactLatest(head.id, version)
    const scenarioVersionRefs: ScenarioVersionRef[] = scenarios.map((scenario) => ({ scenarioId: scenario.id, version: scenario.version }))
    const architectureMember = run.memberRefs.find((member) => this.engine.requireArtifactVersion(member).type === "architecture")
    const bundle: VerifiedBundle = {
      artifactId: head.id,
      version,
      memberRefs: run.memberRefs,
      integrationSetId: set.id,
      integrationRunId: run.id,
      scenarioVersionRefs,
      contractVersionRefs: contractRefs,
      architectureVersionRef: architectureMember ? { id: architectureMember.artifactId, version: architectureMember.version } : undefined,
      status: "valid",
      createdAt: now,
    }
    store.insertBundle(bundle)
    store.updateIntegrationSet({ ...set, status: "passed", outputBundleRef: { artifactId: head.id, version }, updatedAt: now })
    this.engine.emit("INTEGRATION_PASSED", set.parentTaskId, { integrationSetId: set.id, runId: run.id })
    this.engine.emit("BUNDLE_PROMOTED", set.parentTaskId, { artifactId: head.id, version, integrationSetId: set.id })
    for (const member of run.memberRefs) {
      const producer = this.engine.requireTask(this.engine.requireArtifactVersion(member).producerTaskId)
      this.engine.markTaskIntegrated(producer.id)
    }
    for (const scenario of scenarios) {
      for (const requirementId of scenario.requirementIds) {
        this.engine.satisfyRequirement(requirementId, { integrationRunId: run.id, scenarioId: scenario.id })
      }
    }
    if (set.parentTaskId) this.engine.refreshAncestors(set.parentTaskId)
    return { run, set: store.findIntegrationSet(set.id)!, bundle }
  }

  private finishFailed(
    run: IntegrationRun,
    set: IntegrationSet,
    scenarios: IntegrationScenario[],
    failedScenarioIds: string[],
    reportedFailure: RunReport["failure"],
    now: string,
  ): ReportRunResult {
    const store = this.engine.store
    const failedScenarios = scenarios.filter((scenario) => failedScenarioIds.includes(scenario.id))
    const defaultAffected = [...new Set(failedScenarios.flatMap((scenario) =>
      scenario.participantRefs.map((participant) => {
        const latest = run.memberRefs.find((member) => member.artifactId === participant.artifactId)
        return latest ? this.engine.requireArtifactVersion(latest).producerTaskId : undefined
      }).filter((taskId): taskId is string => Boolean(taskId)),
    ))]
    const failure: IntegrationFailure = {
      type: reportedFailure?.type ?? "unknown",
      affectedTaskIds: reportedFailure?.affectedTaskIds ?? defaultAffected,
      evidenceRefs: reportedFailure?.evidenceRefs ?? [],
      recommendedActions: reportedFailure?.recommendedActions ?? [],
    }
    for (const taskId of failure.affectedTaskIds) this.engine.requireTask(taskId)
    for (const evidence of failure.evidenceRefs) this.engine.requireArtifactVersion(evidence)
    run.status = "failed"
    run.failure = failure
    run.finishedAt = now
    store.updateIntegrationRun(run)
    store.updateIntegrationSet({ ...set, status: "failed", updatedAt: now })
    for (const member of run.memberRefs) {
      const producer = this.engine.requireTask(this.engine.requireArtifactVersion(member).producerTaskId)
      this.engine.revertTaskToVerified(producer.id, `Integration failed: ${set.name}`)
    }
    this.engine.emit("INTEGRATION_FAILED", set.parentTaskId, { integrationSetId: set.id, runId: run.id }, { failureType: failure.type, affectedTaskIds: failure.affectedTaskIds })
    const observations = run.scenarioResults
      .filter((result) => result.status === "failed" && result.observed)
      .map((result) => result.observed)
      .join("; ")
    this.engine.recordLearning({
      sourceTaskId: set.parentTaskId,
      sourceRunId: run.id,
      kind: "failure_pattern",
      description: `Integration ${set.name} failed (${failure.type}) on scenarios: ${failedScenarios.map((scenario) => scenario.name).join(", ")}${observations ? ` — ${observations}` : ""}`,
      tags: [set.name, failure.type, ...failedScenarios.map((scenario) => scenario.name)],
    })
    let diagnosticTask: Task | undefined
    if (failure.type === "unknown") {
      diagnosticTask = this.engine.createTask({
        title: `Diagnose integration failure: ${set.name}`,
        goal: [
          `Integration run ${run.id} of set ${set.name} failed with an unknown cause.`,
          `Failed scenarios: ${failedScenarios.map((scenario) => scenario.name).join(", ")}.`,
          "Reproduce the failure, isolate the interaction, determine the root cause, and report which tasks must be reopened.",
        ].join(" "),
        category: "diagnostic",
        parentId: set.parentTaskId,
      })
      this.engine.emit("DIAGNOSTIC_CREATED", diagnosticTask.id, { integrationSetId: set.id, runId: run.id })
    } else {
      for (const taskId of failure.affectedTaskIds) {
        this.engine.markTaskStale(taskId, `Integration failure (${failure.type}) in ${set.name}`)
      }
    }
    if (set.parentTaskId) this.engine.refreshAncestors(set.parentTaskId)
    return { run, set: store.findIntegrationSet(set.id)!, diagnosticTask }
  }

  private resolveMember(member: string, proposedNames: Set<string>, now: string): { artifactId: string; version: number; name: string; bundleOfSet?: string } {
    const store = this.engine.store
    const trimmed = member.trim()
    requireText(trimmed, "integration member")
    const direct = store.findArtifact(trimmed) ?? store.findArtifactByName(trimmed)
    if (direct && direct.type !== "bundle") {
      const latest = this.engine.latestValidVersion(direct.id)
      return { artifactId: direct.id, version: latest?.version ?? 0, name: direct.name }
    }
    const setName = trimmed.startsWith("bundle:") ? trimmed.slice("bundle:".length) : trimmed
    const producingSet = store.findIntegrationSetByName(setName)
    if (direct?.type === "bundle" || producingSet || proposedNames.has(setName)) {
      if (!producingSet && !proposedNames.has(setName) && !direct) throw new Error(`Invalid member reference: ${member}`)
      const bundleName = direct?.type === "bundle" ? direct.name : bundleArtifactName(setName)
      let head = store.findArtifactByName(bundleName)
      if (!head) {
        head = { id: randomUUID(), name: bundleName, type: "bundle", latestVersion: 0, createdAt: now }
        store.insertArtifact(head)
      }
      return { artifactId: head.id, version: head.latestVersion, name: head.name, bundleOfSet: bundleName.slice("bundle:".length) }
    }
    throw new Error(`Invalid member reference: ${member} (unknown artifact or integration set)`)
  }

  private contractRefsFor(members: ArtifactVersionRef[]): ContractVersionRef[] {
    const seen = new Map<string, ContractVersionRef>()
    for (const member of members) {
      for (const ref of this.engine.requireArtifactVersion(member).contractVersionRefs) {
        seen.set(`${ref.contractId}@${ref.version}`, ref)
      }
    }
    return [...seen.values()].sort((a, b) => a.contractId.localeCompare(b.contractId) || a.version - b.version)
  }

  private integrationKey(members: ArtifactVersionRef[], contracts: ContractVersionRef[], scenarios: IntegrationScenario[]): string {
    const payload = JSON.stringify({
      members: [...members].sort((a, b) => a.artifactId.localeCompare(b.artifactId)).map((member) => `${member.artifactId}@${member.version}`),
      contracts: contracts.map((contract) => `${contract.contractId}@${contract.version}`),
      scenarios: [...scenarios].sort((a, b) => a.id.localeCompare(b.id)).map((scenario) => `${scenario.id}@${scenario.version}`),
    })
    return createHash("sha256").update(payload).digest("hex")
  }

  private assertNoSetCycle(proposedEdges: Map<string, string[]>): void {
    const store = this.engine.store
    const edges = new Map<string, string[]>(proposedEdges)
    for (const set of store.integrationSets()) {
      if (edges.has(set.name)) continue
      const dependencies = set.memberRefs
        .map((member) => store.findArtifact(member.artifactId))
        .filter((artifact) => artifact?.type === "bundle" && artifact.name.startsWith("bundle:"))
        .map((artifact) => artifact!.name.slice("bundle:".length))
      edges.set(set.name, dependencies)
    }
    const state = new Map<string, "visiting" | "done">()
    const visit = (node: string): void => {
      const seen = state.get(node)
      if (seen === "done") return
      if (seen === "visiting") throw new Error("Integration sets must not form a cycle")
      state.set(node, "visiting")
      for (const next of edges.get(node) ?? []) visit(next)
      state.set(node, "done")
    }
    for (const node of edges.keys()) visit(node)
  }

  private orphanWarnings(): string[] {
    const store = this.engine.store
    const memberIds = new Set<string>()
    for (const set of store.integrationSets()) {
      for (const member of set.memberRefs) memberIds.add(member.artifactId)
    }
    const warnings: string[] = []
    for (const set of store.integrationSets()) {
      for (const member of set.memberRefs) {
        const artifact = store.findArtifact(member.artifactId)
        if (!artifact) continue
        for (const input of this.engine.latestValidVersion(artifact.id)?.inputs ?? []) {
          const inputArtifact = store.findArtifact(input.artifactId)
          if (inputArtifact && inputArtifact.type !== "bundle" && !memberIds.has(input.artifactId)) {
            warnings.push(`Orphan artifact: ${inputArtifact.name} feeds ${artifact.name} but belongs to no integration set`)
          }
        }
      }
    }
    return [...new Set(warnings)]
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must not be empty`)
}
