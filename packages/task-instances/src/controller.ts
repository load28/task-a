import { createHash } from "node:crypto"
import { FINALIZER, GROUP, validateSpec, type ClusterApi, type Resource, type TaskInstance } from "./types.ts"

export function names(instance: TaskInstance) {
  const suffix = createHash("sha256").update(instance.metadata.uid!).digest("hex").slice(0, 24)
  return { pod: `task-${suffix}`, volume: `task-${suffix}-data` }
}
export function podFor(instance: TaskInstance): Resource {
  const { pod, volume } = names(instance)
  return { apiVersion: "v1", kind: "Pod", metadata: {
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
        { name: "TASK_TERMINATION_MESSAGE", value: "/dev/termination-log" },
        { name: "HOME", value: "/data/home" }, { name: "XDG_DATA_HOME", value: "/data/home/.local/share" },
        { name: "XDG_CONFIG_HOME", value: "/data/home/.config" }, { name: "XDG_STATE_HOME", value: "/data/home/.local/state" }],
      ...(instance.spec.envSecret ? { envFrom: [{ secretRef: { name: instance.spec.envSecret } }] } : {}),
      resources: instance.spec.resources ?? { requests: { cpu: "250m", memory: "512Mi" }, limits: { cpu: "2", memory: "3Gi" } },
      securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ["ALL"] } },
      volumeMounts: [{ name: "data", mountPath: "/data" }],
      terminationMessagePath: "/dev/termination-log", terminationMessagePolicy: "File",
    }], volumes: [{ name: "data", persistentVolumeClaim: { claimName: volume } }],
  } }
}
/** One deterministic Pod name and UID-preconditioned deletion serialize each instance. */
export async function reconcile(api: ClusterApi, instance: TaskInstance, maxWorkers = 3) {
  validateSpec(instance.spec)
  const { pod: podName, volume } = names(instance)
  const pod = await api.get("pods", podName)
  const pvc = await api.get("persistentvolumeclaims", volume)
  const owned = (r: Resource) => r.metadata.labels?.[`${GROUP}/uid`] === instance.metadata.uid
  const report = async (phase: string, extra: Record<string, unknown> = {}) => {
    const status = { phase, observedGeneration: instance.metadata.generation, observedRun: instance.spec.run,
      ...(pvc || instance.status?.volumeName ? { volumeName: volume } : {}), ...extra }
    if (JSON.stringify(instance.status) !== JSON.stringify(status)) await api.status(instance, status)
  }
  if (pod && !pod.metadata.ownerReferences?.some(o => o.uid === instance.metadata.uid)) throw new Error("Pod ownership mismatch")
  if (instance.metadata.deletionTimestamp) {
    if (pod) { await api.remove("pods", pod); return }
    if (instance.spec.deletionPolicy === "Delete") {
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
  if (!pvc) {
    if (instance.status?.volumeName) { await report("RecoveryRequired", { reason: "Previously allocated volume is missing" }); return }
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
    await report(terminal === "Succeeded" ? "Completed" : terminal === "Failed" ? "Failed" : terminal === "Running" ? "Running" : "Starting",
      { podUid: pod.metadata.uid, ...(details ? { result: { exitCode: details.exitCode, message: details.message ?? "" } } : {}) })
    return
  }
  if (instance.status?.observedRun === instance.spec.run && instance.status?.podUid) {
    await report("RecoveryRequired", { podUid: instance.status.podUid, reason: "Pod disappeared; confirm prior execution stopped before resuming" }); return
  }
  const active = (await api.list("pods")).filter(p => p.metadata.labels?.[`${GROUP}/instance`] &&
    (p.metadata.deletionTimestamp || !["Succeeded", "Failed"].includes(p.status?.phase)))
  if (active.length >= maxWorkers) { await report("Queued", { reason: "Worker capacity reached" }); return }
  await api.create("pods", podFor(instance))
}
