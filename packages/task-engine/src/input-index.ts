import type { DatabaseSync } from "node:sqlite"

/** Rebuild once on upgrade; SQLite triggers keep reverse references in the
 * same transaction as every writer, including older controller connections. */
export function installInputIndex(db:DatabaseSync):void {
  db.exec(`CREATE TABLE IF NOT EXISTS input_index_versions(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS signal_task_artifacts(task_id TEXT NOT NULL,kind TEXT NOT NULL,artifact_id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(task_id,kind,artifact_id,version));
    CREATE INDEX IF NOT EXISTS signal_task_artifact_source ON signal_task_artifacts(artifact_id,version,kind,task_id);
    CREATE TABLE IF NOT EXISTS signal_snapshot_artifacts(attempt_id TEXT NOT NULL,artifact_id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(attempt_id,artifact_id,version));
    CREATE INDEX IF NOT EXISTS signal_snapshot_source ON signal_snapshot_artifacts(artifact_id,version,attempt_id);
    CREATE TABLE IF NOT EXISTS signal_bundle_members(artifact_id TEXT NOT NULL,version INTEGER NOT NULL,member_id TEXT NOT NULL,member_version INTEGER NOT NULL,PRIMARY KEY(artifact_id,version,member_id,member_version));
    CREATE INDEX IF NOT EXISTS signal_bundle_member ON signal_bundle_members(member_id,artifact_id,version);
    CREATE INDEX IF NOT EXISTS signal_stop_task ON task_input_stops(json_extract(payload,'$.taskId'),json_extract(payload,'$.state'),json_extract(payload,'$.token'));
    CREATE INDEX IF NOT EXISTS signal_plan_task ON plan_task_links(task_id,plan_id,revision,node_id);`)
  for(const operation of ["INSERT","UPDATE","DELETE"] as const) {
    const old=operation!=="INSERT",fresh=operation!=="DELETE"
    db.exec(`CREATE TRIGGER IF NOT EXISTS signal_task_refs_${operation.toLowerCase()} AFTER ${operation}${operation==="UPDATE"?" OF input_artifact_refs_json,output_artifact_refs_json":""} ON tasks
      ${operation==="UPDATE"?"WHEN OLD.input_artifact_refs_json<>NEW.input_artifact_refs_json OR OLD.output_artifact_refs_json<>NEW.output_artifact_refs_json":""} BEGIN
      ${old?"DELETE FROM signal_task_artifacts WHERE task_id=OLD.id;":""}
      ${fresh?`INSERT OR IGNORE INTO signal_task_artifacts SELECT NEW.id,'input',json_extract(value,'$.artifactId'),json_extract(value,'$.version') FROM json_each(NEW.input_artifact_refs_json);
      INSERT OR IGNORE INTO signal_task_artifacts SELECT NEW.id,'output',json_extract(value,'$.artifactId'),json_extract(value,'$.version') FROM json_each(NEW.output_artifact_refs_json);`:""} END;`)
    db.exec(`CREATE TRIGGER IF NOT EXISTS signal_snapshot_refs_${operation.toLowerCase()} AFTER ${operation} ON task_input_snapshots BEGIN
      ${old?"DELETE FROM signal_snapshot_artifacts WHERE attempt_id=OLD.attempt_id;":""}
      ${fresh?"INSERT OR IGNORE INTO signal_snapshot_artifacts SELECT NEW.attempt_id,json_extract(value,'$.artifactId'),json_extract(value,'$.version') FROM json_each(NEW.payload,'$.inputRefs');":""} END;`)
    db.exec(`CREATE TRIGGER IF NOT EXISTS signal_bundle_refs_${operation.toLowerCase()} AFTER ${operation}${operation==="UPDATE"?" OF member_refs_json":""} ON verified_bundles BEGIN
      ${old?"DELETE FROM signal_bundle_members WHERE artifact_id=OLD.artifact_id AND version=OLD.version;":""}
      ${fresh?"INSERT OR IGNORE INTO signal_bundle_members SELECT NEW.artifact_id,NEW.version,json_extract(value,'$.artifactId'),json_extract(value,'$.version') FROM json_each(NEW.member_refs_json);":""} END;`)
  }
  if(db.prepare("SELECT 1 FROM input_index_versions WHERE version=1").get())return
  db.exec(`INSERT OR IGNORE INTO signal_task_artifacts SELECT t.id,'input',json_extract(j.value,'$.artifactId'),json_extract(j.value,'$.version') FROM tasks t,json_each(t.input_artifact_refs_json) j;
    INSERT OR IGNORE INTO signal_task_artifacts SELECT t.id,'output',json_extract(j.value,'$.artifactId'),json_extract(j.value,'$.version') FROM tasks t,json_each(t.output_artifact_refs_json) j;
    INSERT OR IGNORE INTO signal_snapshot_artifacts SELECT s.attempt_id,json_extract(j.value,'$.artifactId'),json_extract(j.value,'$.version') FROM task_input_snapshots s,json_each(s.payload,'$.inputRefs') j;
    INSERT OR IGNORE INTO signal_bundle_members SELECT b.artifact_id,b.version,json_extract(j.value,'$.artifactId'),json_extract(j.value,'$.version') FROM verified_bundles b,json_each(b.member_refs_json) j;
    INSERT INTO input_index_versions VALUES(1);`)
}

export function inputConsumers(db:DatabaseSync,artifactId:string):string[] {
  // Follow immutable bundle lineage by exact version. Only the current attempt
  // may supply pinned inputs; older snapshots must not resurrect consumers.
  return db.prepare(`WITH RECURSIVE inputs(artifact_id,version) AS (
    SELECT artifact_id,version FROM artifact_versions WHERE artifact_id=?
    UNION SELECT l.artifact_id,l.version FROM inputs i JOIN artifact_lineage l ON l.input_artifact_id=i.artifact_id AND l.input_version=i.version
      JOIN artifact_versions v ON v.artifact_id=l.artifact_id AND v.version=l.version WHERE v.type='bundle'
  ), inherited(task_id) AS (
    SELECT d.task_id FROM signal_task_artifacts o JOIN task_dependencies d ON d.depends_on_task_id=o.task_id WHERE o.artifact_id=? AND o.kind='output'
    UNION SELECT t.id FROM tasks t JOIN inherited p ON t.parent_id=p.task_id
  ), direct(task_id) AS (
    SELECT r.task_id FROM inputs i JOIN signal_task_artifacts r ON r.artifact_id=i.artifact_id AND r.version=i.version AND r.kind='input'
      WHERE NOT EXISTS(SELECT 1 FROM task_input_snapshots s WHERE s.attempt_id=(SELECT id FROM task_attempts WHERE task_id=r.task_id ORDER BY rowid DESC LIMIT 1))
    UNION SELECT a.task_id FROM inputs i JOIN signal_snapshot_artifacts s ON s.artifact_id=i.artifact_id AND s.version=i.version JOIN task_attempts a ON a.id=s.attempt_id
      WHERE a.id=(SELECT id FROM task_attempts WHERE task_id=a.task_id ORDER BY rowid DESC LIMIT 1)
  ) SELECT task_id FROM direct UNION SELECT task_id FROM inherited ORDER BY task_id`).all(artifactId,artifactId).map(row=>String(row.task_id))
}
