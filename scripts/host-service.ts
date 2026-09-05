import { HostService } from "../packages/host-integration/src/service.ts"
import { loadConfig } from "../packages/host-integration/src/config.ts"
const path = process.argv[2]
if (!path) throw new Error("Host configuration path required")
const service = new HostService(loadConfig(path))
let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  void service.close().then(() => process.exit(0))
}
process.on("SIGTERM", stop)
process.on("SIGINT", stop)
try {
  await service.start()
} catch (e) {
  await service.close()
  throw e
}
