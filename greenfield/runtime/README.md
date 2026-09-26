# Docker 실행 어댑터

`DockerRuntimeBackend`는 신규 계약 C07–C10을 구현한다. 제어 상태 저장소와 독립된 backend SQLite 파일에 실행 신원, 단일 시작 전달, 철회 tombstone, 마지막 관측, 공간 점유를 저장한다. 기존 제품 구현을 가져오지 않는다.

## 사용과 지원 범위

```ts
import { DockerRuntimeBackend } from "./docker.ts"

const backend = new DockerRuntimeBackend({ root: "/absolute/private/backend" })
const observation = await backend.ensureStarted(launchRequest)
// 제어기는 stopped receipt 이후 captureHold를 유지한 채 snapshot을 확보한다.
const captured = await backend.captureStoppedWorkspace(observation.stopReceipt!)
// 제어기의 CAS가 captured의 private staging을 독립 복사·봉인한다.
backend.close()
```

Node 24가 설치된 digest 고정 컨테이너 이미지를 사용한다. `node` 바이너리, Linux 프로세스 그룹, Docker의 전체 컨테이너 종료 관측이 필요하다. 작업 argv와 bootstrap 단계는 `effectPolicy: replayable`만 지원한다. `network: none`, 빈 `allowedHosts/secretRefs/allowedEffects`를 요구한다. 외부 효과, secret 전달, 제한된 외부 통신, 영수증을 요구하는 단계는 `capability_unsupported`로 시작 전에 거절한다.

공간별 private 디렉터리만 읽고 쓸 수 있다. 입력은 `/inputs/<port>`에 읽기 전용으로 연결한다. 파일 산출물은 그 디렉터리 안의 원래 파일명으로 읽는다. rootfs는 읽기 전용이고 non-root UID, capability 제거, privilege escalation 차단, network 없음, CPU·memory·PID 한도를 설정한다. 제어 DB, backend DB, host socket, 다른 태스크의 공간을 마운트하지 않는다.

Snapshot은 일반 파일·디렉터리, 권한 mode, 빈 디렉터리를 보존한다. symlink와 special file은 거절한다. 입력은 원래 mode로 복원된 CAS pin이어야 한다. 봉인 과정에서 mode가 달라진 CAS 내부 디렉터리를 직접 넘기지 않는다. 첫 구현은 template source snapshot 하나를 workspace root에 복원한다.

## 중단과 복구

생성·시작 전달 전에 intent를 영속화한다. 시작 응답 유실 후 동일 intent는 기존 자원을 관측하며 `docker start`를 다시 보내지 않는다. 외부 요청이 전달됐는지 확정할 수 없는 경계는 `unknown`으로 남는다. 관측 불명만으로 다른 writer를 시작하지 않는다.

중단은 tombstone과 읽기 전용 boot permit 폐기를 먼저 저장한다. 지연된 시작이 도착해도 trusted runner는 폐기된 permit으로 작업을 생성하지 않는다. worker 전체가 종료됐다는 Docker의 정확한 신원·상태·PID 관측이 있어야 종료 receipt를 발행한다. 시작된 컨테이너의 소실은 종료 증거가 아니다. backend 재시작 후에도 tombstone을 유지한다.

Runner는 단계 완료와 출력 digest를 원자적으로 저장한다. SIGTERM 이후 새 단계를 시작하지 않고 자식 프로세스 그룹의 종료를 요청한다. 최종 컨테이너 종료는 backend가 따로 확인한다. 재개는 새 attempt와 새 프로세스이며, 실제 출력 digest가 같은 완료 단계만 생략한다. 프로세스 메모리나 열린 연결을 복원하지 않는다.

## 검증

```sh
node --test greenfield/runtime/runtime.test.ts
TASK_AGENT_DOCKER_TEST=1 node --test greenfield/runtime/runtime.test.ts
```

기본 검증은 중복 시작·응답 유실·재시작·철회·자원 소실·capture 인계·snapshot 무결성과 별도 runner 프로세스 재개를 확인한다. 실제 Docker 검증은 고정 Node 이미지로 중단 후 새 컨테이너에서 부분 파일과 완료 단계를 복원한다. 테스트가 만든 컨테이너는 종료 후 정리한다. 실제 Docker 검증에는 로컬 daemon 접근 권한이 필요하다.
