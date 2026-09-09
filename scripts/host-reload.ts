import { homedir } from "node:os"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { reloadLocal } from "../packages/host-integration/src/reload.ts"
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== "--home" || !args[1])) throw new Error("Usage: npm run host:reload [-- --home path]")
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
try { console.log(JSON.stringify(await reloadLocal(root, resolve(args[1] ?? homedir(), ".task-agent/host.json")), null, 2)) }
catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
