import { loadConfig } from "../packages/host-integration/src/config.ts"
import { createBridge } from "../packages/host-integration/src/bridge.ts"
import { serveStdio } from "../packages/protocol-mcp/src/index.ts"
const path = process.argv[2]
if (!path) throw new Error("Usage: host-mcp.ts <config.json>")
await serveStdio(createBridge(path, loadConfig(path)))
