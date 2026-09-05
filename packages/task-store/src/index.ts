import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type {
  Artifact,
  ArtifactVersion,
  ArtifactVersionRef,
  IntegrationRun,
  IntegrationScenario,
  IntegrationSet,
  Learning,
  Requirement,
  Role,
  Task,
  TaskContract,
  TaskGraphEvent,
  VerifiedBundle,
} from "#task-domain"

interface Row { [key: string]: unknown }

export class TaskGraphStore {
  private db: DatabaseSync
  private transactionDepth = 0

  constructor(filename = ":memory:") {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true })
    this.db = new DatabaseSync(filename)
    this.db.exec("PRAGMA busy_timeout = 10000")
    this.db.exec("PRAGMA foreign_keys = ON")
    this.db.exec("PRAGMA journal_mode = WAL")
    this.migrate()
  }

  close(): void {
    this.db.close()
  }

  transaction<T>(operation: () => T): T {
    const depth = this.transactionDepth++
    const savepoint = `task_tx_${depth}`
    try {
      this.db.exec(depth === 0 ? "BEGIN IMMEDIATE" : `SAVEPOINT ${savepoint}`)
      try {
        const result = operation()
        if (result instanceof Promise) throw new Error("Transactions must be synchronous")
        this.db.exec(depth === 0 ? "COMMIT" : `RELEASE ${savepoint}`)
        return result
      } catch (error) {
        this.db.exec(depth === 0 ? "ROLLBACK" : `ROLLBACK TO ${savepoint}`)
        if (depth > 0) this.db.exec(`RELEASE ${savepoint}`)
        throw error
      }
    } finally {
      this.transactionDepth--
    }
  }

  bindOwner(issuer: string, subject: string): void {
    if (!issuer.trim() || !subject.trim()) throw new Error("Owner identity is required")
    this.transaction(() => {
      const owner = this.db.prepare("SELECT issuer, subject FROM service_owner WHERE id = 1").get()
      if (owner && (owner.issuer !== issuer || owner.subject !== subject)) throw new Error("Database belongs to another owner; refusing to reassign it")
      if (!owner) this.db.prepare("INSERT INTO service_owner (id, issuer, subject) VALUES (1, ?, ?)").run(issuer, subject)
    })
  }

  insertTask(task: Task): void {
    this.db.prepare(`
      INSERT INTO tasks (id, parent_id, title, goal, category, status, acceptance_criteria_json, context_policy_json,
        input_artifact_refs_json, output_artifact_refs_json, contract_refs_json, assigned_role, integration_policy, status_reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id, task.parentId ?? null, task.title, task.goal, task.category, task.status,
      JSON.stringify(task.acceptanceCriteria), JSON.stringify(task.contextPolicy),
      JSON.stringify(task.inputArtifactRefs), JSON.stringify(task.outputArtifactRefs), JSON.stringify(task.contractRefs),
      task.assignedRole ?? null, task.integrationPolicy ?? null, task.statusReason ?? null, task.createdAt, task.updatedAt,
    )
  }

  updateTask(task: Task): void {
    this.db.prepare(`
      UPDATE tasks SET parent_id = ?, title = ?, goal = ?, category = ?, status = ?, acceptance_criteria_json = ?, context_policy_json = ?,
        input_artifact_refs_json = ?, output_artifact_refs_json = ?, contract_refs_json = ?, assigned_role = ?, integration_policy = ?, status_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(
      task.parentId ?? null, task.title, task.goal, task.category, task.status,
      JSON.stringify(task.acceptanceCriteria), JSON.stringify(task.contextPolicy),
      JSON.stringify(task.inputArtifactRefs), JSON.stringify(task.outputArtifactRefs), JSON.stringify(task.contractRefs),
      task.assignedRole ?? null, task.integrationPolicy ?? null, task.statusReason ?? null, task.updatedAt, task.id,
    )
  }

  findTask(id: string): Task | undefined {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Row | undefined
    return row ? this.toTask(row) : undefined
  }

  searchTasks(query: string, limit: number): Task[] {
    if (!query) {
      return (this.db.prepare("SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?").all(limit) as Row[]).map((row) => this.toTask(row))
    }
    const terms = [...new Set([query, ...query.split(/\s+/).filter((term) => term.length > 1)])]
    const patterns = terms.map((term) => `%${escapeLike(term)}%`)
    const clauses = terms.map(() => "(title LIKE ? ESCAPE '\\' COLLATE NOCASE OR goal LIKE ? ESCAPE '\\' COLLATE NOCASE)").join(" OR ")
    const matchArgs = patterns.flatMap((pattern) => [pattern, pattern])
    return (this.db.prepare(`
      SELECT * FROM tasks
      WHERE ${clauses}
      ORDER BY CASE WHEN title LIKE ? ESCAPE '\\' COLLATE NOCASE THEN 0 ELSE 1 END, updated_at DESC
      LIMIT ?
    `).all(...matchArgs, patterns[0]!, limit) as Row[]).map((row) => this.toTask(row))
  }

  childTaskIds(taskId: string): string[] {
    return (this.db.prepare("SELECT id FROM tasks WHERE parent_id = ? ORDER BY created_at, rowid").all(taskId) as Row[]).map((row) => String(row.id))
  }

  childTasks(taskId: string): Task[] {
    return (this.db.prepare("SELECT * FROM tasks WHERE parent_id = ? ORDER BY created_at, rowid").all(taskId) as Row[]).map((row) => this.toTask(row))
  }

  addDependency(taskId: string, dependsOnTaskId: string, createdAt: string): void {
    this.db.prepare("INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_task_id, created_at) VALUES (?, ?, ?)").run(taskId, dependsOnTaskId, createdAt)
  }

  dependencyIds(taskId: string): string[] {
    return (this.db.prepare("SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ? ORDER BY rowid").all(taskId) as Row[]).map((row) => String(row.depends_on_task_id))
  }

  dependentIds(taskId: string): string[] {
    return (this.db.prepare("SELECT task_id FROM task_dependencies WHERE depends_on_task_id = ? ORDER BY rowid").all(taskId) as Row[]).map((row) => String(row.task_id))
  }

  allDependencies(): Array<{ taskId: string; dependsOnTaskId: string }> {
    return (this.db.prepare("SELECT task_id, depends_on_task_id FROM task_dependencies").all() as Row[])
      .map((row) => ({ taskId: String(row.task_id), dependsOnTaskId: String(row.depends_on_task_id) }))
  }

  insertRequirement(requirement: Requirement): void {
    this.db.prepare(`
      INSERT INTO task_requirements (id, task_id, description, kind, version, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(requirement.id, requirement.taskId, requirement.description, requirement.kind, requirement.version, requirement.status, requirement.createdAt)
  }

  updateRequirement(requirement: Requirement): void {
    this.db.prepare("UPDATE task_requirements SET description = ?, kind = ?, version = ?, status = ? WHERE id = ?")
      .run(requirement.description, requirement.kind, requirement.version, requirement.status, requirement.id)
  }

  findRequirement(id: string): Requirement | undefined {
    const row = this.db.prepare("SELECT * FROM task_requirements WHERE id = ?").get(id) as Row | undefined
    return row ? toRequirement(row) : undefined
  }

  requirementsOf(taskIds: string[]): Requirement[] {
    if (taskIds.length === 0) return []
    const placeholders = taskIds.map(() => "?").join(", ")
    return (this.db.prepare(`SELECT * FROM task_requirements WHERE task_id IN (${placeholders}) ORDER BY created_at, rowid`).all(...taskIds) as Row[]).map(toRequirement)
  }

  insertArtifact(artifact: Artifact): void {
    this.db.prepare("INSERT INTO artifacts (id, name, type, latest_version, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(artifact.id, artifact.name, artifact.type, artifact.latestVersion, artifact.createdAt)
  }

  updateArtifactLatest(artifactId: string, latestVersion: number): void {
    this.db.prepare("UPDATE artifacts SET latest_version = ? WHERE id = ?").run(latestVersion, artifactId)
  }

  findArtifact(id: string): Artifact | undefined {
    const row = this.db.prepare("SELECT * FROM artifacts WHERE id = ?").get(id) as Row | undefined
    return row ? toArtifact(row) : undefined
  }

  findArtifactByName(name: string): Artifact | undefined {
    const row = this.db.prepare("SELECT * FROM artifacts WHERE name = ?").get(name) as Row | undefined
    return row ? toArtifact(row) : undefined
  }

  insertArtifactVersion(version: ArtifactVersion): void {
    this.db.prepare(`
      INSERT INTO artifact_versions (artifact_id, version, type, producer_task_id, contract_version_refs_json, content_ref, content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      version.artifactId, version.version, version.type, version.producerTaskId,
      JSON.stringify(version.contractVersionRefs), version.contentRef, version.content ?? null, version.status, version.createdAt,
    )
    for (const input of version.inputs) {
      this.db.prepare("INSERT INTO artifact_lineage (artifact_id, version, input_artifact_id, input_version) VALUES (?, ?, ?, ?)")
        .run(version.artifactId, version.version, input.artifactId, input.version)
    }
  }

  findArtifactVersion(artifactId: string, version: number): ArtifactVersion | undefined {
    const row = this.db.prepare("SELECT * FROM artifact_versions WHERE artifact_id = ? AND version = ?").get(artifactId, version) as Row | undefined
    return row ? this.toArtifactVersion(row) : undefined
  }

  artifactVersions(artifactId: string): ArtifactVersion[] {
    return (this.db.prepare("SELECT * FROM artifact_versions WHERE artifact_id = ? ORDER BY version").all(artifactId) as Row[]).map((row) => this.toArtifactVersion(row))
  }

  markArtifactVersionStale(artifactId: string, version: number): void {
    this.db.prepare("UPDATE artifact_versions SET status = 'stale' WHERE artifact_id = ? AND version = ?").run(artifactId, version)
  }

  lineageDependents(artifactId: string, version: number): ArtifactVersionRef[] {
    return (this.db.prepare("SELECT artifact_id, version FROM artifact_lineage WHERE input_artifact_id = ? AND input_version = ?").all(artifactId, version) as Row[])
      .map((row) => ({ artifactId: String(row.artifact_id), version: Number(row.version) }))
  }

  lineageInputs(artifactId: string, version: number): ArtifactVersionRef[] {
    return (this.db.prepare("SELECT input_artifact_id, input_version FROM artifact_lineage WHERE artifact_id = ? AND version = ?").all(artifactId, version) as Row[])
      .map((row) => ({ artifactId: String(row.input_artifact_id), version: Number(row.input_version) }))
  }

  insertContract(contract: TaskContract): void {
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO contracts (id, provider_task_id, consumer_task_id, latest_version, created_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET latest_version = excluded.latest_version
      `).run(contract.id, contract.providerTaskId, contract.consumerTaskId, contract.version, contract.createdAt)
      this.db.prepare(`
        INSERT INTO contract_versions (contract_id, version, provides_json, expects_json, invariants_json, compatibility_checks_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        contract.id, contract.version, JSON.stringify(contract.provides), JSON.stringify(contract.expects),
        JSON.stringify(contract.invariants), JSON.stringify(contract.compatibilityChecks), contract.createdAt,
      )
    })
  }

  findContract(id: string, version?: number): TaskContract | undefined {
    const head = this.db.prepare("SELECT * FROM contracts WHERE id = ?").get(id) as Row | undefined
    if (!head) return undefined
    const selected = version ?? Number(head.latest_version)
    const row = this.db.prepare("SELECT * FROM contract_versions WHERE contract_id = ? AND version = ?").get(id, selected) as Row | undefined
    if (!row) return undefined
    return {
      id,
      providerTaskId: String(head.provider_task_id),
      consumerTaskId: String(head.consumer_task_id),
      provides: parseJson(row.provides_json) ?? [],
      expects: parseJson(row.expects_json) ?? [],
      invariants: parseJson(row.invariants_json) ?? [],
      compatibilityChecks: parseJson(row.compatibility_checks_json) ?? [],
      version: Number(row.version),
      createdAt: String(row.created_at),
    }
  }

  contractsFor(taskId: string): TaskContract[] {
    return (this.db.prepare("SELECT id FROM contracts WHERE provider_task_id = ? OR consumer_task_id = ? ORDER BY created_at, rowid").all(taskId, taskId) as Row[])
      .map((row) => this.findContract(String(row.id))!)
  }

  contractsByProvider(taskId: string): TaskContract[] {
    return (this.db.prepare("SELECT id FROM contracts WHERE provider_task_id = ? ORDER BY created_at, rowid").all(taskId) as Row[])
      .map((row) => this.findContract(String(row.id))!)
  }

  insertIntegrationSet(set: IntegrationSet): void {
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO integration_sets (id, name, parent_task_id, policy, status, output_bundle_artifact_id, output_bundle_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(set.id, set.name, set.parentTaskId ?? null, set.policy, set.status, set.outputBundleRef?.artifactId ?? null, set.outputBundleRef?.version ?? null, set.createdAt, set.updatedAt)
      this.replaceIntegrationMembers(set.id, set.memberRefs)
    })
  }

  updateIntegrationSet(set: IntegrationSet): void {
    this.transaction(() => {
      this.db.prepare(`
        UPDATE integration_sets SET name = ?, parent_task_id = ?, policy = ?, status = ?, output_bundle_artifact_id = ?, output_bundle_version = ?, updated_at = ?
        WHERE id = ?
      `).run(set.name, set.parentTaskId ?? null, set.policy, set.status, set.outputBundleRef?.artifactId ?? null, set.outputBundleRef?.version ?? null, set.updatedAt, set.id)
      this.replaceIntegrationMembers(set.id, set.memberRefs)
    })
  }

  private replaceIntegrationMembers(setId: string, members: ArtifactVersionRef[]): void {
    this.db.prepare("DELETE FROM integration_members WHERE integration_set_id = ?").run(setId)
    for (const member of members) {
      this.db.prepare("INSERT INTO integration_members (integration_set_id, artifact_id, version) VALUES (?, ?, ?)").run(setId, member.artifactId, member.version)
    }
  }

  findIntegrationSet(id: string): IntegrationSet | undefined {
    const row = this.db.prepare("SELECT * FROM integration_sets WHERE id = ?").get(id) as Row | undefined
    return row ? this.toIntegrationSet(row) : undefined
  }

  findIntegrationSetByName(name: string): IntegrationSet | undefined {
    const row = this.db.prepare("SELECT * FROM integration_sets WHERE name = ?").get(name) as Row | undefined
    return row ? this.toIntegrationSet(row) : undefined
  }

  integrationSets(): IntegrationSet[] {
    return (this.db.prepare("SELECT * FROM integration_sets ORDER BY created_at, rowid").all() as Row[]).map((row) => this.toIntegrationSet(row))
  }

  integrationSetsByMember(artifactId: string): IntegrationSet[] {
    return (this.db.prepare(`
      SELECT DISTINCT s.* FROM integration_sets s JOIN integration_members m ON m.integration_set_id = s.id
      WHERE m.artifact_id = ? ORDER BY s.created_at
    `).all(artifactId) as Row[]).map((row) => this.toIntegrationSet(row))
  }

  integrationSetsByParent(taskId: string): IntegrationSet[] {
    return (this.db.prepare("SELECT * FROM integration_sets WHERE parent_task_id = ? ORDER BY created_at, rowid").all(taskId) as Row[]).map((row) => this.toIntegrationSet(row))
  }

  insertScenario(scenario: IntegrationScenario): void {
    this.db.prepare(`
      INSERT INTO integration_scenarios (id, integration_set_id, name, version, participant_refs_json, requirement_ids_json, fixture_refs_json, expected_behavior_json, result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scenario.id, scenario.integrationSetId, scenario.name, scenario.version,
      JSON.stringify(scenario.participantRefs), JSON.stringify(scenario.requirementIds), JSON.stringify(scenario.fixtureRefs),
      JSON.stringify(scenario.expectedBehavior), scenario.result ? JSON.stringify(scenario.result) : null, scenario.createdAt,
    )
  }

  updateScenario(scenario: IntegrationScenario): void {
    this.db.prepare(`
      UPDATE integration_scenarios SET name = ?, version = ?, participant_refs_json = ?, requirement_ids_json = ?, fixture_refs_json = ?, expected_behavior_json = ?, result_json = ?
      WHERE id = ?
    `).run(
      scenario.name, scenario.version, JSON.stringify(scenario.participantRefs), JSON.stringify(scenario.requirementIds),
      JSON.stringify(scenario.fixtureRefs), JSON.stringify(scenario.expectedBehavior), scenario.result ? JSON.stringify(scenario.result) : null, scenario.id,
    )
  }

  findScenario(id: string): IntegrationScenario | undefined {
    const row = this.db.prepare("SELECT * FROM integration_scenarios WHERE id = ?").get(id) as Row | undefined
    return row ? toScenario(row) : undefined
  }

  scenariosOf(integrationSetId: string): IntegrationScenario[] {
    return (this.db.prepare("SELECT * FROM integration_scenarios WHERE integration_set_id = ? ORDER BY created_at, rowid").all(integrationSetId) as Row[]).map(toScenario)
  }

  insertIntegrationRun(run: IntegrationRun): void {
    this.db.prepare(`
      INSERT INTO integration_runs (id, integration_set_id, integration_key, member_refs_json, scenario_results_json, status, failure_json, started_at, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      run.id, run.integrationSetId, run.integrationKey, JSON.stringify(run.memberRefs), JSON.stringify(run.scenarioResults),
      run.status, run.failure ? JSON.stringify(run.failure) : null, run.startedAt, run.finishedAt ?? null,
    )
  }

  updateIntegrationRun(run: IntegrationRun): void {
    this.db.prepare(`
      UPDATE integration_runs SET scenario_results_json = ?, status = ?, failure_json = ?, finished_at = ? WHERE id = ?
    `).run(JSON.stringify(run.scenarioResults), run.status, run.failure ? JSON.stringify(run.failure) : null, run.finishedAt ?? null, run.id)
  }

  findIntegrationRun(id: string): IntegrationRun | undefined {
    const row = this.db.prepare("SELECT * FROM integration_runs WHERE id = ?").get(id) as Row | undefined
    return row ? toRun(row) : undefined
  }

  passedRunByKey(integrationKey: string): IntegrationRun | undefined {
    const row = this.db.prepare("SELECT * FROM integration_runs WHERE integration_key = ? AND status = 'passed' ORDER BY started_at DESC LIMIT 1").get(integrationKey) as Row | undefined
    return row ? toRun(row) : undefined
  }

  runsOf(integrationSetId: string): IntegrationRun[] {
    return (this.db.prepare("SELECT * FROM integration_runs WHERE integration_set_id = ? ORDER BY started_at, rowid").all(integrationSetId) as Row[]).map(toRun)
  }

  failedRunsTouching(taskId: string): IntegrationRun[] {
    return (this.db.prepare("SELECT * FROM integration_runs WHERE status = 'failed' ORDER BY started_at, rowid").all() as Row[])
      .map(toRun)
      .filter((run) => run.failure?.affectedTaskIds.includes(taskId))
  }

  insertBundle(bundle: VerifiedBundle): void {
    this.db.prepare(`
      INSERT INTO verified_bundles (artifact_id, version, integration_set_id, integration_run_id, member_refs_json, scenario_version_refs_json,
        contract_version_refs_json, architecture_ref_json, requirement_ref_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bundle.artifactId, bundle.version, bundle.integrationSetId, bundle.integrationRunId,
      JSON.stringify(bundle.memberRefs), JSON.stringify(bundle.scenarioVersionRefs), JSON.stringify(bundle.contractVersionRefs),
      bundle.architectureVersionRef ? JSON.stringify(bundle.architectureVersionRef) : null,
      bundle.requirementVersionRef ? JSON.stringify(bundle.requirementVersionRef) : null,
      bundle.status, bundle.createdAt,
    )
  }

  findBundle(artifactId: string, version: number): VerifiedBundle | undefined {
    const row = this.db.prepare("SELECT * FROM verified_bundles WHERE artifact_id = ? AND version = ?").get(artifactId, version) as Row | undefined
    return row ? toBundle(row) : undefined
  }

  bundlesBySet(integrationSetId: string): VerifiedBundle[] {
    return (this.db.prepare("SELECT * FROM verified_bundles WHERE integration_set_id = ? ORDER BY version").all(integrationSetId) as Row[]).map(toBundle)
  }

  validBundles(): VerifiedBundle[] {
    return (this.db.prepare("SELECT * FROM verified_bundles WHERE status = 'valid' ORDER BY created_at, rowid").all() as Row[]).map(toBundle)
  }

  markBundleStale(artifactId: string, version: number): void {
    this.db.prepare("UPDATE verified_bundles SET status = 'stale' WHERE artifact_id = ? AND version = ?").run(artifactId, version)
  }

  upsertRole(role: Role): void {
    this.db.prepare(`
      INSERT INTO roles (id, name, description, principles_json, capabilities_json, allowed_tools_json, constraints_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, principles_json = excluded.principles_json,
        capabilities_json = excluded.capabilities_json, allowed_tools_json = excluded.allowed_tools_json, constraints_json = excluded.constraints_json
    `).run(role.id, role.name, role.description, JSON.stringify(role.principles), JSON.stringify(role.capabilities), JSON.stringify(role.allowedTools), JSON.stringify(role.constraints))
  }

  findRole(id: string): Role | undefined {
    const row = this.db.prepare("SELECT * FROM roles WHERE id = ?").get(id) as Row | undefined
    return row ? toRole(row) : undefined
  }

  listRoles(): Role[] {
    return (this.db.prepare("SELECT * FROM roles ORDER BY id").all() as Row[]).map(toRole)
  }

  rootTasks(): Task[] {
    return (this.db.prepare("SELECT * FROM tasks WHERE parent_id IS NULL ORDER BY created_at, rowid").all() as Row[]).map((row) => this.toTask(row))
  }

  insertLearning(learning: Learning): void {
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO learnings (id, source_task_id, source_run_id, kind, description, tags_json, importance, applied_count,
          status, superseded_by, superseded_at, invalid_from, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        learning.id, learning.sourceTaskId ?? null, learning.sourceRunId ?? null, learning.kind, learning.description,
        JSON.stringify(learning.tags), learning.importance, learning.appliedCount,
        learning.status, learning.supersededBy ?? null, learning.supersededAt ?? null, learning.invalidFrom ?? null, learning.createdAt,
      )
      const text = learning.tags.join(" ")
      this.db.prepare("INSERT INTO learnings_fts (id, description, tags) VALUES (?, ?, ?)").run(learning.id, learning.description, text)
      this.db.prepare("INSERT INTO learnings_fts_tri (id, description, tags) VALUES (?, ?, ?)").run(learning.id, learning.description, text)
    })
  }

  findLearning(id: string): Learning | undefined {
    const row = this.db.prepare("SELECT * FROM learnings WHERE id = ?").get(id) as Row | undefined
    return row ? toLearning(row) : undefined
  }

  allLearnings(): Learning[] {
    return (this.db.prepare("SELECT * FROM learnings ORDER BY created_at DESC, rowid DESC").all() as Row[]).map(toLearning)
  }

  activeLearnings(): Learning[] {
    return (this.db.prepare("SELECT * FROM learnings WHERE status = 'active' ORDER BY created_at DESC, rowid DESC").all() as Row[]).map(toLearning)
  }

  learningsBySourceTask(taskId: string): Learning[] {
    return (this.db.prepare("SELECT * FROM learnings WHERE source_task_id = ? ORDER BY created_at, rowid").all(taskId) as Row[]).map(toLearning)
  }

  matchLearnings(matchQuery: string, variant: "word" | "trigram"): string[] {
    const table = variant === "word" ? "learnings_fts" : "learnings_fts_tri"
    try {
      return (this.db.prepare(`
        SELECT l.id FROM ${table} f JOIN learnings l ON l.id = f.id
        WHERE ${table} MATCH ? AND l.status = 'active'
        ORDER BY bm25(${table}), l.created_at DESC
      `).all(matchQuery) as Row[]).map((row) => String(row.id))
    } catch {
      return []
    }
  }

  supersedeLearning(id: string, status: "superseded" | "retracted", supersededBy: string | undefined, supersededAt: string, invalidFrom?: string): void {
    this.db.prepare("UPDATE learnings SET status = ?, superseded_by = ?, superseded_at = ?, invalid_from = ? WHERE id = ?")
      .run(status, supersededBy ?? null, supersededAt, invalidFrom ?? null, id)
  }

  incrementLearningApplied(id: string): void {
    this.db.prepare("UPDATE learnings SET applied_count = applied_count + 1 WHERE id = ?").run(id)
  }

  lastEventOfType(type: string): TaskGraphEvent | undefined {
    const row = this.db.prepare("SELECT * FROM events WHERE type = ? ORDER BY rowid DESC LIMIT 1").get(type) as Row | undefined
    return row ? toEvent(row) : undefined
  }

  insertEvent(event: TaskGraphEvent): void {
    this.db.prepare("INSERT INTO events (id, type, task_id, refs_json, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(event.id, event.type, event.taskId ?? null, event.refs ? JSON.stringify(event.refs) : null, event.payload ? JSON.stringify(event.payload) : null, event.createdAt)
  }

  eventsFor(taskId: string, limit = 50): TaskGraphEvent[] {
    return (this.db.prepare("SELECT * FROM events WHERE task_id = ? ORDER BY rowid DESC LIMIT ?").all(taskId, limit) as Row[]).map(toEvent).reverse()
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_owner (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        issuer TEXT NOT NULL,
        subject TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES tasks(id),
        title TEXT NOT NULL,
        goal TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        acceptance_criteria_json TEXT NOT NULL,
        context_policy_json TEXT NOT NULL,
        input_artifact_refs_json TEXT NOT NULL,
        output_artifact_refs_json TEXT NOT NULL,
        contract_refs_json TEXT NOT NULL,
        assigned_role TEXT,
        integration_policy TEXT,
        status_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at DESC);

      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        PRIMARY KEY (task_id, depends_on_task_id)
      );
      CREATE INDEX IF NOT EXISTS idx_dependencies_target ON task_dependencies(depends_on_task_id);

      CREATE TABLE IF NOT EXISTS task_requirements (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        kind TEXT NOT NULL,
        version INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_requirements_task ON task_requirements(task_id);

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        latest_version INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS artifact_versions (
        artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        type TEXT NOT NULL,
        producer_task_id TEXT NOT NULL REFERENCES tasks(id),
        contract_version_refs_json TEXT NOT NULL,
        content_ref TEXT NOT NULL,
        content TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (artifact_id, version)
      );

      CREATE TABLE IF NOT EXISTS artifact_lineage (
        artifact_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        input_artifact_id TEXT NOT NULL,
        input_version INTEGER NOT NULL,
        PRIMARY KEY (artifact_id, version, input_artifact_id, input_version)
      );
      CREATE INDEX IF NOT EXISTS idx_lineage_input ON artifact_lineage(input_artifact_id, input_version);

      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        provider_task_id TEXT NOT NULL REFERENCES tasks(id),
        consumer_task_id TEXT NOT NULL REFERENCES tasks(id),
        latest_version INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contract_versions (
        contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        provides_json TEXT NOT NULL,
        expects_json TEXT NOT NULL,
        invariants_json TEXT NOT NULL,
        compatibility_checks_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (contract_id, version)
      );

      CREATE TABLE IF NOT EXISTS integration_sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        parent_task_id TEXT REFERENCES tasks(id),
        policy TEXT NOT NULL,
        status TEXT NOT NULL,
        output_bundle_artifact_id TEXT,
        output_bundle_version INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS integration_members (
        integration_set_id TEXT NOT NULL REFERENCES integration_sets(id) ON DELETE CASCADE,
        artifact_id TEXT NOT NULL REFERENCES artifacts(id),
        version INTEGER NOT NULL,
        PRIMARY KEY (integration_set_id, artifact_id)
      );
      CREATE INDEX IF NOT EXISTS idx_members_artifact ON integration_members(artifact_id);

      CREATE TABLE IF NOT EXISTS integration_scenarios (
        id TEXT PRIMARY KEY,
        integration_set_id TEXT NOT NULL REFERENCES integration_sets(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        version INTEGER NOT NULL,
        participant_refs_json TEXT NOT NULL,
        requirement_ids_json TEXT NOT NULL,
        fixture_refs_json TEXT NOT NULL,
        expected_behavior_json TEXT NOT NULL,
        result_json TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scenarios_set ON integration_scenarios(integration_set_id);

      CREATE TABLE IF NOT EXISTS integration_runs (
        id TEXT PRIMARY KEY,
        integration_set_id TEXT NOT NULL REFERENCES integration_sets(id) ON DELETE CASCADE,
        integration_key TEXT NOT NULL,
        member_refs_json TEXT NOT NULL,
        scenario_results_json TEXT NOT NULL,
        status TEXT NOT NULL,
        failure_json TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_runs_set ON integration_runs(integration_set_id);
      CREATE INDEX IF NOT EXISTS idx_runs_key ON integration_runs(integration_key);

      CREATE TABLE IF NOT EXISTS verified_bundles (
        artifact_id TEXT NOT NULL REFERENCES artifacts(id),
        version INTEGER NOT NULL,
        integration_set_id TEXT NOT NULL REFERENCES integration_sets(id),
        integration_run_id TEXT NOT NULL REFERENCES integration_runs(id),
        member_refs_json TEXT NOT NULL,
        scenario_version_refs_json TEXT NOT NULL,
        contract_version_refs_json TEXT NOT NULL,
        architecture_ref_json TEXT,
        requirement_ref_json TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (artifact_id, version)
      );
      CREATE INDEX IF NOT EXISTS idx_bundles_set ON verified_bundles(integration_set_id);

      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        principles_json TEXT NOT NULL,
        capabilities_json TEXT NOT NULL,
        allowed_tools_json TEXT NOT NULL,
        constraints_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learnings (
        id TEXT PRIMARY KEY,
        source_task_id TEXT REFERENCES tasks(id),
        source_run_id TEXT,
        kind TEXT NOT NULL,
        description TEXT NOT NULL,
        tags_json TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 5,
        applied_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        superseded_by TEXT,
        superseded_at TEXT,
        invalid_from TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_learnings_task ON learnings(source_task_id);
      CREATE INDEX IF NOT EXISTS idx_learnings_status ON learnings(status);

      CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(id UNINDEXED, description, tags, tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts_tri USING fts5(id UNINDEXED, description, tags, tokenize='trigram');

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        task_id TEXT,
        refs_json TEXT,
        payload_json TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_task ON events(task_id, created_at);
    `)
    const learningColumns = (this.db.prepare("PRAGMA table_info(learnings)").all() as Row[]).map((column) => String(column.name))
    const added: Array<[string, string]> = [
      ["importance", "INTEGER NOT NULL DEFAULT 5"],
      ["status", "TEXT NOT NULL DEFAULT 'active'"],
      ["superseded_by", "TEXT"],
      ["superseded_at", "TEXT"],
      ["invalid_from", "TEXT"],
    ]
    for (const [name, definition] of added) {
      if (!learningColumns.includes(name)) this.db.exec(`ALTER TABLE learnings ADD COLUMN ${name} ${definition}`)
    }
    for (const table of ["learnings_fts", "learnings_fts_tri"]) {
      this.db.exec(`
        INSERT INTO ${table} (id, description, tags)
        SELECT id, description, coalesce((SELECT group_concat(value, ' ') FROM json_each(tags_json)), '')
        FROM learnings WHERE id NOT IN (SELECT id FROM ${table})
      `)
    }
  }

  private toTask(row: Row): Task {
    const id = String(row.id)
    return {
      id,
      parentId: row.parent_id == null ? undefined : String(row.parent_id),
      title: String(row.title),
      goal: String(row.goal),
      category: String(row.category) as Task["category"],
      status: String(row.status) as Task["status"],
      childIds: this.childTaskIds(id),
      dependencies: this.dependencyIds(id),
      acceptanceCriteria: parseJson(row.acceptance_criteria_json) ?? [],
      contextPolicy: parseJson(row.context_policy_json),
      inputArtifactRefs: parseJson(row.input_artifact_refs_json) ?? [],
      outputArtifactRefs: parseJson(row.output_artifact_refs_json) ?? [],
      contractRefs: parseJson(row.contract_refs_json) ?? [],
      assignedRole: row.assigned_role == null ? undefined : String(row.assigned_role),
      integrationPolicy: row.integration_policy == null ? undefined : String(row.integration_policy) as Task["integrationPolicy"],
      statusReason: row.status_reason == null ? undefined : String(row.status_reason),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }
  }

  private toArtifactVersion(row: Row): ArtifactVersion {
    return {
      artifactId: String(row.artifact_id),
      version: Number(row.version),
      type: String(row.type) as ArtifactVersion["type"],
      producerTaskId: String(row.producer_task_id),
      inputs: this.lineageInputs(String(row.artifact_id), Number(row.version)),
      contractVersionRefs: parseJson(row.contract_version_refs_json) ?? [],
      contentRef: String(row.content_ref),
      content: row.content == null ? undefined : String(row.content),
      status: String(row.status) as ArtifactVersion["status"],
      createdAt: String(row.created_at),
    }
  }

  private toIntegrationSet(row: Row): IntegrationSet {
    const id = String(row.id)
    const members = (this.db.prepare("SELECT artifact_id, version FROM integration_members WHERE integration_set_id = ? ORDER BY rowid").all(id) as Row[])
      .map((member) => ({ artifactId: String(member.artifact_id), version: Number(member.version) }))
    const scenarioIds = (this.db.prepare("SELECT id FROM integration_scenarios WHERE integration_set_id = ? ORDER BY created_at, rowid").all(id) as Row[])
      .map((scenario) => String(scenario.id))
    return {
      id,
      name: String(row.name),
      parentTaskId: row.parent_task_id == null ? undefined : String(row.parent_task_id),
      memberRefs: members,
      scenarioIds,
      policy: String(row.policy) as IntegrationSet["policy"],
      status: String(row.status) as IntegrationSet["status"],
      outputBundleRef: row.output_bundle_artifact_id == null ? undefined : { artifactId: String(row.output_bundle_artifact_id), version: Number(row.output_bundle_version) },
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }
  }
}

function toRequirement(row: Row): Requirement {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    description: String(row.description),
    kind: String(row.kind) as Requirement["kind"],
    version: Number(row.version),
    status: String(row.status) as Requirement["status"],
    createdAt: String(row.created_at),
  }
}

function toArtifact(row: Row): Artifact {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type) as Artifact["type"],
    latestVersion: Number(row.latest_version),
    createdAt: String(row.created_at),
  }
}

function toScenario(row: Row): IntegrationScenario {
  return {
    id: String(row.id),
    integrationSetId: String(row.integration_set_id),
    name: String(row.name),
    participantRefs: parseJson(row.participant_refs_json) ?? [],
    requirementIds: parseJson(row.requirement_ids_json) ?? [],
    fixtureRefs: parseJson(row.fixture_refs_json) ?? [],
    expectedBehavior: parseJson(row.expected_behavior_json) ?? [],
    result: parseJson(row.result_json),
    version: Number(row.version),
    createdAt: String(row.created_at),
  }
}

function toRun(row: Row): IntegrationRun {
  return {
    id: String(row.id),
    integrationSetId: String(row.integration_set_id),
    integrationKey: String(row.integration_key),
    memberRefs: parseJson(row.member_refs_json) ?? [],
    scenarioResults: parseJson(row.scenario_results_json) ?? [],
    status: String(row.status) as IntegrationRun["status"],
    failure: parseJson(row.failure_json),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at == null ? undefined : String(row.finished_at),
  }
}

function toBundle(row: Row): VerifiedBundle {
  return {
    artifactId: String(row.artifact_id),
    version: Number(row.version),
    integrationSetId: String(row.integration_set_id),
    integrationRunId: String(row.integration_run_id),
    memberRefs: parseJson(row.member_refs_json) ?? [],
    scenarioVersionRefs: parseJson(row.scenario_version_refs_json) ?? [],
    contractVersionRefs: parseJson(row.contract_version_refs_json) ?? [],
    architectureVersionRef: parseJson(row.architecture_ref_json),
    requirementVersionRef: parseJson(row.requirement_ref_json),
    status: String(row.status) as VerifiedBundle["status"],
    createdAt: String(row.created_at),
  }
}

function toRole(row: Row): Role {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    principles: parseJson(row.principles_json) ?? [],
    capabilities: parseJson(row.capabilities_json) ?? [],
    allowedTools: parseJson(row.allowed_tools_json) ?? [],
    constraints: parseJson(row.constraints_json) ?? [],
  }
}

function toLearning(row: Row): Learning {
  return {
    id: String(row.id),
    sourceTaskId: row.source_task_id == null ? undefined : String(row.source_task_id),
    sourceRunId: row.source_run_id == null ? undefined : String(row.source_run_id),
    kind: String(row.kind) as Learning["kind"],
    description: String(row.description),
    tags: parseJson(row.tags_json) ?? [],
    importance: Number(row.importance ?? 5),
    appliedCount: Number(row.applied_count),
    status: String(row.status ?? "active") as Learning["status"],
    supersededBy: row.superseded_by == null ? undefined : String(row.superseded_by),
    supersededAt: row.superseded_at == null ? undefined : String(row.superseded_at),
    invalidFrom: row.invalid_from == null ? undefined : String(row.invalid_from),
    createdAt: String(row.created_at),
  }
}

function toEvent(row: Row): TaskGraphEvent {
  return {
    id: String(row.id),
    type: String(row.type) as TaskGraphEvent["type"],
    taskId: row.task_id == null ? undefined : String(row.task_id),
    refs: parseJson(row.refs_json),
    payload: parseJson(row.payload_json),
    createdAt: String(row.created_at),
  }
}

function parseJson(value: unknown): any {
  return typeof value === "string" ? JSON.parse(value) : undefined
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&")
}
