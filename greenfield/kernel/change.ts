import { canonical, sameRef } from "../contracts/index.ts"
import type { GraphBundle, PortAddress } from "../contracts/index.ts"
import { activeTasks, graphError, sorted, taskMeaningDigest, validateGraph } from "./graph.ts"

export interface ChangeImpact { affectedTaskIds: string[]; removedTaskIds: string[]; reasons: Record<string, string[]> }
const key = (address: PortAddress) => canonical(address)

export function analyzeChange(before: GraphBundle | undefined, after: GraphBundle): ChangeImpact {
  validateGraph(after)
  if (before) validateGraph(before)
  if (before && before.graph.id !== after.graph.id) graphError("Cannot compare revisions from different graphs")
  const oldTasks = new Map((before ? activeTasks(before) : []).map(task => [task.id, task]))
  const newTasks = new Map(activeTasks(after).map(task => [task.id, task]))
  const removedTaskIds = [...oldTasks.keys()].filter(id => !newTasks.has(id)).sort()
  const reasons: Record<string, string[]> = {}, queue: Array<{ address: PortAddress; cause: string }> = [], seen = new Set<string>()
  const affected = new Set<string>()
  const note = (id: string, reason: string) => { (reasons[id] ??= []).push(reason); if (newTasks.has(id)) affected.add(id) }
  const publish = (id: string, cause: string) => {
    const ports = [...(oldTasks.get(id)?.outputPorts ?? []), ...(newTasks.get(id)?.outputPorts ?? [])]
    for (const port of ports) queue.push({ address: { nodeId: id, port: port.name }, cause })
  }
  for (const [id, task] of newTasks) {
    const prior = oldTasks.get(id)
    if (!prior) { note(id, "new task"); publish(id, `new task ${id}`); continue }
    if (taskMeaningDigest(prior) !== taskMeaningDigest(task)) { note(id, "task execution meaning changed"); publish(id, `task specification changed: ${id}`) }
    const bindings = (bundle: GraphBundle) => sorted(bundle.graph.edges.filter(edge => edge.kind === "consumes" && edge.to.nodeId === id))
    const order = (bundle: GraphBundle) => sorted(bundle.graph.edges.filter(edge => edge.kind === "after" && edge.successor === id))
    if (canonical(bindings(before!)) !== canonical(bindings(after))) { note(id, "input binding changed"); publish(id, `input binding changed: ${id}`) }
    if (canonical(order(before!)) !== canonical(order(after))) { note(id, "after obligation changed"); publish(id, `after obligation changed: ${id}`) }
  }
  for (const id of removedTaskIds) { note(id, "task removed"); publish(id, `task removed: ${id}`) }
  const oldSources = new Map((before?.graph.sources ?? []).map(source => [source.id, source]))
  const newSources = new Map(after.graph.sources.map(source => [source.id, source]))
  for (const id of new Set([...oldSources.keys(), ...newSources.keys()])) {
    const prior = oldSources.get(id), next = newSources.get(id)
    for (const portName of new Set([...(prior?.outputs.map(port => port.name) ?? []), ...(next?.outputs.map(port => port.name) ?? [])])) {
      const a = prior?.outputs.find(port => port.name === portName), b = next?.outputs.find(port => port.name === portName)
      const oldArtifact = a && before?.sourceArtifacts.find(value => value.id === a.artifactRef.id && value.digest === a.artifactRef.digest)
      const newArtifact = b && after.sourceArtifacts.find(value => value.id === b.artifactRef.id && value.digest === b.artifactRef.digest)
      if (!a || !b || !oldArtifact || !newArtifact || !sameRef(a.contractRef, b.contractRef) || oldArtifact.contentDigest !== newArtifact.contentDigest) {
        queue.push({ address: { nodeId: id, port: portName }, cause: `source output changed: ${id}.${portName}` })
      }
    }
  }
  const edges = [...(before?.graph.edges ?? []), ...after.graph.edges].filter(edge => edge.kind === "consumes")
  for (let index = 0; index < queue.length; index++) {
    const item = queue[index]!, visit = `${key(item.address)}|${item.cause}`
    if (seen.has(visit)) continue
    seen.add(visit)
    for (const edge of edges) if (key(edge.from) === key(item.address)) {
      note(edge.to.nodeId, `${item.cause} via ${item.address.nodeId}.${item.address.port} → ${edge.to.nodeId}.${edge.to.port}`)
      publish(edge.to.nodeId, item.cause)
    }
  }
  for (const id of Object.keys(reasons)) reasons[id] = [...new Set(reasons[id])].sort()
  return { affectedTaskIds: [...affected].sort(), removedTaskIds, reasons }
}
