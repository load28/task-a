import { parentPort, workerData } from "node:worker_threads"
import { createRequire } from "node:module"
import { Ajv } from "ajv"
import { Ajv2019 } from "ajv/dist/2019.js"
import { Ajv2020 } from "ajv/dist/2020.js"
import formats from "ajv-formats"

const require = createRequire(import.meta.url)
const addFormats = typeof formats === "function" ? formats : formats.default
const schema = workerData.schema
const dialect = typeof schema === "object" && schema !== null ? schema.$schema : undefined
const environment = { node: process.versions.node, ajv: require("ajv/package.json").version, formats: require("ajv-formats/package.json").version, dialect: dialect ?? "draft-07" }
try {
  const options = { strict: true, strictTypes: false, strictTuples: false, allErrors: false, validateFormats: true, coerceTypes: false, useDefaults: false, removeAdditional: false } as const
  const engine = dialect === "https://json-schema.org/draft/2020-12/schema" ? new Ajv2020(options)
    : dialect === "https://json-schema.org/draft/2019-09/schema" ? new Ajv2019(options)
    : dialect === undefined || dialect === "http://json-schema.org/draft-07/schema#" || dialect === "https://json-schema.org/draft-07/schema" ? new Ajv(options)
    : null
  if (!engine) throw new Error(`Unsupported JSON Schema dialect: ${String(dialect)}`)
  if (typeof schema === "object" && schema !== null && schema.$async === true) throw new Error("Asynchronous schemas are unsupported")
  addFormats(engine)
  const validate = engine.compile(schema)
  const valid = validate(workerData.data)
  parentPort!.postMessage({ outcome: valid ? "passed" : "failed", diagnostics: valid ? [] : [JSON.stringify(validate.errors)], environment })
} catch (error) {
  parentPort!.postMessage({ outcome: "inconclusive", diagnostics: [(error as Error).message], environment })
}
