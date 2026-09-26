import { canonical, digest, sameRef, validateGraphBundle } from "../contracts/index.ts"
import type { GraphBundle, RevisionRef, TaskSpecRevision, PortResult } from "../contracts/index.ts"

export class GraphValidationError extends Error {
  readonly code = "invalid_graph"
  constructor(message: string) { super(message); this.name = "GraphValidationError" }
}
export function graphError(message: string): never { throw new GraphValidationError(message) }
export function findRevision<T extends RevisionRef>(values: T[], target: RevisionRef): T {
  return values.find(value => sameRef(value, target)) ?? graphError(`Unresolved exact revision ${target.id}@${target.revision}`)
}
export function activeTasks(bundle: GraphBundle): TaskSpecRevision[] {
  return bundle.graph.taskSpecRefs.map(reference => findRevision(bundle.tasks, reference))
}
export function getTask(bundle: GraphBundle, taskId: string): TaskSpecRevision {
  return activeTasks(bundle).find(task => task.id === taskId) ?? graphError(`Unknown execution leaf ${taskId}`)
}
function unique(values: string[], name: string): void {
  if (new Set(values).size !== values.length) graphError(`Duplicate ${name}`)
}
export function sorted<T>(values: T[]): T[] { return [...values].sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0) }

/** Revision counters are provenance; declared execution behavior is semantic. */
export function taskMeaningDigest(task: TaskSpecRevision) {
  const { revision: _revision, digest: _digest, ...meaning } = task
  return digest({ ...meaning, inputPorts: sorted(task.inputPorts), outputPorts: sorted(task.outputPorts), design: { ...task.design, acceptance: sorted(task.design.acceptance) } })
}
function assertAcyclic(ids: string[], edges: Array<[string, string]>, name: string) {
  const next = new Map(ids.map(id => [id, [] as string[]]))
  for (const [from, to] of edges) next.get(from)!.push(to)
  const done = new Set<string>(), visiting = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) graphError(`${name} contains a cycle at ${id}`)
    if (done.has(id)) return
    visiting.add(id)
    for (const target of next.get(id) ?? []) visit(target)
    visiting.delete(id); done.add(id)
  }
  ids.forEach(visit)
}

export function validateGraph(bundle: GraphBundle): void {
  validateGraphBundle(bundle)
  const tasks = activeTasks(bundle), groups = bundle.graph.groups, sources = bundle.graph.sources
  const taskById = new Map(tasks.map(task => [task.id, task]))
  const sourceById = new Map(sources.map(source => [source.id, source]))
  const groupById = new Map(groups.map(group => [group.id, group]))
  const ids = [...taskById.keys(), ...sourceById.keys(), ...groupById.keys()]
  unique(bundle.graph.taskSpecRefs.map(reference => reference.id), "task identity")
  unique([...tasks.map(task => task.id), ...sources.map(source => source.id), ...groups.map(group => group.id)], "node identity")
  unique(bundle.graph.edges.map(edge => canonical(edge)), "graph edge")
  unique(bundle.graph.completionTargets, "completion target")
  unique(bundle.sourceArtifacts.map(artifact => artifact.id), "source artifact identity")
  for (const target of bundle.graph.completionTargets) if (!taskById.has(target) && !groupById.has(target)) graphError(`Completion target ${target} is not a leaf or group`)
  for (const contract of bundle.contracts) {
    for (const validator of contract.validators) findRevision(bundle.validators, validator)
    for (const validator of contract.compatibilityValidators) {
      if (findRevision(bundle.validators, validator).definition.kind !== "argv") graphError(`unsupported compatibility_builtin for contract ${contract.id}: compatibility requires a semantic argv validator`)
    }
  }
  for (const task of tasks) {
    findRevision(bundle.templates, task.workspaceTemplateRef)
    findRevision(bundle.policies, task.executionPolicyRef)
    unique(task.inputPorts.map(port => port.name), `input port of ${task.id}`)
    unique(task.outputPorts.map(port => port.name), `output port of ${task.id}`)
    unique(task.design.steps.map(step => step.id), `step of ${task.id}`)
    const mountPaths = task.inputPorts.map(port => port.mountPath)
    for (let i = 0; i < mountPaths.length; i++) for (let j = i + 1; j < mountPaths.length; j++) {
      const a = mountPaths[i]!, b = mountPaths[j]!
      if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) graphError(`Overlapping input mounts for ${task.id}`)
    }
    for (const port of [...task.inputPorts, ...task.outputPorts]) findRevision(bundle.contracts, port.contractRef)
    for (const validator of task.design.acceptance) findRevision(bundle.validators, validator)
  }
  for (const source of sources) {
    unique(source.outputs.map(port => port.name), `source output of ${source.id}`)
    for (const port of source.outputs) {
      findRevision(bundle.contracts, port.contractRef)
      const artifact = bundle.sourceArtifacts.find(value => value.id === port.artifactRef.id && value.digest === port.artifactRef.digest)
      if (!artifact || artifact.origin.kind !== "source" || artifact.origin.sourceId !== source.id || artifact.outputPort !== port.name) graphError(`Missing or foreign source artifact for ${source.id}.${port.name}`)
      if (!sameRef(artifact.contractRef, port.contractRef)) graphError(`Source contract mismatch for ${source.id}.${port.name}`)
      if (artifact.origin.registrationDigest !== source.registrationEvidence.digest || artifact.origin.issuer !== source.registrationEvidence.issuer || artifact.origin.source !== source.registrationEvidence.source) graphError(`Source registration evidence mismatch for ${source.id}.${port.name}`)
    }
  }
  const executionEdges: Array<[string, string]> = [], membership: Array<[string, string]> = [], parents = new Map<string, string>()
  const bindings = new Set<string>()
  for (const edge of bundle.graph.edges) {
    if (edge.kind === "contains") {
      if (!groupById.has(edge.groupId) || !ids.includes(edge.childId)) graphError("contains must connect an existing group and child")
      if (parents.has(edge.childId)) graphError(`Multiple parents for ${edge.childId}`)
      parents.set(edge.childId, edge.groupId); membership.push([edge.groupId, edge.childId]); continue
    }
    if (edge.kind === "after") {
      if (!taskById.has(edge.predecessor) || !taskById.has(edge.successor)) graphError("after endpoints must be execution leaves")
      executionEdges.push([edge.predecessor, edge.successor]); continue
    }
    const producer = taskById.get(edge.from.nodeId)?.outputPorts ?? sourceById.get(edge.from.nodeId)?.outputs
    const from = producer?.find(port => port.name === edge.from.port)
    const to = taskById.get(edge.to.nodeId)?.inputPorts.find(port => port.name === edge.to.port)
    if (!from || !to) graphError("consumes must connect an existing leaf/source output to an existing leaf input")
    if (!sameRef(from.contractRef, to.contractRef)) graphError("consumes endpoints require the same exact contract")
    const key = canonical(edge.to)
    if (bindings.has(key)) graphError(`Multiple producers for ${edge.to.nodeId}.${edge.to.port}`)
    bindings.add(key); executionEdges.push([edge.from.nodeId, edge.to.nodeId])
  }
  for (const task of tasks) for (const input of task.inputPorts) if (!bindings.has(canonical({ nodeId: task.id, port: input.name }))) graphError(`Unbound required input ${task.id}.${input.name}`)
  assertAcyclic(ids, membership, "contains forest")
  assertAcyclic(ids, executionEdges, "execution graph")
  const descendant = (child: string, ancestor: string): boolean => {
    let current = parents.get(child)
    while (current) { if (current === ancestor) return true; current = parents.get(current) }
    return false
  }
  for (const group of groups) {
    unique(group.requiredTaskIds, `required tasks of ${group.id}`)
    unique(group.requiredIntegrationIds, `required integrations of ${group.id}`)
    for (const id of [...group.requiredTaskIds, ...group.requiredIntegrationIds]) {
      if ((!taskById.has(id) && !groupById.has(id)) || !descendant(id, group.id)) graphError(`Required result ${id} is not a descendant of ${group.id}`)
    }
    for (const id of group.requiredIntegrationIds) if (taskById.get(id)?.kind !== "integration") graphError(`Required integration ${id} is not an integration leaf`)
  }
}

export function taskComplete(bundle: GraphBundle, taskId: string, results: PortResult[]): boolean {
  const task = activeTasks(bundle).find(value => value.id === taskId)
  if (task) return task.outputPorts.every(port => results.some(result => result.producer.nodeId === taskId && result.producer.port === port.name && result.validity === "valid"))
  const group = bundle.graph.groups.find(value => value.id === taskId)
  if (!group) return false
  return [...group.requiredTaskIds, ...group.requiredIntegrationIds].every(id => taskComplete(bundle, id, results))
}
export function graphComplete(bundle: GraphBundle, results: PortResult[]): boolean {
  return bundle.graph.completionTargets.length > 0 && bundle.graph.completionTargets.every(id => taskComplete(bundle, id, results))
}
