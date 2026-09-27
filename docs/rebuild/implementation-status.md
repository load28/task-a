# 신규 구현 상태와 검증 근거

## 2026-09-27 — AX 실행 경로와 전역 진입점 전환

최신 기준은 [engine/extensions.md](../../engine/extensions.md)다. AX 원본 65개 중 60개는 해시가 같고, 5개는 [잠금 파일](../../engine/upstream.lock.json)에 사유와 수정 해시를 기록했다. 원본 Go runner·gRPC·Redis Streams·controller·workspace·Substrate를 사용한다. AX의 옛 클라이언트에는 native credential injector가 없어 Substrate 클라이언트/인프라를 `ed6d2a1fc8ae8337eb055d51b0b767b023cb3b5c`로 일치시켰다.

Go 그래프 CLI는 프로젝트별 Redis 상태와 이벤트, 불변 AX Task 신원, 입력 의존성, 별도 검증 Task, 실제 Substrate 중단 관측, revision 변경과 동일 출력 재사용을 구현한다. golden template 준비 중 업무 명령을 실행하지 않도록 `task-agent-exec`가 기다린다. 준비된 실제 actor에 AX guest API로 activation을 전달한 뒤 syscall.Exec로 업무 명령을 시작한다. AX의 프로세스 감독을 재작성하지 않는다.

검증 근거:

- 전체 `go test ./...` 통과. 실제 Redis를 지정한 저장·재접속·state/event·동시 lock 검사 포함. 기본 테스트에서 Redis opt-in을 건너뛴 결과와 구분한다.
- 전용 `task-agent-ax-source` 클러스터에 원본 Substrate gVisor·RustFS snapshot·egress·credential provider 및 우리 AX server/controller와 Redis AOF/PVC를 배포했다. 기존 `task-agent-local` 클러스터는 변경하지 않았다.
- 최종 이미지 `localhost:5001/task-agent/codex@sha256:f2dab91d75c0399a9f67020354aefdfa0ee357bd4f3e18edae2905db95504976`에서 `ax-final-smoke` 의존 작업 2개와 각각의 별도 validator가 완료됐다. revision 2에서 produce는 재실행하고 동일 출력 `AX`를 받은 consume은 재사용했다. 통합 결과는 `AX-child`다.
- `ax-final-resume` revision 2는 중단 전 실제 명령이 count=1을 쓴 것을 AX guest로 확인했다. DATA 중단·재개 후 같은 actor에서 count=2를 만들고 별도 validator까지 통과했다. 제어 상태의 Running만으로 시험 시작을 판단하지 않았다.
- 네트워크를 끈 Docker 안에서 fake Codex 실행 파일로 activation 전 실행 안 됨, activation 후 시작, 정확한 session id로 resume, auth.json 없음 확인. 실제 모델 추론이나 로그인 검증의 근거로 세지 않는다.
- 전역 스킬과 역할을 AX 경로로 전환했다. 별도 프로젝트 context·문자 그대로의 argv·기존 SQLite --state 거절·TOML 및 실제 AX 래퍼 실행을 확인했다. named-role 로더를 통한 새 서브에이전트 호출은 별도 검증하지 않았다.

시험 계획과 상태는 로컬 `engine/.state/smoke/`의 `final-dag-proof.json`, `final-reuse-proof.json`, `final-resume-proof.json` 등에 보존한다. 이전 image·준비 대기·실패 시험은 같은 폴더와 임시 로그에 남아 있으며 최종 성공 근거와 구분한다.

실제 ChatGPT 로그인은 아직 클러스터에 동기화하지 않았다. 자동 승인 검토가 access token과 account id를 `task-agent-ax-source`의 Kubernetes Secret에 저장할 명시적 승인 근거가 없다는 이유로 거절했다. refresh token은 전송 대상이 아니다. 실행할 [Codex 시험 생성기](../../engine/examples/codex-smoke.mjs)와 로컬 `engine/.state/smoke/codex-plan.json`은 준비·정적 검증했다. 실제 Codex 추론·native 인증 주입의 종단 검증은 대기다.

이 버전은 UTF-8 파일 계약의 연결 구현이다. read-only 입력 mount, 대용량 artifact 전송, 분산 fencing·자동 crash lock 회수, C01–C12 전체 수용을 완료했다고 주장하지 않는다. 아래 기록은 이전 구현의 이력이다.

---

## 2026-09-27 — AX 원본 우선 기반 도입

최신 실행 기반은 [engine/ax](../../engine/ax/)다. `d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9`의 추적 파일 65개를 보존했고, `node engine/verify-upstream.mjs`에서 unchanged 65 / modified 0을 확인했다. 라이선스와 원본 파일 해시는 [engine](../../engine/README.md)에 기록한다.

가져온 디렉터리에서 Go 1.27.1로 `go test ./...`를 실행했다. 테스트가 있는 10개 패키지 모두 통과했고, 나머지 8개 패키지는 테스트 파일 없음으로 빌드됐다. 공개 모듈 다운로드와 로컬 테스트 서버 접근을 허용한 실행 결과다. `git diff --check`와 기존 계약 그래프 검증도 통과했다. 이 Go 테스트는 실제 Redis·Substrate 클러스터 종단 검증을 의미하지 않는다.

[AX01–AX05](ax-implementation-adoption.md)의 AX01만 완료했다. 원본 인프라 배포, 계약 그래프의 AX 연결, AX 경로의 Codex 로그인·세션 재개, 전역 스킬 전환은 미완료다. 아래 `greenfield/`의 기존 실험·검증 기록은 보존하지만 AX 기반 구현의 완료 근거로 사용하지 않는다.

---

점검일: 2026-09-26 · 기준: [C01–C12](contracts.md), [A01–A16](architecture.md#4-수용-시나리오와-검토-경계), [T01–T19](implementation-plan.md).

**계약·그래프·격리 실행의 첫 구현과 일부 실제 Docker 검증은 있으며, 19개 태스크 전체 완료나 A01–A16 전체 충족을 선언하지 않는다.** 이 문서는 `greenfield/`만 점검한다. 계획 문서의 제안 경로와 실제 경로의 대응도 아래에 기록한다.

### 2026-09-27 — Codex 자연어 진입점 추가

프로젝트 스킬과 전담 역할, [자연어 라우팅](../../AGENTS.md)을 추가한 뒤 같은 날 전역 사용자 설치로 전환했다. 모델·권한 설정은 부모 Codex에서 상속한다. Codex의 실제 `skills/list` 조회에서 `task-agent`, scope `repo`, enabled `true`, 등록 오류 없음을 확인했다. 스킬 검증기와 TOML/YAML 검사도 통과했다.

전역 설치는 `~/.codex/skills/task-agent/`와 `~/.codex/agents/task-agent.toml`이다. 저장소 중복 등록을 제거하고 공용 엔진 경로와 대상 프로젝트를 분리했다. 저장소 밖에서 실제 `skills/list`가 scope `user`, enabled `true`, 동일 이름 1개, 오류 없음으로 반환했다. 별도 임시 프로젝트 두 곳에서 context·help·예제 생성/검증·문자 그대로의 파일명 전달·프로젝트별 상태 분리와 기존 smoke 상태 조회를 확인했다. 사용자 정의 역할 TOML은 검사했지만 현재 도구가 named-role 인자를 제공하지 않아 역할 로더를 통한 직접 호출은 확인하지 않았다.

전담 서브에이전트에 “입력 [3, 7, 10]의 합계와 개수를 독립 계산하고 JSON으로 통합”을 자연어로 전달했다. 기존 예제 호출 없이 source→sum/count→integration 계획을 작성했고 정적 검증을 통과했다. 부모가 시험 계획을 새 엔진에서 실행해 `complete: true`, 미처리 intent 0, 실제 결과 `{"sum":20,"count":3}`을 확인했다. 기록은 로컬 `greenfield/.state/codex-integration-smoke/`에 보존한다. 현재 도구에서는 사용자 정의 역할 인자 대신 일반 서브에이전트에 스킬을 전달하는 경로를 실행 검증했다.

시험 중 Docker가 꺼져 있을 때 start intent가 일찍 완료 처리되는 문제를 수정했다. queued/unknown 상태에서는 intent를 유지하고, 이전 버전에서 이미 확인 처리한 queued attempt도 같은 신원으로 조정한다. 제어기 교체 후 재시작 및 이전 상태 복구 회귀 테스트를 추가했다. 실제 시험에서도 기존 sum/count attempt를 유지한 채 복구했다. 타입 검사와 기본 87개 중 81개 통과·Docker 6개 skip을 확인했다. 별도 Docker 회귀 묶음은 30/30 통과·skip 0이었다.

이 연결은 **현재 Codex의 추론을 계획 작성에 사용하는 진입점**이다. 독립 CLI 안에 별도 원격 모델 제공자를 내장한 것은 아니며, 단일 자연어 시험을 일반적인 계획 품질 보장으로 확대하지 않는다. 아래 최초 구현 평가의 미검증 범위는 별도 명시가 없는 한 유지한다.

## 1. 검증 종류와 재현 범위

- **정적/순수 테스트:** TypeScript 검사와 계약·kernel fixture 검증이다. kernel의 `memory:` artifact와 테스트가 만든 AdoptionRecord는 실제 bytes·검증 실행의 증거가 아니다.
- **실제 로컬 검증:** SQLite 파일·서로 다른 연결·재오픈, 파일 CAS·손상 주입, Ajv worker thread, 별도 Node 프로세스의 runner/planner/CLI 명령을 실행한다. SQLite commit 직후와 CAS 게시 직후에는 별도 프로세스를 실제 SIGKILL한다. 이를 Docker 격리 검증으로 세지 않는다.
- **모의 backend 검증:** control 테스트의 FakeBackend/RecordingBackend와 runtime 테스트의 FakeDocker가 응답 유실·자원 소실·경합을 주입한다. 상태 저장과 파일 CAS는 실제 구현을 사용하지만 OS 격리는 검증하지 않는다.
- **실제 Docker 검증:** runtime 2개·validator 1개·제품 E2E 2개·CLI 1개를 담당 구현자가 실행해 통과를 보고했다. 해당 테스트 본문과 판정값을 교차 확인했다. 기본 `npm test`의 skip은 통과로 계산하지 않는다.

최종 `npm run check`는 **strict TypeScript 통과, 기본 테스트 85개 중 79개 통과, Docker 6개 skip, 실패 0개**였다. 테스트 실행 시간은 4.33초였다. 점검 담당자의 중간 실행과 이후 총괄 담당자의 최종 실행 결과를 함께 확인했다.

최종 `npm run test:docker`는 **30개 모두 통과, skip 0개, 실패 0개, 27.094초**였다. 이 중 실제 Docker opt-in 테스트는 6개이며 나머지는 같은 명령에 포함된 로컬/모의 테스트다. CLI+제품 E2E 묶음도 별도로 **9/9 통과**했다.

```sh
cd greenfield
npm test
./node_modules/.bin/tsc --noEmit -p tsconfig.json
npm run test:docker
```

실제 실행 환경과 이미지 digest, 자원 한도 실측은 [최초 플랫폼 결정](../../greenfield/platform-decision/README.md)에 있다. 실측 환경은 Node 24와 Docker Linux arm64이며 amd64는 동일 수준으로 실행 검증하지 않았다. 환경 capability probe는 제품 수용 테스트와 별도 근거다.

| 실제 Docker 테스트 | 확인한 결과 | 범위 제한 |
|---|---|---|
| [runtime 테스트][RT-T] `real Docker preserves a completed stage...` | 실제 중단 후 새 attempt/컨테이너에서 부분 파일 복구, 완료 단계 실행 횟수 1 유지 | 이 행은 backend/runner 검증이며 앱 전체 흐름은 아래 E2E에서 별도로 확인 |
| [runtime 테스트][RT-T] `real Docker input mounts reject writes...` | 입력 쓰기 거절, 원본 보존, socket/backend DB 미노출, network interface `lo` | 다른 실행 중인 태스크의 실제 공간을 특정해 공격하는 별도 테스트는 없음 |
| [validation 테스트][VAL-T] `real Docker argv validation checks...` | 후보와 원 입력 읽기 전용, 별도 검증 컨테이너, source argv 등록 검증, 재시작/재요청 후 증거 재사용 | 업무별 호환성 판단 정확도를 보장하지 않음 |
| [제품 E2E][E2E] `actual app resumes a stopped checkpoint...` | 실행 중 A 중단→controller 재생성→checkpoint 재개→입력/spec 변경→동등 출력 재사용. 최종 A5/B3/C3/D1/integration3회, 값 117, 종료 증거/checkpoint 각 15개, 검증 증거 18개 | 고정 fixture 그래프다. rev4에서 B/C/integration은 새 reuse 기록을 만들고 D는 최초 채택을 유지했다. 자연어 분해 provider는 사용하지 않음 |
| [제품 E2E][E2E] `actual controller SIGKILL after Docker start...` | 제어기 실제 SIGKILL 후 동일 attempt와 container로 복구; 태스크마다 1회, 미처리 intent 0 | 시작 직후 한 장애 경계의 검증이며 모든 저장/중단/채택 경계를 포괄하지 않음 |
| [CLI 테스트][CLI-T] `CLI actual Docker run publishes...` | 실제 subprocess CLI apply/run/result가 통합 값 105를 내보내며 기존 출력 디렉터리 덮어쓰기를 거절 | 실제 실행 통과. CLI suspend/resume/cancel 전 명령을 조합한 종단 시나리오는 아님 |

## 2. C01–C12 계약별 상태

여기서 **구현·검증**은 해당 행에 적은 범위만 뜻한다. **부분**은 계약의 일부가 미지원·미검증이거나 추가 보완이 필요하다는 뜻이다.

| 계약 | 구현과 검증 근거 | 남은 범위 |
|---|---|---|
| C01 실행 단위·분해 — 부분 | [모델][MODEL], [graph 검증][GRAPH], [planner][PLANNER]; [kernel A02][K-T]에서 필수 leaf/integration 집계, [planner 테스트][P-T]에서 proposal 검증·유한 보완 피드백·고정 목표 평가 | 목적 하나·책임 중복 여부의 의미 검토는 외부 reviewer 입력이다. 분해 요구 protocol은 전달하지만 자연어 목표를 처리하는 내장 모델 provider와 의미 품질 평가는 없음. |
| C02 불변 계약·정확한 바인딩 — 구현·검증 | [canonical][CANON], [JSON 검증][SCHEMA], [graph][GRAPH], [입력 snapshot][INPUTS]; [계약 테스트][C-T], [kernel A01/A03][K-T], [정확한 spec 회귀][REG-T] | 정의를 깊게 고정하고 정확한 참조를 검사한다. 임의 검증기의 업무 의미가 옳다는 보장은 이 구조 검증의 범위 밖이다. |
| C03 산출물·성공 증거 — 구현·경계별 검증 | [CAS][ART], [validator][VAL], [source 검증][SOURCES], [채택][CONTROL], [현재 증거 무결성][INTEGRITY]; [위조/손상 증거 거절][CP-T], [source validator 및 Docker argv][VAL-T], [E2E][E2E] | source도 계약 validator를 실행하고 exact graph/artifact별 증거를 저장한다. 채택된 bytes/report 손상은 읽기 시 즉시 완료를 철회하며 tick에서 영속 반영한다. 모든 부분 출력 실패 조합의 실제 E2E는 아직 없음. |
| C04 관계·graph 유효성 — 구현·검증 | [graph][GRAPH], [inputs][INPUTS], [원자 activation][CONTROL]; [kernel A01/A02/A07][K-T], [잘못된 activation 무변경][CP-T], [store][S-T] | `contains/consumes/after` 의미와 전체 proposal 적용을 검사한다. 자연어 책임 분해의 타당성을 자동 판정하지 않는다. |
| C05 변경 철회·전파 — 부분 | [영향 분석][CHANGE], [activation/fencing][CONTROL]; [kernel A05/A08][K-T], [control 변경 경합][CP-T], [실제 선택 재작업][E2E] | source 포트의 확정 digest 변경은 선택 전파한다. 실행 leaf의 새 spec은 모든 출력을 보수적으로 전파한다. 실행 leaf별 명시적 포트 보존 증거 제출 기능은 없음. |
| C06 재사용·재검증·재작업 — 부분 | [판정][REWORK], [snapshot 의미 key][INPUTS], [채택][CONTROL]; [kernel A06/A07][K-T], [취소와 reuse 경합][REG-T], [호환성 4분기][CP-T], [실제 하위 연속 reuse][E2E] | 모의 trusted validator와 실제 DB/CAS로 passed→revalidate, failed→rerun, inconclusive/unavailable→대기를 검증했다. 실제 동등 출력 변경에서는 B/C/integration을 재실행하지 않는다. 업무 argv의 control revalidate E2E는 없음. |
| C07 환경·공간 수명 — 지원 범위 구현·검증 | [Docker][RUNTIME], [파일 snapshot][FILES], [CAS][ART]; [실제 격리][RT-T], [플랫폼 probe](../../greenfield/platform-decision/README.md) | network none·secret 없음·외부 효과 없음만 지원한다. 참조를 고려한 workspace/CAS 삭제·보존 만료 명령은 없음. 기본 동작은 보존이다. |
| C08 신원·실제 상태 — 구현·경계별 검증 | [control][CONTROL], [runtime][RUNTIME]; [handle 위조 회귀][REG-T], [stop/capture 경합][CP-T], [응답 유실·철회·소실][RT-T], [실제 SIGKILL][E2E] | 실제 Docker 자원 소실·daemon 단절·lease 경합의 모든 조합을 시험하지는 않았다. unknown을 종료로 바꾸지 않는 경로는 모의 주입으로 확인했다. |
| C09 체크포인트·재개 — 부분 | [runner][RUNNER], [runtime capture][RUNTIME], [control][CONTROL]; [완료 단계 재개][RT-T], [실제 앱 중단·controller 재시작·재개][E2E] | 로컬 replayable 단계와 파일 복구만 지원한다. 외부 effect intent/receipt 실행·중복 제거는 미지원으로 거절한다. 명시적 agent session adapter와 변경 입력/손상 checkpoint의 제품 재개 시나리오는 미검증이다. |
| C10 영속 명령·복구 — 부분 | [SQLite state/outbox][STORE], [backend intent][RUNTIME], [control][CONTROL]; [store 3건][S-T], [control 재오픈][CP-T], [commit/CAS 실제 SIGKILL][TX-T], [backend 시작 후 실제 SIGKILL][E2E] | commit 후 응답 유실 때 같은 receipt/event/intent를 복구한다. 모든 crash 지점과 이벤트 연결 단절/재연결은 아직 실제 주입하지 않았다. |
| C11 명령·권한 경계 — 부분 | [명령 모델][MODEL], [control][CONTROL], [planner][PLANNER], [CLI][CLI]; [command schema][C-T], [planner][P-T], [위조 증거][CP-T] | 신뢰된 로컬 controller/CLI 구조다. 공개 worker 결과 변경 명령은 거절하고 trusted runtime 경로만 사용한다. 원격 인증/RBAC API 및 worker candidate 제출 프로토콜은 없음. |
| C12 오류·판정 근거 — 부분 | [오류 정규화][ERRORS], [오류 테스트][ERR-T], [impact][CHANGE], [상태/이벤트][CONTROL], [CLI][CLI], [실제 CLI 오류 테스트][CLI-T] | 공통 code/object/revision/retryable/resultUsable 출력은 구현했다. 알 수 없는 원인·revision은 null이며 내부 저장 오류 일부는 문자열이다. 모든 실패 경로의 구체 맥락을 보장하는 종단 검증은 없음. |

## 3. A01–A16 수용 시나리오별 증거

| 시나리오 | 코드·테스트 및 실제 판정 | 현재 수용 범위 |
|---|---|---|
| A01 잘못된 graph 거절 | [GRAPH], [SCHEMA], [CONTROL]; [K-T] A01 3건 + [CP-T] atomic activation | 순환·필수 입력·중복 생산자·잘못된 endpoint는 순수 테스트, 잘못된 전체 activation의 무변경은 실제 DB와 모의 runtime으로 통과 |
| A02 작은 작업 완료 | [GRAPH], [INPUTS], [PLANNER]; [K-T] A02, [P-T], [E2E] integration | group 집계와 성공 integration은 검증. 실제 실패 integration을 통한 전체 미완료 및 의미가 빠진 자연어 proposal 평가는 미검증 |
| A03 명세 고정 | [MODEL], [INPUTS], [CONTROL], [SOURCES]; [C-T], [K-T] A03, [REG-T] exact revision, [CP-T] graph change, [VAL-T] source 등록 3건 | source/실행 artifact 구분, 정확한 선택 revision, 과거 이력 유지 검증. source validator 실행·실패 거절·환경별 증거·동일 요청 복구도 검증 |
| A04 증거 없는 성공 거절 | [VAL], [ART], [CONTROL]; [K-T] A04, [CP-T] forged validator, [VAL-T], [A-T] corruption | 위조 증거·shape/schema·bytes 오류 거절. exit 0인데 필수 출력 일부가 없는 실제 Docker 작업의 controller 거절은 전용 E2E 미검증 |
| A05 포트별 영향 | [CHANGE], [CONTROL]; [K-T] A05 두 건, [E2E] selective rebuild | source x만 변경 시 다른 포트 경로 유지는 순수 테스트. 실행 spec 미확정 시 모든 출력 전파 검증. 실제 포트 보존 증거 제출 방식은 미지원 |
| A06 전파 중단 | [REWORK], [INPUTS], [CONTROL]; [K-T] A06, [CP-T] compatibility 4모드, [REG-T] cancel during verify, [E2E] rev4 reuse | 실제 A 재실행 출력이 같을 때 B/C/integration 연속 reuse와 새 lineage를 검증. 호환성 4분기는 모의 trusted validator로 검증. 실제 업무 argv의 control revalidate 채택 E2E는 미검증 |
| A07 순서/데이터 분리 | [CHANGE], [INPUTS], [REWORK]; [K-T] A07 두 건 | after-only 변경 비전파·선행 완료 대기·추가 의무 시 rerun을 순수 테스트로 검증. 실제 backend 실행 순서 시나리오는 없음 |
| A08 늦은 결과 차단 | [CONTROL], [CHANGE]; [CP-T] graph change fences, [REG-T] cancellation/handle, [K-T] A08 | 모의 runtime+실제 DB에서 변경/fence/늦은 결과와 reuse 취소 경합 검증. 실제 Docker의 늦은 callback 경합 전용 테스트는 없음 |
| A09 실제 격리 | [RUNTIME], [VAL]; [RT-T] 실제 입력 RO, [VAL-T] 실제 후보/입력 RO, 플랫폼 probe | 실제 Docker에서 읽기 전용 입력·socket/DB 미노출·network none 확인. secret/restricted network는 미지원 거절. 두 task 간 공간 공격은 별도 미검증 |
| A10 중단 경합 | [CONTROL], [RUNTIME]; [CP-T] stop failure/capture barrier, [REG-T] forged receipt, [RT-T] stop/capture/missing | 실제 DB와 모의 backend 경합 통과. 실제 Docker 중단+capture+새 attempt도 통과. 제품 resume와 capture 동시 경합은 모의 검증 |
| A11 체크포인트 재개 | [RUNNER], [RUNTIME], [CONTROL]; [RT-T] host/Docker 새 프로세스, [E2E] 앱 suspend/resume | 완료 단계 1회·부분 파일 보존과 앱 controller 재생성 후 같은 workspace·새 fence/컨테이너 재개를 확인. 초기화 작업의 비덮어쓰기, 명시적 agent session, 변경 입력 단계 재평가는 제품 E2E 미검증 |
| A12 안전하지 않은 재개 거절 | [RUNNER], [RUNTIME], [ART]; [A-T] bad capture, [RT-T] snapshot/permit | digest 검사·폐기 permit 거절은 확인. 손상 checkpoint와 부분 manifest를 실제 resume에 주입하는 전용 테스트 없음. 외부 효과 호출 자체가 미지원 |
| A13 명령 경합 | [STORE], [CONTROL], [SCHEMA]; [S-T] 3건, [CP-T] atomic/idempotent activation | 동일 operation 응답·다른 payload 거절·stale revision은 실제 SQLite 연결 검증. 동시 graph proposal 두 개의 전용 CLI 테스트는 없음 |
| A14 제어기 장애 복구 | [STORE], [RUNTIME], [CONTROL]; [RT-T] lost reply/tombstone, [CP-T] restart, [TX-T] commit 후 SIGKILL, [E2E] backend 후 SIGKILL | 실제 commit 후 응답 전과 backend 시작 직후의 강제 종료/복구 통과. 종료 관측과 capture 사이 강제 종료 등 전체 행렬은 미검증 |
| A15 증거 보존 | [ART], [STORE], [CONTROL], [INTEGRITY]; [A-T] corruption, [S-T] reopen/events, [CP-T] adopted corruption, [TX-T] orphan/cursor, [E2E] history/snapshot | 채택된 bytes/report 손상 직후 get.complete=false 및 tick 영속 철회 통과. 실제 CAS 게시 후 DB 채택 전 SIGKILL은 bytes를 미채택 상태로 보존하고 명시적 복구 채택한다. 이벤트 cursor 재조회는 로컬 검증이며 연결 단절 전송 계층은 없음 |
| A16 전체 시나리오 | [PLANNER], [CLI], [CONTROL], [E2E], [RT-T] | 고정 그래프의 독립 실행→중단/재개→입력/spec 변경→선택 재작업→동등 출력 reuse→통합 완료를 하나의 실제 앱 시나리오로 통과. 자연어 목표 분해 provider를 연결한 전체 흐름은 미완료 |

## 4. T01–T19 산출물 상태와 미지원 범위

계획의 경로는 논리적 소유 범위였고 실제 구현에서는 일부 책임을 같은 모듈에 배치했다. 아래의 “구현·검증”은 계획에 적힌 모든 완료 조건을 통과했다는 표시가 아니다.

| 태스크 | 실제 산출물·검증 경로 | 상태 |
|---|---|---|
| T01 계약 schema | [contracts 모델][MODEL], [validation][SCHEMA], [canonical][CANON], [errors][ERRORS]; [C-T], [ERR-T] | JSON 경계·exact ref·digest·공통 오류 구현/단위 검증 |
| T02 기반 결정 | [platform-decision](../../greenfield/platform-decision/README.md); [RT-T], [S-T], [A-T] | 지원 범위 결정·실제 capability probe 기록. 범위 밖 정책은 미지원 |
| T03 graph validator | [kernel/graph.ts][GRAPH]; [K-T] A01/A02 | 구조·참조·DAG·forest 구현/순수 검증 |
| T04 state/outbox | [store][STORE]; [S-T], [CP-T], [TX-T], [E2E] SIGKILL | 실제 SQLite 원자성·중복 제거·재오픈·commit 후 강제 종료 구현/검증. 전체 장애 행렬 미완료 |
| T05 snapshot store | [artifacts][ART], [runtime/files.ts][FILES]; [A-T], [RT-T], [TX-T] | 파일/디렉터리 CAS·mode·빈 디렉터리·손상 거절·crash 뒤 미채택 bytes 보존 검증. orphan GC/참조 기반 삭제 미지원 |
| T06 input resolver | [kernel/inputs.ts][INPUTS]; [K-T] A03/A04/A07, [REG-T] exact revision | snapshot·ready/wait·after 증거 구현/검증 |
| T07 impact analyzer | [kernel/change.ts][CHANGE]; [K-T] A05/A08, [E2E] | 포트 source 영향·보수적 task 전파·독립 경로 유지 구현/검증. leaf 포트 보존 증거 API 없음 |
| T08 rework decider | [kernel/rework.ts][REWORK], [CONTROL]; [K-T], [REG-T], [CP-T] 4모드, [E2E] | 네 판정·모의 호환성 4분기·실제 연속 reuse 검증. 업무 argv 호환성 재검증의 control E2E는 없음 |
| T09 runtime backend | [runtime/docker.ts][RUNTIME]; [RT-T], [E2E] SIGKILL | 신원·관측·중단·tombstone 구현, 모의 장애 및 일부 실제 복구 검증 |
| T10 workspace provider | [RUNTIME], [FILES], [ART]; [RT-T], [VAL-T] 실제 Docker | 제한된 정책의 실제 격리 검증. source snapshot 하나와 일반 파일/디렉터리만 지원 |
| T11 checkpoint runner | [runner.mjs][RUNNER], [RUNTIME]; [RT-T], [E2E] | 로컬 replayable 단계와 실제 앱 중단/재개 검증. 외부 효과·명시적 session adapter 미지원 |
| T12 execution controller | [control][CONTROL], [control model](../../greenfield/control/model.ts); [CP-T], [REG-T], [E2E] | 실행 조정·fence·captureHold 구현, 모의 경합/실제 시작 장애 검증. 전체 장애 행렬 미완료 |
| T13 validation service | [validation][VAL], [source 등록 검증][SOURCES], [schema worker](../../greenfield/validation/schema-worker.ts); [VAL-T], [CP-T] | 실제 schema/bytes·source 계약 validator·Docker argv 검증·증거 보관. 업무별 의미 정확도 평가는 별도 필요 |
| T14 result adopter | [CONTROL], [INPUTS]; [K-T] A02/A04, [CP-T], [REG-T], [E2E] | 채택·group 집계·경합 방지 구현. 실제 실패 integration/부분 산출물 시나리오는 미검증 |
| T15 graph activation | [CONTROL], [CHANGE], [STORE]; [CP-T], [S-T], [E2E] | graph/철회/fence/intent transaction 구현·검증 |
| T16 planner adapter | [planner][PLANNER], [command-source](../../greenfield/planner/command-source.ts); [P-T], [CLI-T] | 목표·분해 요구 protocol·유한 보완 피드백·고정 fixture 평가·trusted host 명령 adapter 구현/검증. 내장 모델 provider와 실제 자연어 분해 품질 평가는 없음 |
| T17 operator interface | [CLI], [CONTROL]; [C-T], [CP-T], [ERR-T], [CLI-T] | CLI subprocess로 example/validate/apply/status/events/import/plan·스케줄 1회·flag 거절 및 실제 Docker run/result를 검증. 제어 명령 전 조합의 CLI E2E는 없음 |
| T18 failure report | [S-T], [A-T], [RT-T], [CP-T], [REG-T], [TX-T], [E2E]; 이 문서 | 모의/실제 장애 증거 분리 기록. 실제 commit/게시/start 직후 강제 종료 통과. 중단·capture·채택 전체 경계의 강제 종료/응답 유실 행렬 미완료 |
| T19 acceptance report | [E2E], [RT-T], [VAL-T], [CLI-T]; 이 문서 | 고정 그래프의 실제 중단/재개·선택 재작업·동등 출력 재사용 종단 흐름 통과. A01–A16의 모든 실패 조건과 자연어 분해 provider까지의 전체 수용은 미완료 |

현재 지원 범위의 경계는 다음과 같다.

- 실행은 digest 고정 Node 24 Linux 컨테이너, network none, secret 없음, 외부 효과 없음, 로컬 replayable argv 단계다. symlink·special file·여러 template source snapshot은 지원하지 않는다. [Runtime 범위](../../greenfield/runtime/README.md)
- JSON Schema는 지원 dialect와 동기 local reference 범위다. remote `$ref`, `$async`, 알려지지 않은 dialect/keyword는 성공으로 처리하지 않는다. argv 검증은 source/bootstrap 없는 별도 검증 공간을 사용한다. [Validator 범위](../../greenfield/validation/README.md)
- planner 명령은 운영자가 선택한 신뢰된 호스트 프로그램이며 task 격리를 적용하지 않는다. LLM 공급자·자동 분해 품질 평가는 포함하지 않는다. [Planner 범위](../../greenfield/planner/README.md)
- snapshot·DB 보존은 로컬 호스트 기준이다. 참조 기반 GC, 다중 지역 저장, 프로세스 메모리/소켓 복원, 모든 실패 경계의 실제 장애 주입은 구현 완료 범위가 아니다.

[MODEL]: ../../greenfield/contracts/model.ts
[CANON]: ../../greenfield/contracts/canonical.ts
[SCHEMA]: ../../greenfield/contracts/validation.ts
[ERRORS]: ../../greenfield/contracts/errors.ts
[GRAPH]: ../../greenfield/kernel/graph.ts
[INPUTS]: ../../greenfield/kernel/inputs.ts
[CHANGE]: ../../greenfield/kernel/change.ts
[REWORK]: ../../greenfield/kernel/rework.ts
[CONTROL]: ../../greenfield/control/agent.ts
[STORE]: ../../greenfield/store/index.ts
[ART]: ../../greenfield/artifacts/index.ts
[RUNTIME]: ../../greenfield/runtime/docker.ts
[FILES]: ../../greenfield/runtime/files.ts
[RUNNER]: ../../greenfield/runtime/runner.mjs
[VAL]: ../../greenfield/validation/index.ts
[SOURCES]: ../../greenfield/validation/sources.ts
[INTEGRITY]: ../../greenfield/control/integrity.ts
[PLANNER]: ../../greenfield/planner/index.ts
[CLI]: ../../greenfield/cli/main.ts
[C-T]: ../../greenfield/contracts/contracts.test.ts
[ERR-T]: ../../greenfield/contracts/errors.test.ts
[K-T]: ../../greenfield/kernel/kernel.test.ts
[S-T]: ../../greenfield/store/store.test.ts
[A-T]: ../../greenfield/artifacts/artifacts.test.ts
[RT-T]: ../../greenfield/runtime/runtime.test.ts
[VAL-T]: ../../greenfield/validation/validation.test.ts
[P-T]: ../../greenfield/planner/planner.test.ts
[CP-T]: ../../greenfield/control/control.test.ts
[REG-T]: ../../greenfield/control/regressions.test.ts
[E2E]: ../../greenfield/test/docker-e2e.test.ts
[TX-T]: ../../greenfield/test/transactions.test.ts
[CLI-T]: ../../greenfield/cli/cli.test.ts
