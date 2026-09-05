import { DatabaseSync, backup } from "node:sqlite"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const [source, destination] = process.argv.slice(2)
if (!source || !destination) throw new Error("Usage: node scripts/backup.ts SOURCE_DB NEW_BACKUP_DB")
if (!existsSync(source) || existsSync(destination) || resolve(source) === resolve(destination)) throw new Error("Source must exist and backup destination must be new")
const db = new DatabaseSync(source, { readOnly: true })
try {
  await backup(db, destination)
  const copy = new DatabaseSync(destination, { readOnly: true })
  try {
    const row = copy.prepare("PRAGMA integrity_check").get()
    if (row?.integrity_check !== "ok") throw new Error("Backup integrity check failed")
  } finally { copy.close() }
  console.log("Backup created and integrity checked")
} finally { db.close() }
