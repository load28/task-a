import { createHash } from "node:crypto"
import { FINALIZER, GROUP, validateSpec, type ClusterApi, type Resource, type TaskInstance } from "./types.ts"
import type { WorkspaceArchive } from "./archive.ts"
import { instanceName } from "./manager.ts"

export function names(instance: TaskInstance) {
  const suffix = createHash("sha256").update(instance.metadata.uid!).digest("hex").slice(0, 24)
  return { pod: `task-${suffix}`, volume: `task-${suffix}-data` }
}
export function podFor(instance: TaskInstance, sourceVolumes: string[] = [], sourceArchives: Array<WorkspaceArchive | null> = [], restoreSource?: { claim: string; archive?: WorkspaceArchive }): Resource {
  const { pod, volume } = names(instance)
  const result: Resource = { apiVersion: "v1", kind: "Pod", metadata: {
    name: pod, namespace: instance.metadata.namespace,
    labels: { [`${GROUP}/instance`]: instance.metadata.name },
    annotations: { [`${GROUP}/run`]: String(instance.spec.run) },
    ownerReferences: [{ apiVersion: instance.apiVersion, kind: "TaskInstance", name: instance.metadata.name, uid: instance.metadata.uid, controller: true }],
  }, spec: {
    restartPolicy: "Never", automountServiceAccountToken: false, terminationGracePeriodSeconds: 60,
    securityContext: { runAsNonRoot: true, runAsUser: 1000, runAsGroup: 1000, fsGroup: 1000 },
    containers: [{ name: "worker", image: instance.spec.image, imagePullPolicy: "IfNotPresent",
      command: ["node", "/app/scripts/instance-worker.ts"],
      env: [{ name: "TASK_INSTANCE_SPEC", value: JSON.stringify(instance.spec) }, { name: "TASK_INSTANCE_ID", value: instance.metadata.uid },
        ...(restoreSource ? restoreSource.archive ? [{ name: "TASK_WORKSPACE_ARCHIVE", value: JSON.stringify(restoreSource.archive) }, { name: "TASK_RESTORE_ROOT", value: "/restore" }] : [{ name: "TASK_RESTORE_DIRECTORY", value: "/restore" }] : []),
        ...(instance.status?.archive && instance.spec.run > instance.status.archive.run ? [{ name: "TASK_WORKSPACE_ARCHIVE", value: JSON.stringify(instance.status.archive) }] : []),
        ...(sourceArchives.some(Boolean) ? [{ name: "TASK_REUSE_ARCHIVES", value: JSON.stringify(sourceArchives) }] : []),
        { name: "TASK_TERMINATION_MESSAGE", value: "/dev/termination-log" },
        { name: "HOME", value: "/data/home" }, { name: "XDG_DATA_HOME", value: "/data/home/.local/share" },
        { name: "XDG_CONFIG_HOME", value: "/data/home/.config" }, { name: "XDG_STATE_HOME", value: "/data/home/.local/state" }],
      ...(instance.spec.envSecret ? { envFrom: [{ secretRef: { name: instance.spec.envSecret } }] } : {}),
      resources: instance.spec.resources ?? { requests: { cpu: "250m", memory: "512Mi" }, limits: { cpu: "2", memory: "3Gi" } },
      securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ["ALL"] } },
      volumeMounts: [{ name: "data", mountPath: "/data" }, ...(restoreSource ? [{ name: "restore", mountPath: "/restore", readOnly: true }] : []), ...(instance.spec.archive ? [{ name: "archive", mountPath: "/archive" }] : []), ...sourceVolumes.map((_, i) => ({ name: `reuse-${i}`, mountPath: `/reuse/${i}`, readOnly: true }))],
      terminationMessagePath: "/dev/termination-log", terminationMessagePolicy: "File",
    }], volumes: [{ name: "data", persistentVolumeClaim: { claimName: volume } }, ...(restoreSource ? [{ name: "restore", persistentVolumeClaim: { claimName: restoreSource.claim, readOnly: true } }] : []), ...(instance.spec.archive ? [{ name: "archive", persistentVolumeClaim: { claimName: instance.spec.archive.claimName } }] : []), ...sourceVolumes.map((name, i) => ({ name: `reuse-${i}`, persistentVolumeClaim: { claimName: name, readOnly: true } }))],
  } }
  // A shared archive claim may be both the read-only source and the writable
  // destination. Mount one Kubernetes volume with per-mount readOnly flags.
  const claims = new Map<string, any>(), aliases = new Map<string, string>()
  result.spec.volumes = result.spec.volumes.filter((entry: any) => {
    const claim = entry.persistentVolumeClaim.claimName, prior = claims.get(claim)
    if (!prior) { claims.set(claim, entry); return true }
    aliases.set(entry.name, prior.name)
    prior.persistentVolumeClaim.readOnly = Boolean(prior.persistentVolumeClaim.readOnly && entry.persistentVolumeClaim.readOnly)
    return false
  })
  for (const mount of result.spec.containers[0].volumeMounts) mount.name = aliases.get(mount.name) ?? mount.name
  return result
}
/** One deterministic Pod name and UID-preconditioned deletion serialize each instance. */
export async function reconcile(api: ClusterApi, instance: TaskInstance, maxWorkers = 3) {
  validateSpec(instance.spec)
  const { pod: podName, volume } = names(instance)
  const pod = await api.get("pods", podName)
  const pvc = await api.get("persistentvolumeclaims", volume)
  const owned = (r: Resource) => r.metadata.labels?.[`${GROUP}/uid`] === instance.metadata.uid
  const report = async (phase: string, extra: Record<string, unknown> = {}) => {
    const status = { ...(instance.status?.archive ? { archive: instance.status.archive, archivedRun: instance.status.archivedRun } : {}), phase, observedGeneration: instance.metadata.generation, observedRun: instance.spec.run,
      ...(pvc || instance.status?.volumeName ? { volumeName: volume } : {}), ...extra }
    if (JSON.stringify(instance.status) !== JSON.stringify(status)) await api.status(instance, status)
  }
  if (pod && !pod.metadata.ownerReferences?.some(o => o.uid === instance.metadata.uid)) throw new Error("Pod ownership mismatch")
  if (instance.metadata.deletionTimestamp) {
    if (pod) { await api.remove("pods", pod); return }
    if (instance.spec.deletionPolicy === "Delete") {
      const consumers = (await api.list("taskinstances")).filter(r => r.metadata.uid !== instance.metadata.uid &&
        !["Completed", "Archived"].includes(r.status?.phase) && (r.spec.restoreFromTaskId === instance.spec.taskId || r.spec.reuseSources?.some((s: any) => s.taskId === instance.spec.taskId)))
      if (consumers.length) { await report("RetainedForConsumers", { reason: "Other revisions still reference stage snapshots" }); return }
      if (pvc) {
        if (!owned(pvc)) throw new Error("PVC ownership mismatch")
        await api.remove("persistentvolumeclaims", pvc); return
      }
    }
    if (instance.metadata.finalizers?.includes(FINALIZER))
      await api.replace("taskinstances", { ...instance, metadata: { ...instance.metadata, finalizers: instance.metadata.finalizers.filter(f => f !== FINALIZER) } })
    return
  }
  if (!instance.metadata.finalizers?.includes(FINALIZER)) {
    await api.replace("taskinstances", { ...instance, metadata: { ...instance.metadata, finalizers: [...(instance.metadata.finalizers ?? []), FINALIZER] } })
    return
  }
  if (instance.spec.desiredState === "Suspended") {
    if (pod) { await api.remove("pods", pod); await report("Suspending"); return }
    await report("Suspended"); return
  }
  // Persist archive identity before deleting anything. Reconciliation can restart
  // after either deletion and still distinguish cleanup from accidental loss.
  if (instance.status?.archive && instance.status.archivedRun === instance.spec.run && instance.spec.archive?.cleanupOnCompletion) {
    const consumers = (await api.list("taskinstances")).filter(r => r.metadata.uid !== instance.metadata.uid &&
      !["Completed", "Archived"].includes(r.status?.phase) && (r.spec.restoreFromTaskId === instance.spec.taskId || r.spec.reuseSources?.some((source: any) => source.taskId === instance.spec.taskId)))
    if (consumers.length) { await report("Archiving", { reason: "Waiting for active stage consumers before releasing the source volume" }); return }
    if (pod) { await api.remove("pods", pod); return }
    if (pvc) { if (!owned(pvc)) throw new Error("Archive cleanup volume identity mismatch"); await api.remove("persistentvolumeclaims", pvc); return }
    await report("Archived", { result: instance.status.result }); return
  }
  // Recheck external storage even for instances created before admission checks existed.
  if (instance.spec.archive && !["Succeeded", "Failed", "Running"].includes(pod?.status?.phase)) {
    const claim = await api.get("persistentvolumeclaims", instance.spec.archive.claimName)
    if (!claim || claim.metadata.deletionTimestamp || claim.status?.phase === "Lost") {
      await report("Blocked", { reason: "ArchiveUnavailable", message: `Archive PVC "${instance.spec.archive.claimName}" is missing or unavailable`, ...(pod ? { podUid: pod.metadata.uid } : {}) }); return
    }
  }
  const restoreConsumers = (await api.list("taskinstances")).filter(r => r.spec?.restoreFromTaskId === instance.spec.taskId && !["Completed", "Archived"].includes(r.status?.phase))
  if (restoreConsumers.length && !pod && (instance.status?.observedRun !== instance.spec.run || instance.status?.phase === "WaitingForRestore" && instance.status?.reason === "Stopped workspace is pinned by repair consumers")) {
    await report("WaitingForRestore", { reason: "Stopped workspace is pinned by repair consumers" }); return
  }
  if (!pvc) {
    if (instance.status?.volumeName && !(instance.status?.archive && instance.spec.run > instance.status.archive.run)) { await report("RecoveryRequired", { reason: "Previously allocated volume is missing" }); return }
    await api.create("persistentvolumeclaims", { apiVersion: "v1", kind: "PersistentVolumeClaim",
      metadata: { name: volume, namespace: instance.metadata.namespace, labels: { [`${GROUP}/uid`]: instance.metadata.uid! } },
      spec: { accessModes: ["ReadWriteOnce"], resources: { requests: { storage: instance.spec.storage.size } },
        ...(instance.spec.storage.className !== undefined ? { storageClassName: instance.spec.storage.className } : {}) },
    })
    return
  }
  if (!owned(pvc) || pvc.metadata.deletionTimestamp) throw new Error("PVC is unavailable or belongs to another instance")
  if (pod) {
    if (pod.metadata.deletionTimestamp) { await report("Stopping"); return }
    if (pod.metadata.annotations?.[`${GROUP}/run`] !== String(instance.spec.run)) {
      await api.remove("pods", pod); return
    }
    const terminal = pod.status?.phase
    const details = pod.status?.containerStatuses?.find((c: any) => c.name === "worker")?.state?.terminated
    if (terminal === "Succeeded" && instance.spec.archive?.cleanupOnCompletion) {
      let archive: WorkspaceArchive | undefined
      try { archive = JSON.parse(details?.message ?? "{}").archive } catch {}
      if (!archive || archive.version !== 1 || archive.instanceId !== instance.metadata.uid || archive.run !== instance.spec.run || archive.file !== `run-${instance.spec.run}.tar.gz` || !/^[a-f0-9]{64}$/.test(archive.sha256)) {
        await report("RecoveryRequired", { reason: "Completion has no verified archive receipt; execution data retained" }); return
      }
      await report("Archiving", { archive, archivedRun: instance.spec.run, result: { exitCode: details.exitCode, message: details.message, codeSnapshot: JSON.parse(details.message).codeSnapshot, inputSnapshotDigest: JSON.parse(details.message).inputSnapshotDigest } }); return
    }
    const scheduling = pod.status?.conditions?.find((c: any) => c.type === "PodScheduled" && c.status === "False")
    const waiting = pod.status?.initContainerStatuses?.find((c: any) => c.state?.waiting)?.state.waiting
      ?? pod.status?.containerStatuses?.find((c: any) => c.state?.waiting)?.state.waiting
    if (terminal === "Pending" && (scheduling || waiting)) {
      const diagnostic = scheduling ?? waiting
      await report("Starting", { podUid: pod.metadata.uid, reason: diagnostic.reason ?? "Pending", message: diagnostic.message ?? "" }); return
    }
    await report(terminal === "Succeeded" ? "Completed" : terminal === "Failed" ? "Failed" : terminal === "Running" ? "Running" : "Starting",
      { podUid: pod.metadata.uid, ...(details ? { result: { exitCode: details.exitCode, message: details.message ?? "", ...(() => { try { const r = JSON.parse(details.message ?? "{}"); return { codeSnapshot: r.codeSnapshot, inputSnapshotDigest: r.inputSnapshotDigest, failure: r.failure ?? (details.exitCode !== 0 ? { message: details.reason ?? "Worker terminated", exitCode: details.exitCode, signal: details.signal } : undefined) } } catch { return {} } })() } } : {}) })
    return
  }
  if (instance.status?.observedRun === instance.spec.run && instance.status?.podUid) {
    await report("RecoveryRequired", { podUid: instance.status.podUid, reason: "Pod disappeared; confirm prior execution stopped before resuming" }); return
  }
  const active = (await api.list("pods")).filter(p => p.metadata.labels?.[`${GROUP}/instance`] &&
    (p.metadata.deletionTimestamp || !["Succeeded", "Failed"].includes(p.status?.phase)))
  if (active.length >= maxWorkers) { await report("Queued", { reason: "Worker capacity reached" }); return }
  const sourceVolumes: string[] = []
  const sourceArchives: Array<WorkspaceArchive | null> = []
  for (const source of instance.spec.reuseSources ?? []) {
    const prior = await api.get("taskinstances", instanceName(source.taskId)) as TaskInstance | undefined
    if (!prior || !["Suspended", "Completed", "Failed", "Archived", "Archiving"].includes(prior.status?.phase) || prior.metadata.deletionTimestamp) {
      await report("WaitingForReuse", { reason: "Source execution must be stopped before importing stage snapshots" }); return
    }
    if (prior.status?.archive && prior.spec.archive && ["Archived", "Archiving"].includes(prior.status.phase)) {
      sourceVolumes.push(prior.spec.archive.claimName); sourceArchives.push(prior.status.archive); continue
    }
    const sourceVolume = await api.get("persistentvolumeclaims", names(prior).volume)
    if (!sourceVolume || sourceVolume.metadata.labels?.[`${GROUP}/uid`] !== prior.metadata.uid) {
      await report("RecoveryRequired", { reason: "Reuse source volume is missing or has changed identity" }); return
    }
    sourceVolumes.push(sourceVolume.metadata.name); sourceArchives.push(null)
  }
  let restoreSource: { claim: string; archive?: WorkspaceArchive } | undefined
  if (instance.spec.restoreFromTaskId && !instance.status?.archive) {
    const source = await api.get("taskinstances", instanceName(instance.spec.restoreFromTaskId)) as TaskInstance | undefined
    if (!source || source.metadata.deletionTimestamp || !["Suspended", "Failed", "Completed", "Archived", "Archiving"].includes(source.status?.phase)) {
      await report("WaitingForRestore", { reason: "Source task must be stopped before restoring its workspace" }); return
    }
    if (source.status?.archive && source.spec.archive && source.status.archive.run === source.spec.run) {
      restoreSource = { claim: source.spec.archive.claimName, archive: source.status.archive }
    } else {
      const sourcePod = await api.get("pods", names(source).pod)
      const sourceVolume = await api.get("persistentvolumeclaims", names(source).volume)
      if (sourcePod && !["Succeeded", "Failed"].includes(sourcePod.status?.phase)) {
        await report("WaitingForRestore", { reason: "Source worker termination is not confirmed" }); return
      }
      if (!sourceVolume || sourceVolume.metadata.labels?.[`${GROUP}/uid`] !== source.metadata.uid) {
        await report("RecoveryRequired", { reason: "Stopped source workspace is missing or has changed identity" }); return
      }
      restoreSource = { claim: sourceVolume.metadata.name }
    }
  }
  const desiredPod = podFor(instance, sourceVolumes, sourceArchives, restoreSource)
  for (const mount of desiredPod.spec.volumes) {
    const claimName = mount.persistentVolumeClaim.claimName
    const claim = await api.get("persistentvolumeclaims", claimName)
    if (!claim || claim.metadata.deletionTimestamp || claim.status?.phase === "Lost") {
      await report("Blocked", { reason: "VolumeUnavailable", message: `PVC "${claimName}" is missing or unavailable` }); return
    }
  }
  await api.create("pods", desiredPod)
}
