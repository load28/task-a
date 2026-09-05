import type { ArtifactVersionRef, Criterion, Learning, TaskSummary } from "#task-domain"
import type { TaskGraphEngine } from "#task-engine"

export interface ContextArtifact {
  name: string
  artifactId: string
  version: number
  type: string
  contentRef: string
  content?: string
  bundle: boolean
}

export interface ContextContract {
  contractId: string
  version: number
  role: "provider" | "consumer"
  counterpartTaskTitle: string
  provides: string[]
  expects: string[]
  invariants: string[]
}

export interface TaskContext {
  task: { id: string; title: string; goal: string; category: string; status: string }
  path: string[]
  rootGoal?: string
  parentGoal?: string
  inheritedRequirements: string[]
  inheritedConstraints: string[]
  architectureDecisions: ContextArtifact[]
  inputArtifacts: ContextArtifact[]
  verifiedBundles: ContextArtifact[]
  contracts: ContextContract[]
  knownFailures: string[]
  learnings: Learning[]
  acceptanceCriteria: Criterion[]
  dependencies: Array<{ id: string; title: string; status: string }>
  childSummary?: TaskSummary
  recentHistory?: string[]
}

export function buildTaskContext(engine: TaskGraphEngine, taskId: string): TaskContext {
  return engine.atomic(() => {
    const store = engine.store
    const task = engine.requireTask(taskId)
    const policy = task.contextPolicy
    const ancestors = engine.ancestorsOf(taskId)
    const root = ancestors[0] ?? task
    const parent = ancestors[ancestors.length - 1]
    const ancestorIds = ancestors.map((ancestor) => ancestor.id)

    const requirements = policy.inheritRequirements || policy.inheritConstraints
      ? store.requirementsOf([...ancestorIds, taskId])
      : store.requirementsOf([taskId])
    const inheritedRequirements = requirements
      .filter((requirement) => requirement.kind === "requirement" && (policy.inheritRequirements || requirement.taskId === taskId))
      .map((requirement) => requirement.description)
    const inheritedConstraints = requirements
      .filter((requirement) => requirement.kind === "constraint" && (policy.inheritConstraints || requirement.taskId === taskId))
      .map((requirement) => requirement.description)

    const dependencies = task.dependencies.map((id) => engine.requireTask(id))
    const inputArtifacts: ContextArtifact[] = []
    const verifiedBundles: ContextArtifact[] = []
    const seenInputs = new Set<string>()
    const pushArtifact = (list: ContextArtifact[], ref: ArtifactVersionRef): void => {
      const key = `${ref.artifactId}@${ref.version}`
      if (seenInputs.has(key)) return
      seenInputs.add(key)
      const version = engine.requireArtifactVersion(ref)
      const head = store.findArtifact(ref.artifactId)!
      list.push({
        name: head.name,
        artifactId: ref.artifactId,
        version: ref.version,
        type: version.type,
        contentRef: version.contentRef,
        content: version.content,
        bundle: version.type === "bundle",
      })
    }
    if (policy.inheritArtifacts !== "none") {
      const candidateRefs: ArtifactVersionRef[] = [...task.inputArtifactRefs]
      for (const dependency of dependencies) {
        for (const output of dependency.outputArtifactRefs) {
          const latest = engine.latestValidVersion(output.artifactId)
          if (latest) candidateRefs.push({ artifactId: latest.artifactId, version: latest.version })
        }
      }
      for (const ref of candidateRefs) {
        const bundled = preferBundle(engine, ref)
        if (bundled) pushArtifact(verifiedBundles, bundled)
        else pushArtifact(inputArtifacts, ref)
      }
      if (policy.inheritArtifacts === "relevant") {
        for (const ref of [...verifiedBundles, ...inputArtifacts].map((artifact) => ({ artifactId: artifact.artifactId, version: artifact.version }))) {
          for (const input of engine.requireArtifactVersion(ref).inputs) {
            const latest = engine.latestValidVersion(input.artifactId)
            if (latest) pushArtifact(inputArtifacts, { artifactId: latest.artifactId, version: latest.version })
          }
        }
      }
    }

    const architectureDecisions: ContextArtifact[] = []
    if (policy.inheritDecisions !== "none") {
      const seen = new Set<string>()
      const scopeIds = policy.inheritDecisions === "all" ? [...engine.subtreeIds(root.id)] : [...ancestorIds, ...task.dependencies]
      for (const scopeId of scopeIds) {
        const scopeTask = store.findTask(scopeId)
        if (!scopeTask) continue
        for (const ref of scopeTask.outputArtifactRefs) {
          const latest = engine.latestValidVersion(ref.artifactId)
          if (!latest || !["decision", "architecture"].includes(latest.type)) continue
          const key = `${latest.artifactId}@${latest.version}`
          if (seen.has(key)) continue
          seen.add(key)
          const head = store.findArtifact(latest.artifactId)!
          architectureDecisions.push({
            name: head.name,
            artifactId: latest.artifactId,
            version: latest.version,
            type: latest.type,
            contentRef: latest.contentRef,
            content: latest.content,
            bundle: false,
          })
        }
      }
    }

    const contracts: ContextContract[] = store.contractsFor(taskId).map((contract) => ({
      contractId: contract.id,
      version: contract.version,
      role: contract.providerTaskId === taskId ? "provider" : "consumer",
      counterpartTaskTitle: engine.requireTask(contract.providerTaskId === taskId ? contract.consumerTaskId : contract.providerTaskId).title,
      provides: contract.provides.map((item) => item.description ? `${item.name}: ${item.description}` : item.name),
      expects: contract.expects.map((item) => item.description ? `${item.name}: ${item.description}` : item.name),
      invariants: contract.invariants,
    }))

    const knownFailures = new Set<string>()
    for (const run of store.failedRunsTouching(taskId)) {
      knownFailures.add(`Integration run ${run.id} failed (${run.failure?.type ?? "unknown"})`)
    }
    for (const scopeId of [taskId, ...task.dependencies, ...(parent ? [parent.id] : [])]) {
      for (const set of store.integrationSetsByParent(scopeId)) {
        for (const run of store.runsOf(set.id)) {
          if (run.status !== "failed") continue
          const failedScenarios = run.scenarioResults.filter((result) => result.status === "failed")
          const details = failedScenarios
            .map((result) => {
              const scenario = store.findScenario(result.scenarioId)
              return `${scenario?.name ?? result.scenarioId}${result.observed ? `: ${result.observed}` : ""}`
            })
            .join("; ")
          knownFailures.add(`Integration ${set.name} failed (${run.failure?.type ?? "unknown"})${details ? ` — ${details}` : ""}`)
        }
      }
    }

    const learnings = engine.relevantLearnings(taskId)
    for (const learning of learnings) store.incrementLearningApplied(learning.id)

    const context: TaskContext = {
      task: { id: task.id, title: task.title, goal: task.goal, category: task.category, status: task.status },
      path: engine.pathOf(taskId),
      rootGoal: policy.inheritGoal && root.id !== task.id ? root.goal : undefined,
      parentGoal: policy.inheritGoal && parent ? parent.goal : undefined,
      inheritedRequirements,
      inheritedConstraints,
      architectureDecisions,
      inputArtifacts,
      verifiedBundles,
      contracts,
      knownFailures: [...knownFailures],
      learnings,
      acceptanceCriteria: task.acceptanceCriteria,
      dependencies: dependencies.map((dependency) => ({ id: dependency.id, title: dependency.title, status: dependency.status })),
      childSummary: task.childIds.length > 0 ? engine.summarize(taskId) : undefined,
      recentHistory: policy.inheritHistory
        ? store.eventsFor(taskId, 10).map((event) => `${event.createdAt} ${event.type}${event.payload?.reason ? ` (${event.payload.reason})` : ""}`)
        : undefined,
    }
    return context
  })
}

function preferBundle(engine: TaskGraphEngine, ref: ArtifactVersionRef): ArtifactVersionRef | undefined {
  const store = engine.store
  const version = engine.requireArtifactVersion(ref)
  if (version.type === "bundle") return ref
  for (const set of store.integrationSetsByMember(ref.artifactId)) {
    if (set.status !== "passed" || !set.outputBundleRef) continue
    const bundle = store.findBundle(set.outputBundleRef.artifactId, set.outputBundleRef.version)
    if (bundle?.status === "valid" && bundle.memberRefs.some((member) => member.artifactId === ref.artifactId && member.version === ref.version)) {
      return set.outputBundleRef
    }
  }
  return undefined
}

export function formatTaskContext(context: TaskContext): string {
  const artifactLine = (artifact: ContextArtifact): string =>
    `${artifact.name}@${artifact.version} (${artifact.type}) — ${artifact.contentRef}`
  const sections: Array<[string, string | string[] | undefined]> = [
    ["Task", `${context.task.title} (${context.task.category}, ${context.task.status}, ${context.task.id})`],
    ["Path", context.path.join(" > ")],
    ["Root Goal", context.rootGoal],
    ["Parent Goal", context.parentGoal],
    ["Current Task Goal", context.task.goal],
    ["Inherited Requirements", context.inheritedRequirements],
    ["Inherited Constraints", context.inheritedConstraints],
    ["Architecture Decisions", context.architectureDecisions.map(artifactLine)],
    ["Verified Bundles", context.verifiedBundles.map(artifactLine)],
    ["Input Artifacts", context.inputArtifacts.map(artifactLine)],
    ["Contracts", context.contracts.map((contract) =>
      `${contract.role} of ${contract.contractId}@${contract.version} with ${contract.counterpartTaskTitle}; provides: ${contract.provides.join(", ") || "-"}; expects: ${contract.expects.join(", ") || "-"}${contract.invariants.length ? `; invariants: ${contract.invariants.join(", ")}` : ""}`)],
    ["Known Failures", context.knownFailures],
    ["Learnings", context.learnings.map((learning) => `[${learning.kind}] ${learning.description}`)],
    ["Dependencies", context.dependencies.map((dependency) => `${dependency.title} (${dependency.status})`)],
    ["Acceptance Criteria", context.acceptanceCriteria.map((criterion) => `${criterion.id}: ${criterion.description}`)],
    ["Completed Work", context.childSummary?.completedWork],
    ["Open Questions", context.childSummary?.openQuestions],
    ["Recent History", context.recentHistory],
  ]
  return sections
    .filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))
    .map(([title, value]) => `${title}\n${Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : value}`)
    .join("\n\n")
}
