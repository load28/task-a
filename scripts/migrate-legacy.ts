import { importLegacy } from "../packages/host-integration/src/migration.ts"
const [source, target, workspace] = process.argv.slice(2)
if (!source || !target || !workspace)
  throw new Error("Usage: npm run migrate:legacy -- <source.db> <target.db> <workspace>")
console.log(JSON.stringify(importLegacy(source, target, workspace)))
