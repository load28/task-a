import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('./', import.meta.url);
const lock = JSON.parse(await readFile(new URL('upstream.lock.json', root), 'utf8'));
let changed = 0;
for (const [path, expected] of Object.entries(lock.files)) {
  const bytes = await readFile(new URL(`${lock.sourceDirectory}/${path}`, root));
  const actual = createHash('sha256').update(bytes).digest('hex');
  const modification = lock.modifications[path];
  if (actual === expected) {
    if (modification) throw new Error(`Obsolete modification record: ${path}`);
    continue;
  }
  if (!modification?.reason?.trim() || modification.sha256 !== actual) {
    throw new Error(`Unrecorded upstream change: ${path}`);
  }
  changed++;
}
for (const path of Object.keys(lock.modifications)) {
  if (!(path in lock.files)) throw new Error(`Unknown upstream path: ${path}`);
}
console.log(JSON.stringify({ commit: lock.commit, files: Object.keys(lock.files).length, unchanged: Object.keys(lock.files).length - changed, modified: changed }));
