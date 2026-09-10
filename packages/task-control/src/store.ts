import type { DatabaseSync } from "node:sqlite"
import { canonical, digest } from "./value.ts"

export interface TransactionStore { db: DatabaseSync; transaction<T>(operation: () => T): T }
export interface SystemEvent {
  id: string; type: string; entityId: string; timestamp: number; payload: unknown
  causationId?: string; correlationId: string; schemaVersion: 1
}
export const COLLECTIONS = ["evidence_versions", "decision_versions", "assumptions", "task_expectations", "task_observations", "prediction_errors", "planning_boundaries", "boundary_proofs", "role_versions", "policy_versions", "signal_snapshots", "context_manifests", "cognitive_records", "routine_versions", "policy_proposals", "policy_evaluations", "policy_replay_frames", "policy_shadow_trials", "policy_shadow_predictions", "policy_regression_watches", "policy_measurement_studies", "outcome_labels", "replan_regions", "replan_leases", "replan_supersessions", "validator_versions", "controller_programs", "observed_input_definitions", "observed_input_observations"] as const
export type Collection = typeof COLLECTIONS[number]

/** Every writer uses the graph connection; nested graph transactions remain atomic. */
export class ControlStore {
  readonly host: TransactionStore
  constructor(host: TransactionStore) {
    this.host = host
    this.atomic(() => {
      host.db.exec(`
        CREATE TABLE IF NOT EXISTS control_schema(version INTEGER PRIMARY KEY, installed_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS event_outbox(sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, type TEXT NOT NULL, entity_id TEXT NOT NULL, correlation_id TEXT NOT NULL, payload TEXT NOT NULL);
        CREATE TRIGGER IF NOT EXISTS event_outbox_immutable_update BEFORE UPDATE ON event_outbox BEGIN SELECT RAISE(ABORT,'Immutable event'); END;
        CREATE TRIGGER IF NOT EXISTS event_outbox_immutable_delete BEFORE DELETE ON event_outbox BEGIN SELECT RAISE(ABORT,'Immutable event'); END;
        CREATE INDEX IF NOT EXISTS event_outbox_entity ON event_outbox(entity_id,sequence);
        CREATE TABLE IF NOT EXISTS event_consumers(id TEXT PRIMARY KEY, sequence INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS event_effects(consumer_id TEXT NOT NULL, event_id TEXT NOT NULL REFERENCES event_outbox(id), policy_version TEXT NOT NULL, PRIMARY KEY(consumer_id,event_id,policy_version));
        CREATE TABLE IF NOT EXISTS control_heads(collection TEXT NOT NULL,id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(collection,id));
        CREATE TABLE IF NOT EXISTS causal_edge_versions(id TEXT NOT NULL,version INTEGER NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,relation TEXT NOT NULL,payload TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(id,version));
        CREATE INDEX IF NOT EXISTS causal_sources ON causal_edge_versions(source,version);
        CREATE INDEX IF NOT EXISTS causal_targets ON causal_edge_versions(target,version);
        CREATE TABLE IF NOT EXISTS causal_edges(id TEXT PRIMARY KEY,version INTEGER NOT NULL,FOREIGN KEY(id,version) REFERENCES causal_edge_versions(id,version));
        CREATE TABLE IF NOT EXISTS cognitive_dependencies(record_id TEXT NOT NULL,record_version INTEGER NOT NULL,entity_id TEXT NOT NULL,port TEXT NOT NULL,view TEXT NOT NULL,version INTEGER NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(record_id,record_version,entity_id,port,view));
        CREATE INDEX IF NOT EXISTS cognitive_consumers ON cognitive_dependencies(entity_id,port,view);
        CREATE TABLE IF NOT EXISTS cognitive_invalidations(record_id TEXT NOT NULL,record_version INTEGER NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(record_id,record_version,event_id));
        CREATE TABLE IF NOT EXISTS evidence_retractions(id TEXT NOT NULL,version INTEGER NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(id,version));
        CREATE TABLE IF NOT EXISTS evidence_expirations(id TEXT NOT NULL,version INTEGER NOT NULL,expires_at INTEGER NOT NULL,emitted INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(id,version));
        CREATE INDEX IF NOT EXISTS evidence_expiration_queue ON evidence_expirations(emitted,expires_at);
        CREATE TABLE IF NOT EXISTS cognitive_references(record_id TEXT NOT NULL,record_version INTEGER NOT NULL,kind TEXT NOT NULL,ref_id TEXT NOT NULL,ref_version INTEGER NOT NULL,PRIMARY KEY(record_id,record_version,kind,ref_id,ref_version));
        CREATE INDEX IF NOT EXISTS cognitive_reference_consumers ON cognitive_references(kind,ref_id,ref_version);
        CREATE TABLE IF NOT EXISTS cognitive_retired_references(kind TEXT NOT NULL,ref_id TEXT NOT NULL,ref_version INTEGER NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(kind,ref_id,ref_version));
        CREATE TABLE IF NOT EXISTS validation_obligations(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL,tuple_hash TEXT NOT NULL,mandatory INTEGER NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS unresolved_obligations ON validation_obligations(entity_id,state);
        CREATE TABLE IF NOT EXISTS activation_decisions(id TEXT PRIMARY KEY,event_id TEXT NOT NULL,task_id TEXT NOT NULL,role_id TEXT NOT NULL,policy_version TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(event_id,task_id,role_id,policy_version));
        CREATE TABLE IF NOT EXISTS activation_grants(id TEXT PRIMARY KEY,decision_id TEXT NOT NULL UNIQUE REFERENCES activation_decisions(id),task_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS agent_runs(id TEXT PRIMARY KEY,grant_id TEXT NOT NULL UNIQUE REFERENCES activation_grants(id),task_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS runs_task ON agent_runs(task_id,state);
        CREATE TABLE IF NOT EXISTS budget_reservations(id TEXT PRIMARY KEY,account TEXT NOT NULL,reserved REAL NOT NULL,spent REAL,state TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS execution_costs(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,category TEXT NOT NULL,kind TEXT NOT NULL,amount REAL,unit TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS control_ready(task_id TEXT PRIMARY KEY,event_id TEXT NOT NULL,eligible INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS propagation_observations(id TEXT PRIMARY KEY,edge_id TEXT NOT NULL,episode TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS replay_jobs(id TEXT PRIMARY KEY,state TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS policy_heads(target TEXT PRIMARY KEY,policy_id TEXT NOT NULL,version INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS policy_head_revisions(target TEXT PRIMARY KEY,revision INTEGER NOT NULL);
        INSERT OR IGNORE INTO policy_head_revisions SELECT target,1 FROM policy_heads;
        CREATE TRIGGER IF NOT EXISTS policy_head_insert AFTER INSERT ON policy_heads BEGIN
          INSERT INTO policy_head_revisions VALUES(NEW.target,1) ON CONFLICT(target) DO UPDATE SET revision=revision+1;
        END;
        CREATE TRIGGER IF NOT EXISTS policy_head_update AFTER UPDATE ON policy_heads BEGIN
          INSERT INTO policy_head_revisions VALUES(NEW.target,1) ON CONFLICT(target) DO UPDATE SET revision=revision+1;
        END;
        CREATE TRIGGER IF NOT EXISTS policy_head_delete AFTER DELETE ON policy_heads BEGIN
          INSERT INTO policy_head_revisions VALUES(OLD.target,1) ON CONFLICT(target) DO UPDATE SET revision=revision+1;
        END;
        CREATE TABLE IF NOT EXISTS control_task_changes(task_id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS control_projection_edges(id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS control_attempt_expectations(attempt_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,expectation_version INTEGER NOT NULL,spec_hash TEXT NOT NULL,input_vector TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS control_prediction_state(task_id TEXT PRIMARY KEY,attempt_id TEXT NOT NULL,observation_id TEXT NOT NULL,observation_version INTEGER NOT NULL,payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS planning_boundary_members(boundary_id TEXT NOT NULL,version INTEGER NOT NULL,task_id TEXT NOT NULL,PRIMARY KEY(boundary_id,version,task_id));
        CREATE INDEX IF NOT EXISTS boundary_member_lookup ON planning_boundary_members(task_id,boundary_id,version);
        CREATE TABLE IF NOT EXISTS controlled_plans(plan_id TEXT PRIMARY KEY,generation INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS controlled_tasks(task_id TEXT PRIMARY KEY,request_id TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS task_admission_intents(task_id TEXT PRIMARY KEY,grant_id TEXT NOT NULL,worker TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS request_plan_admissions(plan_id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS scoped_replan_stages(id TEXT PRIMARY KEY,plan_id TEXT NOT NULL,generation INTEGER NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS scoped_replan_plan ON scoped_replan_stages(plan_id,state);
        CREATE TABLE IF NOT EXISTS scoped_revision_bindings(plan_id TEXT NOT NULL,version INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(plan_id,version));
      `)
      // Store-level triggers cover signal/revision paths which do not emit domain events.
      // They also protect grants when the writer is a separate native/Pod MCP process.
      host.db.exec(`
        DROP TRIGGER IF EXISTS control_task_insert;
        DROP TRIGGER IF EXISTS control_task_update;
        DROP TRIGGER IF EXISTS control_visibility_update;
        DROP TRIGGER IF EXISTS control_visibility_insert;
        DROP TRIGGER IF EXISTS control_dependency_insert;
        DROP TRIGGER IF EXISTS control_dependency_delete;
        CREATE TRIGGER IF NOT EXISTS control_task_insert AFTER INSERT ON tasks BEGIN
          INSERT INTO control_task_changes SELECT NEW.id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=NEW.id);
        END;
        CREATE TRIGGER IF NOT EXISTS control_task_update AFTER UPDATE ON tasks BEGIN
          INSERT INTO control_task_changes SELECT NEW.id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=NEW.id);
          UPDATE activation_grants SET state='fenced' WHERE task_id=NEW.id AND state IN ('issued','claimed') AND NEW.status IN ('stale','failed');
        END;
        CREATE TRIGGER IF NOT EXISTS control_visibility_update AFTER UPDATE ON plan_task_visibility BEGIN
          INSERT INTO control_task_changes SELECT NEW.task_id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=NEW.task_id);
          UPDATE activation_grants SET state='fenced' WHERE task_id=NEW.task_id AND state IN ('issued','claimed') AND (NEW.active=0 OR NEW.fenced=1);
        END;
        CREATE TRIGGER IF NOT EXISTS control_visibility_insert AFTER INSERT ON plan_task_visibility BEGIN
          INSERT INTO control_task_changes SELECT NEW.task_id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=NEW.task_id);
          UPDATE activation_grants SET state='fenced' WHERE task_id=NEW.task_id AND state IN ('issued','claimed') AND (NEW.active=0 OR NEW.fenced=1);
        END;
        CREATE TRIGGER IF NOT EXISTS control_attempt_fence AFTER UPDATE ON task_attempts
        WHEN json_extract(NEW.payload,'$.state') IN ('fenced','failed') BEGIN
          UPDATE activation_grants SET state='fenced' WHERE task_id=NEW.task_id AND state IN ('issued','claimed');
        END;
        DROP TRIGGER IF EXISTS control_grant_fence;
        CREATE TRIGGER control_grant_fence AFTER UPDATE OF state ON activation_grants
        WHEN NEW.state='fenced' AND OLD.state IN ('issued','claimed') BEGIN
          UPDATE agent_runs SET state='fenced' WHERE grant_id=NEW.id AND state IN ('candidate','active','waiting');
          UPDATE budget_reservations SET spent=0,state='settled' WHERE id=NEW.id AND OLD.state='issued';
        END;
        CREATE TRIGGER IF NOT EXISTS control_dependency_insert AFTER INSERT ON task_dependencies BEGIN
          INSERT INTO control_task_changes SELECT NEW.task_id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=NEW.task_id);
        END;
        CREATE TRIGGER IF NOT EXISTS control_dependency_delete AFTER DELETE ON task_dependencies BEGIN
          INSERT INTO control_task_changes SELECT OLD.task_id WHERE NOT EXISTS(SELECT 1 FROM control_task_changes WHERE task_id=OLD.task_id);
        END;
      `)
      for (const table of COLLECTIONS) host.db.exec(`CREATE TABLE IF NOT EXISTS ${table}(id TEXT NOT NULL,version INTEGER NOT NULL,hash TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(id,version));
        CREATE TRIGGER IF NOT EXISTS ${table}_immutable_update BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(ABORT,'Immutable version'); END;
        CREATE TRIGGER IF NOT EXISTS ${table}_immutable_delete BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT,'Immutable version'); END;`)
      host.db.exec(`CREATE TRIGGER IF NOT EXISTS evidence_expiration_insert AFTER INSERT ON evidence_versions
        WHEN json_extract(NEW.payload,'$.expiresAt') IS NOT NULL BEGIN
          INSERT OR IGNORE INTO evidence_expirations(id,version,expires_at) VALUES(NEW.id,NEW.version,json_extract(NEW.payload,'$.expiresAt'));
        END;
        INSERT OR IGNORE INTO evidence_expirations(id,version,expires_at) SELECT id,version,json_extract(payload,'$.expiresAt') FROM evidence_versions WHERE json_extract(payload,'$.expiresAt') IS NOT NULL;
        CREATE TRIGGER IF NOT EXISTS cognitive_reference_insert AFTER INSERT ON cognitive_records BEGIN
          INSERT OR IGNORE INTO cognitive_references SELECT NEW.id,NEW.version,'evidence',json_extract(value,'$.id'),json_extract(value,'$.version') FROM json_each(NEW.payload,'$.evidenceIndex');
          INSERT OR IGNORE INTO cognitive_references SELECT NEW.id,NEW.version,'assumption',json_extract(value,'$.id'),json_extract(value,'$.version') FROM json_each(NEW.payload,'$.assumptions');
          INSERT OR IGNORE INTO cognitive_references VALUES(NEW.id,NEW.version,'policy',json_extract(NEW.payload,'$.policy.id'),json_extract(NEW.payload,'$.policy.version'));
          INSERT OR IGNORE INTO cognitive_references SELECT NEW.id,NEW.version,'decision',json_extract(value,'$.entityId'),json_extract(value,'$.version') FROM json_each(NEW.payload,'$.dependencyVersion') WHERE json_extract(value,'$.port')='conclusion' AND json_extract(value,'$.view')='decision';
        END;
        INSERT OR IGNORE INTO cognitive_references SELECT c.id,c.version,'evidence',json_extract(j.value,'$.id'),json_extract(j.value,'$.version') FROM cognitive_records c,json_each(c.payload,'$.evidenceIndex') j;
        INSERT OR IGNORE INTO cognitive_references SELECT c.id,c.version,'assumption',json_extract(j.value,'$.id'),json_extract(j.value,'$.version') FROM cognitive_records c,json_each(c.payload,'$.assumptions') j;
        INSERT OR IGNORE INTO cognitive_references SELECT id,version,'policy',json_extract(payload,'$.policy.id'),json_extract(payload,'$.policy.version') FROM cognitive_records;`)
      host.db.exec(`CREATE TRIGGER IF NOT EXISTS cognitive_decision_reference_insert AFTER INSERT ON cognitive_records BEGIN
        INSERT OR IGNORE INTO cognitive_references SELECT NEW.id,NEW.version,'decision',json_extract(value,'$.entityId'),json_extract(value,'$.version') FROM json_each(NEW.payload,'$.dependencyVersion') WHERE json_extract(value,'$.port')='conclusion' AND json_extract(value,'$.view')='decision';
      END;
      INSERT OR IGNORE INTO cognitive_references SELECT c.id,c.version,'decision',json_extract(j.value,'$.entityId'),json_extract(j.value,'$.version') FROM cognitive_records c,json_each(c.payload,'$.dependencyVersion') j WHERE json_extract(j.value,'$.port')='conclusion' AND json_extract(j.value,'$.view')='decision';`)
      host.db.exec(`CREATE TRIGGER IF NOT EXISTS boundary_members_insert AFTER INSERT ON planning_boundaries BEGIN
        INSERT OR IGNORE INTO planning_boundary_members SELECT NEW.id,NEW.version,value FROM json_each(NEW.payload,'$.members');
      END;
      INSERT OR IGNORE INTO planning_boundary_members SELECT b.id,b.version,j.value FROM planning_boundaries b,json_each(b.payload,'$.members') j;`)
      host.db.exec(`CREATE TRIGGER IF NOT EXISTS causal_version_update BEFORE UPDATE ON causal_edge_versions BEGIN SELECT RAISE(ABORT,'Immutable edge'); END;
        CREATE TRIGGER IF NOT EXISTS causal_version_delete BEFORE DELETE ON causal_edge_versions BEGIN SELECT RAISE(ABORT,'Immutable edge'); END;`)
      const version = Number(host.db.prepare("SELECT max(version) AS version FROM control_schema").get()?.version ?? 0)
      if (version > 1) throw new Error("Unsupported control schema; old writers are not allowed")
      if (!version) host.db.prepare("INSERT INTO control_schema VALUES(1,?)").run(Date.now())
    })
  }
  get db() { return this.host.db }
  atomic<T>(fn: () => T): T { return this.host.transaction(fn) }
  put<T>(collection: Collection, id: string, version: number, value: T): void {
    if (!COLLECTIONS.includes(collection) || !id.trim() || !Number.isSafeInteger(version) || version < 1) throw new Error("Invalid version identity")
    const payload = canonical(value), hash = digest(value)
    const prior = this.db.prepare(`SELECT hash FROM ${collection} WHERE id=? AND version=?`).get(id, version)
    if (prior) { if (prior.hash !== hash) throw new Error(`Immutable version conflict: ${collection}/${id}@${version}`); return }
    this.db.prepare(`INSERT INTO ${collection} VALUES(?,?,?,?)`).run(id, version, hash, payload)
  }
  get<T>(collection: Collection, id: string, version: number): T | undefined {
    if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection")
    const row = this.db.prepare(`SELECT payload,hash FROM ${collection} WHERE id=? AND version=?`).get(id, version)
    if (!row) return undefined
    const value = JSON.parse(String(row.payload)) as T
    if (digest(value) !== row.hash) throw new Error("Version integrity failure")
    return value
  }
  head(collection: Collection, id: string): number {
    return Number(this.db.prepare("SELECT version FROM control_heads WHERE collection=? AND id=?").get(collection, id)?.version ?? 0)
  }
  advance(collection: Collection, id: string, expected: number, version: number): void {
    this.atomic(() => {
      if (this.head(collection, id) !== expected) throw new Error("Stale version head")
      if (!this.get(collection,id,version)) throw new Error("Unknown target version")
      this.db.prepare("INSERT INTO control_heads VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET version=excluded.version").run(collection,id,version)
    })
  }
  event(event: SystemEvent): void {
    if (!event.id || !event.entityId || !event.correlationId || !event.type || event.schemaVersion !== 1 || !Number.isFinite(event.timestamp)) throw new Error("Invalid event envelope")
    const payload = canonical(event)
    const prior = this.db.prepare("SELECT payload FROM event_outbox WHERE id=?").get(event.id)
    if (prior) { if (prior.payload !== payload) throw new Error("Event identity conflict"); return }
    if (event.causationId && !this.db.prepare("SELECT 1 FROM event_outbox WHERE id=?").get(event.causationId)) throw new Error("Unknown causation event")
    this.db.prepare("INSERT INTO event_outbox(id,type,entity_id,correlation_id,payload) VALUES(?,?,?,?,?)").run(event.id,event.type,event.entityId,event.correlationId,payload)
  }
  consume(consumer: string, policy: string, apply: (event: SystemEvent) => void, limit = 100): number {
    if (!consumer || !policy || !Number.isSafeInteger(limit) || limit < 1) throw new Error("Invalid consumer")
    let count=0
    while (count < limit) {
      const done=this.atomic(() => {
        const cursor=Number(this.db.prepare("SELECT sequence FROM event_consumers WHERE id=?").get(consumer)?.sequence ?? 0)
        const row=this.db.prepare("SELECT sequence,id,payload FROM event_outbox WHERE sequence>? ORDER BY sequence LIMIT 1").get(cursor)
        if (!row) return false
        if (!this.db.prepare("SELECT 1 FROM event_effects WHERE consumer_id=? AND event_id=? AND policy_version=?").get(consumer,String(row.id),policy)) {
          apply(JSON.parse(String(row.payload)))
          this.db.prepare("INSERT INTO event_effects VALUES(?,?,?)").run(consumer,String(row.id),policy)
        }
        this.db.prepare("INSERT INTO event_consumers VALUES(?,?) ON CONFLICT(id) DO UPDATE SET sequence=excluded.sequence").run(consumer,Number(row.sequence))
        return true
      })
      if (!done) break
      count++
    }
    return count
  }
}
