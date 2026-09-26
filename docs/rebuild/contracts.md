# 행동·데이터 계약

상태: 검토 초안 · 계약 집합: `task-agent/contract-draft-1`

이 문서의 MUST는 필수 조건, MAY는 허용되는 선택을 뜻한다. 출발점은 R1–R4이며 기존 구현은 근거로 사용하지 않는다. ID, digest, revision은 예시 이름이며 특정 언어·데이터베이스·실행 플랫폼을 강제하지 않는다.

## 1. 태스크는 결과 계약과 실행 설계를 가진다

### C01 — 실행 단위와 분해

- `Task`는 변하지 않는 논리적 식별자다. `TaskSpecRevision`은 특정 시점의 작업 정의이며 생성 후 수정하지 않는다.
- leaf는 **목적 하나, 출력 책임 하나, 경계가 정해진 입력, 독립 검증 방법**을 MUST 갖는다. 출력 책임 하나는 여러 파일·포트를 포함할 수 있다.
- 입력 계약은 무엇을 받아야 하는지, 출력 계약은 무엇을 보장해야 하는지 정의한다. 실행 설계는 그 계약을 어떻게 충족할지 정의한다. 설계를 작성하기 전에 참조하는 계약 revision이 존재해야 한다.
- `TaskGroup`은 목표를 분해한 집합이다. group은 실행 권한·attempt·쓰기 공간을 갖지 않는다. 자식이 모두 끝났다는 이유로 조합의 정확성을 추정하지 않는다.
- 둘 이상의 결과를 합쳐 확인해야 하면 별도 integration leaf를 둔다. group의 완료 조건은 필요한 leaf 결과와 integration 결과가 모두 현재 graph revision에서 유효하다는 것이다.
- 분해 제안은 leaf의 책임·입력·출력·검증을 제시해야 한다. 책임이 겹치거나 검증할 수 없는 설명만 있으면 활성화하지 않는다. 의미적 책임 검토 결과는 검토 증거로 기록한다.

### C02 — 불변 계약과 정확한 바인딩

필수 객체는 다음과 같다. `Ref`는 논리 ID와 **정확한 revision 또는 digest**를 포함한다. 실행 중 `latest`를 해석하지 않는다.

```text
ContractRevision {
  contractId, revision, digest,
  purpose, inputShape, outputShape, invariants,
  validators: ValidatorRef[], compatibilityPolicy
}
TaskSpecRevision {
  taskId, revision, digest,
  objective, inputPorts: InputPort[], outputPorts: OutputPort[],
  design: { rationale, executionPlan, acceptance: ValidatorRef[] },
  workspaceTemplateRef, executionPolicyRef
}
InputPort  { name, contractRef, required: true }
OutputPort { name, contractRef }
ValidatorRef { id, revision, implementationDigest, configurationDigest }
GraphRevision {
  graphId, revision, baseRevision,
  specRefs: TaskSpecRef[], sources: SourceNode[], groups: TaskGroup[],
  membership, edges, completionTargets
}
Node = ExecutionLeaf | SourceNode | TaskGroup
SourceNode { sourceId, artifactRefs, registrationEvidenceRef }
TaskGroup { groupId, objective, requiredResultRefs, requiredIntegrationRefs }
```

- `inputShape/outputShape`는 매체별 구조를 지정한다. JSON은 schema, 코드·파일 집합은 manifest·경로·형식과 실행 검증으로 표현할 수 있다. 자유 텍스트만 있는 보장은 독립 검증 방법을 별도로 MUST 가진다.
- TaskSpec의 각 포트와 graph의 binding은 같은 정확한 계약 revision을 참조해야 한다. 다른 계약을 연결하려면 명시적인 변환 leaf를 둔다. 암묵적 타입 변환은 없다.
- 실행 설계는 argv 또는 버전된 harness 실행 정의, 단계별 입력, 체크포인트 방식, 검증기, 자원·권한 요구를 담는다. secret 값은 명세에 넣지 않고 접근 권한이 있는 secret reference를 사용한다.
- digest는 canonical encoding과 알고리즘 버전을 함께 고정하여 계산한다. 필드 순서·비의미적 메타데이터는 작업의 의미를 바꾸지 않는다. 목적·계약·실행 설계·환경·정책의 의미적 변경은 새 spec revision이다.
- 출력 계약 revision의 숫자나 선언된 호환성만으로 결과 재사용을 승인하지 않는다. `C06`의 재사용 증거가 필요하다.

### C03 — 산출물과 성공 증거

```text
ArtifactManifest {
  artifactId, outputPort,
  origin: { taskSpecRef, attemptId } | { sourceId, registrationEvidenceRef },
  contractRef, contentDigest, immutableStorageRef,
  consumedInputs: InputSnapshot, validationEvidenceRefs
}
InputSnapshot {
  graphRevision, taskSpecRef,
  bindings: [{ inputPort, artifactRef, contractRef, contentDigest }],
  orderObligations: [{ predecessor, successor, completionEvidenceRef }],
  workspaceTemplateDigest, executionPolicyDigest, validatorRefs,
  provenanceDigest, semanticReuseKey
}
ValidationEvidence {
  evidenceId, validatorRef, validationRunId, trustedIssuer,
  validationEnvironmentDigest, subjectDigests, inputSnapshotDigest,
  outcome: passed | failed | inconclusive, immutableReportRef
}
AdoptionRecord {
  adoptionId, mode: fresh | reuse | revalidate,
  targetGraphRevision, targetTaskSpecRef, currentInputSnapshotRef,
  originalArtifactRefs, validationEvidenceRefs, equivalenceEvidenceRefs
}
```

- Artifact bytes, manifest, 검증 증거는 발표 후 MUST 불변이다. 소비자는 다른 태스크의 작업 중인 디렉터리를 입력으로 삼지 않는다.
- source artifact는 실행 attempt 대신 등록 주체·원본 출처·내용 검증 증거를 요구한다. source에는 실행 입력 snapshot이 없으므로 `consumedInputs`는 실행 생산물에만 필수다.
- 결과 유효성은 `(생산자, 출력 포트, artifactRef)`별로 기록한다. task 전체 성공은 모든 필수 출력과 검증을 만족해야 하며 특정 포트의 유효성을 task 전체 성공과 혼동하지 않는다.
- 출력은 모든 필수 포트에 대해 존재·형식·계약 검증을 통과해야 한다. 일부 출력만 통과하면 그 attempt를 성공으로 채택하지 않는다.
- 프로세스 종료 코드 0, runner Ready, 모델의 완료 선언은 업무 성공 증거를 대신하지 않는다.
- 새 실행 결과 채택 시 현재 spec, 입력 snapshot, fence, 검증기 버전, 취소·변경 여부를 같은 논리적 트랜잭션에서 다시 검사한다. 과거 결과 재사용은 별도의 AdoptionRecord와 현재 조건에 대한 동일성·재검증 증거를 요구한다.
- 증거는 허가된 검증 실행의 신원·환경·대상 snapshot과 결합되어야 한다. worker가 validator 명세를 복사해 제출한 JSON은 검증 증거로 인정하지 않는다. 검증 증거 발행 포트는 worker 권한에 포함하지 않는다.
- 성공은 `정확한 입력으로 실행 → writer 종료 확인 → 불변 산출물 확보 → 검증 통과 → 현재 graph에 채택`의 결과다. 이력에 존재하는 성공과 현재 graph에서 유효한 결과를 구분한다.
- integration leaf도 같은 계약을 따른다. 입력 조합 digest를 증거에 포함하여 다른 조합의 통과 결과를 재사용하지 않는다.

## 2. 그래프가 실행 순서와 변경 영향을 결정한다

### C04 — 관계의 의미와 그래프 유효성

관계는 아래 세 가지뿐이다. 관계를 여러 모듈에서 별도로 정의하지 않는다.

| 관계 | 의미 | 실행 준비 조건 | 변경 영향 |
|---|---|---|---|
| `contains` | group과 자식의 분해 관계 | group은 실행하지 않음 | 집계 결과를 다시 계산 |
| `consumes` | 생산자의 출력 포트를 소비자의 입력 포트로 연결 | 정확한 계약을 충족하는 유효한 artifact 필요 | 해당 입력 소비자와 그 후속 결과가 영향 후보 |
| `after` | 결과를 소비하지 않는 순서 제약 | 해당 선행 작업의 현재 완료 증거 필요 | 실행 준비를 재평가하며, 기존 결과를 데이터 변경으로 자동 무효화하지 않음 |

- `contains`는 순환 없는 forest이고 한 노드의 직접 부모는 최대 하나다. `consumes + after`를 합친 실행 그래프는 DAG여야 한다.
- `consumes`는 `(leaf | source).output → leaf.input`, `after`는 `leaf → leaf`다. `after` 필드는 `predecessor/successor`로 방향을 고정한다. group 전체에 의존하려면 완료를 증명하는 integration leaf에 연결한다.
- 필수 입력 포트마다 생산자가 정확히 하나 있어야 한다. 외부 입력은 사용자가 등록한 불변 artifact를 내보내는 source node로 표현한다. source node는 실행하지 않는다.
- 같은 입력에 생산자를 여러 개 연결하거나, 없는 포트·삭제한 노드·다른 graph를 암묵적으로 참조하면 거절한다. 공유 외부 결과는 source artifact로 명시적으로 등록한다.
- 검증 실패와 수정 요청은 새로운 graph change 제안이다. DAG에 역방향 feedback edge를 추가하지 않는다.
- graph 수정은 baseRevision을 지정한 전체 proposal로 검증한 뒤 원자적으로 활성화한다. 일부 edge만 적용된 graph는 실행에 노출하지 않는다.
- graph 변경으로 binding 또는 필수 선행 순서가 바뀐 leaf는 새 실행 의미를 가진다. 그 leaf의 진행 중 attempt를 fence하고 결과를 재평가한다. 단순 표기 변경과 group 이동은 실행 의미 변경에 포함하지 않는다.
- 완료 조건은 `completionTargets`로 명시한다. 활성 graph의 모든 필수 target이 유효해야 전체 작업을 완료로 표시한다.

### C05 — 변경은 먼저 결과의 유효성을 철회한다

- 변경 원인은 요구/spec, 계약, 환경·권한 정책, 검증기, 입력 artifact, graph binding의 새 revision이다. 원인과 새·옛 참조를 MUST 기록한다.
- 영향은 실제 `consumes` binding에서 계산한다. 특정 출력 포트만 바뀌었다면 그 포트를 소비하는 경로에서 시작한다. spec 전체가 바뀌어 어느 출력이 유지될지 아직 모르면 그 spec의 모든 출력을 영향 후보로 삼는다.
- 포트별 영향 축소는 검증된 새 출력 또는 명시적인 포트 보존 증거가 있을 때만 허용한다. 포트의 이름·계약이 그대로라는 사실만으로 내용이 유지됐다고 추정하지 않는다.
- 영향 후보의 결과는 즉시 `check_required`로 전환한다. 새로운 소비·완료 판정에 사용하지 않는다. 현재 실행 중인 후보 attempt는 fence하고 중단을 요청한다.
- 영향을 받은 경로의 후속 결과는 `check_required`로 전파한다. 이는 **잠재적으로 오래된 결과라는 뜻**이며 모든 후속 코드를 즉시 다시 작성한다는 뜻이 아니다.
- 독립 경로의 유효 결과와 실행은 유지한다. `contains` 관계만으로 모든 형제·상위 그룹의 전체 하위 작업을 무효화하지 않는다.
- 원인별 영향 사유와 경로를 저장한다. 새 정보가 생기면 유효성이 회복된 경로부터 순차적으로 후보를 해소한다.
- 폐기된 attempt의 늦은 출력은 이력으로만 보관한다. fence가 해제되거나 옛 결과가 자동으로 현재 결과가 되지 않는다.

### C06 — 재사용·재검증·재작업을 구분한다

| 판정 | 필요한 증거 | 수행 |
|---|---|---|
| `reuse` | spec의 의미, 입력별 content/contract digest, 순서 의무, 환경·정책, 검증기 및 출력 무결성이 모두 동일 | 새 graph에서 기존 증거를 참조해 유효성 복구 |
| `revalidate` | 입력 또는 검증 조건이 바뀌었고, 이 변경에 사용할 명시적 호환성 검증기가 있음 | 이전 출력과 새 입력 조합을 격리 검증하며 구현 코드는 변경하지 않음 |
| `rerun` | spec 의미 변경, 호환성 검증 실패, 지원되는 호환성 증거 없음 | 새 attempt에서 구현·검증 수행 |
| `wait` | 선행 결과 미확정, 실제 종료 미확인, 판정 증거 불충분 | 결과 사용을 차단하고 원인을 표시 |

- 입력 artifact의 ID가 달라도 content와 contract digest가 같고 나머지 실행 조건이 같으면, lineage를 새 입력에 연결하는 **새 채택 기록**으로 재사용할 수 있다. 과거 기록은 수정하지 않는다.
- `provenanceDigest`는 graph revision·artifact ID·완료 증거를 포함한 정확한 이력을 식별한다. `semanticReuseKey`는 task 의미, 포트별 content/contract digest, 정규화한 순서 의무, 환경·정책·검증기를 식별한다. 이력이 달라도 의미가 같다는 근거를 AdoptionRecord에 연결한다.
- 순서 의무가 바뀌었다면 과거 실행이 새 의무를 만족했다는 증거가 없을 때 재사용하지 않는다. 무관한 graph 변경으로 revision만 달라졌다면 실행 의미를 다시 비교한 새 AdoptionRecord로 결과를 채택할 수 있다.
- 계약 shape가 호환되어도 소비자의 업무 의미가 유지된다는 보장은 없다. `revalidate`는 그 의미를 다루는 검증기가 있을 때만 선택한다.
- 재검증 결과가 `inconclusive`면 통과로 처리하지 않는다. 구현을 반복해도 해결되지 않는 요구·권한·환경 판단이면 `wait`하고 필요한 결정을 표시한다.
- 하위 leaf의 실행 의미가 그대로이고 상위 결과가 동일하게 돌아오면 그 leaf는 재작업 없이 복구할 수 있다. 상위 출력이 달라졌다면 해당 binding만 다시 판정한다.
- 검증기 자체의 변경도 검증 의존성 변경이다. 새 검증 없이 이전 통과 결과를 유지하지 않는다.

## 3. 실행은 독립 공간에서 중단·재개된다

### C07 — 환경 명세와 실제 공간의 수명

```text
WorkspaceTemplateRevision {
  templateId, revision, digest,
  environmentArtifactRef, sourceSnapshots, bootstrapRef, toolRefs
}
WorkspaceInstance {
  workspaceId, ownerTaskId, templateRef,
  activeWriter: { attemptId, fence } | null,
  captureHold: { attemptId, fence } | null,
  lastCheckpointRef, retentionState
}
ExecutionPolicyRevision {
  policyId, revision, digest,
  resources, networkPolicyRef, secretRefs, allowedEffects
}
```

- template은 복제 가능한 환경 명세이고 instance는 태스크가 소유하는 실제 가변 공간이다. template이 같아도 instance를 공유하지 않는다.
- environmentArtifactRef는 불변 실행 환경의 참조다. 컨테이너 backend를 선정했을 때 image digest로 구현할 수 있으며 이 필드 자체는 컨테이너 채택을 강제하지 않는다.
- 각 instance에는 동시에 하나의 writer만 허용한다. 서로 다른 태스크의 쓰기 영역, 프로세스 권한, secret, 자원 한도를 분리한다.
- 소비 입력은 검증된 불변 snapshot을 읽기 전용으로 제공한다. 부모·형제·생산자의 가변 작업 공간, 제어 평면 저장소, 호스트 관리 인터페이스에 쓰기 권한을 주지 않는다.
- template source는 정확한 revision으로 고정한다. 초기화 완료 marker는 영속 공간에 원자적으로 저장한다. 복구 시 초기화를 반복하여 기존 파일을 덮지 않는다.
- backend는 격리, 읽기 전용 입력, 자원·network·secret 정책을 실제로 집행할 수 있어야 한다. 지원하지 않는 정책을 무시하지 않고 시작을 거절한다.
- 완료·취소·실패·중단은 공간 삭제 명령이 아니다. 보관·삭제는 별도 정책과 명시적 명령으로 다룬다. 활성 writer, captureHold 또는 artifact/checkpoint 참조가 남아 있으면 삭제하지 않는다.

### C08 — 실행 신원과 실제 상태

```text
Attempt {
  attemptId, taskSpecRef, inputSnapshotRef, workspaceId,
  fence, desired: running | stopped,
  stopReason?: suspend | cancel | supersede,
  observed: queued | starting | running | stopping | stopped | unknown,
  observedFence, backendHandle?, outcome?, checkpointRef?
}
StopReceipt {
  attemptId, fence, backendHandle, workspaceId,
  observationSource, stoppedAt, writerTerminationEvidence
}
```

- attempt는 정확한 spec와 입력 snapshot에 고정된다. 진행 중 attempt의 spec·입력을 바꾸지 않는다. 새 실행·재시도·재개는 새 attempt다.
- fence는 공간의 writer 권한을 인계할 때 단조 증가한다. 결과 제출 권한과 쓰기 공간 점유를 모두 확인한다. 결과 fencing만으로 옛 프로세스의 파일 쓰기가 멈췄다고 간주하지 않는다.
- 원하는 상태와 관측 상태는 별개다. 중단 요청을 받았다는 이유로 `stopped` 또는 ‘중단 완료’를 표시하지 않는다.
- writer에는 작업 명령뿐 아니라 분리된 자식·백그라운드 프로세스와 쓰기 권한을 가진 runner를 포함한다. runner가 계속 살아 있으려면 해당 attempt의 공간 쓰기·새 작업 생성 권한을 실제로 잃었다는 증거가 필요하다. 관측·snapshot용 관리 프로세스는 이 권한과 분리한다.
- backend 신원·fence가 맞는 종료 증거를 받은 뒤 필요한 artifact/checkpoint snapshot을 불변 저장하고 무결성을 확인할 때까지 공간의 `captureHold`를 유지한다. 같은 공간의 새 writer는 writer 권한과 captureHold가 모두 해제된 이후에만 시작한다.
- snapshot을 확보하지 못하면 공간 인계는 대기한다. 명시적 결과 포기 결정으로 해제할 수 있지만 포기한 상태를 재개 가능 또는 유효 결과로 표시하지 않는다.
- handle 부재, timeout, lease 만료, heartbeat 소실만으로 실제 종료를 추정하지 않는다. 종료를 증명할 수 없으면 `unknown`으로 격리한다.
- backend 자원이 시작되기 전 취소할 때도 생성 intent의 확정 철회 또는 미생성 증거가 필요하다. 응답 유실 뒤 같은 intent로 자원이 생성될 가능성을 제거해야 한다.
- backend는 handle 없이 intentId로 조회·철회할 수 있어야 한다. 철회된 intentId의 tombstone을 유지하여 지연된 생성 재전달도 거절한다.
- 자연 종료도 StopReceipt에 해당하는 증거를 남긴다. 성공/실패 outcome은 관측 상태와 구분하며, 성공 outcome 자체는 `C03`의 결과 채택을 대신하지 않는다.

### C09 — 체크포인트와 재개

```text
CheckpointManifest {
  checkpointId, attemptId, fence, workspaceSnapshotRef,
  taskSpecRef, inputSnapshotDigest, templateDigest,
  completedSteps: [{ stepId, stepSpecDigest, inputDigest, outputDigest }],
  agentSessionRef?, effectReceipts, integrityDigest
}
```

- 재개는 **영속 파일·명시적 에이전트 세션 상태를 복원하여 새 프로세스로 실행**하는 의미다. 메모리, 열린 소켓, 스레드의 그대로 복원을 약속하지 않는다.
- checkpoint 저장은 원자적이어야 한다. 부분 manifest나 digest가 맞지 않는 snapshot은 재개 가능으로 표시하지 않는다.
- 중단 전 단계 기록과 중단 후 공간 snapshot을 함께 채택할 때 완료 단계의 outputDigest가 채택 snapshot 또는 별도 불변 단계 snapshot과 일치해야 한다.
- suspend 요청은 새 작업을 막고, 실행기의 checkpoint를 요청하고, 실제 종료를 확인한다. checkpoint가 없거나 불완전하면 ‘종료됨, 재개 판단 필요’로 표시한다.
- 같은 spec·입력·환경인 경우에도 검증된 완료 단계만 생략한다. 중단된 단계는 effectPolicy에 따라 재실행 가능 여부를 판단한다.
- spec·입력이 바뀐 경우 기존 checkpoint는 복구 자료일 뿐 실행 완료 증거가 아니다. 새 계약으로 단계별 입력·출력을 다시 검증해야 재사용할 수 있다.
- 외부 효과는 호출 전에 effect intent와 scope/key/payload digest를 영속화한다. 확정된 성공 receipt가 있으면 완료로 채택하여 호출을 생략한다. receipt는 재호출 허가가 아니다.
- 미확정 효과는 수신자가 동일 scope/key/payload의 중복 제거를 보장할 때만 같은 key로 자동 재전달할 수 있다. 보장이 없는 결제·메시지 전송·배포 등의 결과가 불확실하면 자동 반복하지 않고 결정을 기다린다.
- cancel은 재개 요청과 구분한다. 취소된 attempt는 되살리지 않으며 이후 수행은 새 명령·새 attempt다. 기존 작업 파일은 보관한다.

## 4. 제어 상태는 장애와 중복 요청을 견딘다

### C10 — 원자성·멱등성·복구

- 모든 변경 명령은 `operationId`, 대상 ID, `expectedRevision`을 가진다. 같은 ID와 같은 payload는 기존 결과를 반환하고, 같은 ID의 다른 payload는 거절한다.
- 상태 전이, revision, 이벤트, backend에 전달할 실행 intent는 같은 트랜잭션으로 저장한다. 저장 전에는 외부 실행을 시작하지 않는다.
- backend 호출은 최소 한 번 전달될 수 있다. 동일 intent를 여러 번 전달해도 동일 실행 하나를 식별해야 한다. ‘정확히 한 번 전달’을 가정하지 않는다.
- 결과 채택, 중복 제거, graph revision 비교는 경쟁하는 명령 사이에서 직렬화되어야 한다. 특정 DB 구현이 아니라 저장소 어댑터가 지켜야 할 계약이다.
- 이벤트는 단조 순번과 schemaVersion을 가지며 cursor로 재조회할 수 있다. 알림 연결이 끊겨도 저장된 상태와 미처리 intent를 복구할 수 있다.
- 제어기 재시작은 영속 intent·attempt·writer 점유를 읽고 backend를 조회하는 것으로 시작한다. 메모리에 없다는 이유로 기존 실행을 다시 생성하지 않는다.
- outbox intent의 완료 표시는 backend 호출 시작이 아니라 결과의 영속 기록 이후에 한다. 실패는 재시도 가능한 상태와 이유를 남긴다.

### C11 — 외부 명령과 경계 권한

| 명령군 | 최소 명령 | 보장 |
|---|---|---|
| 계획 | `proposeGraph`, `analyzeChange`, `activateGraph` | 검증된 proposal만 원자 활성화; baseRevision 충돌 거절 |
| 실행 | `requestRun`, `requestSuspend`, `requestResume`, `requestCancel` | intent 기록과 실제 실행 관측 분리 |
| 결과 | `submitCandidate`, `recordValidation`, `adoptResult` | 권한·정확한 신원·현재 입력 검사; 과거 결과 자동 채택 금지 |
| 조회 | `getGraph`, `getTask`, `getImpact`, `readEvents` | graph/spec/attempt revision, desired/observed 상태와 원인을 함께 제공 |

- 사용자는 명령을 요청하고 planner는 graph/spec proposal을 생성한다. planner가 상태 저장소를 직접 수정하거나 실행 완료를 선언하지 않는다.
- worker는 자신의 attempt 범위에서 candidate와 진행 정보를 제출한다. 검증기와 제어기만 그 증거를 판정한다. worker가 직접 현재 유효 결과 포인터를 갱신하지 않는다.
- 실행 intent에는 현재 revision과 권한 범위를 포함한다. backend/runner는 지원하지 않는 capability를 명시적으로 거절한다.
- 설계의 각 포트는 하나의 책임을 가진다: `StateStore`, `ArtifactStore`, `RuntimeBackend`, `CheckpointStore`, `Validator`, `Planner`. 구체 기술 선택은 이 계약을 만족한다는 증거로 정한다.

### C12 — 실패를 분류하고 판정 근거를 남긴다

- 최소 오류 분류는 `invalid_contract`, `invalid_graph`, `revision_conflict`, `stale_attempt`, `validation_failed`, `capability_unsupported`, `runtime_unavailable`, `termination_unknown`, `checkpoint_invalid`, `effect_unknown`이다.
- 오류는 원인 객체와 revision, 재시도 가능 여부, 현재 결과 사용 가능 여부를 포함한다. 장애를 성공·취소·중단 완료로 바꾸지 않는다.
- 사용자는 ‘무엇이 실행 중인가’, ‘무엇을 기다리는가’, ‘어떤 변경 때문에 다시 수행하는가’, ‘이전 결과를 왜 재사용했는가’를 저장된 증거로 조회할 수 있어야 한다.
- 성공 판정은 실패 시나리오에서도 검증한다. 네트워크 단절, 중복 전달, 중단 경합, 제어기 재시작, 오래된 완료, checkpoint 손상은 정상 시나리오와 같은 계약의 일부다.

이 계약의 구현 수용 조건은 [설계의 A01–A16](architecture.md#4-수용-시나리오와-검토-경계)에 정의한다.
