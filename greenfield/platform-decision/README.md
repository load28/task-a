# T02 — 최초 구현 환경 결정과 capability 검증

결정일: 2026-09-26 · 기준: [신규 계약 C01–C12](../../docs/rebuild/contracts.md), [신규 설계 A01–A16](../../docs/rebuild/architecture.md).

Node.js 24, `node:sqlite`, 로컬 파일 기반 내용 주소 저장소, Docker 격리 backend를 최초 구현에 채택한다.
계약의 지원 범위는 아래에 명시하며 지원하지 않는 실행 정책은 시작 전에 거절한다.
이 문서의 실측은 환경 capability 확인이며 A01–A16의 제품 수용 테스트 전체 통과를 뜻하지 않는다.

## 1. 구현 선택과 책임

| 경계 | 최초 구현 선택 | 선택 근거 | 범위 |
|---|---|---|---|
| 제어기·kernel | Node.js 24, ESM | 별도 native addon 없이 계약과 adapter를 실행 | 실측 기준 v24.15.0 |
| StateStore | `node:sqlite`의 `DatabaseSync` | 상태·이벤트·intent를 한 transaction에 저장 | 단일 호스트의 로컬 DB |
| ArtifactStore·CheckpointStore | SHA-256 파일 CAS | 불변 bytes를 먼저 게시하고 DB에 참조 채택 | 제어기 소유 로컬 파일시스템 |
| RuntimeBackend | Docker Linux container | 별도 작업 공간, 읽기 전용 입력, 네트워크·자원 제한 | 아래의 제한된 capability만 지원 |

SQLite 연결은 `WAL`, `synchronous=FULL`과 유한 busy timeout을 사용한다. 참조 무결성은 계약·그래프 검증기에서 검사한다.
명령의 상태·revision·이벤트·intent 변경은 `BEGIN IMMEDIATE`와 조건부 revision 갱신으로 묶는다.
DB transaction 안에서는 Docker나 검증기 호출을 기다리지 않는다.
`DatabaseSync`는 동기 API이며 v24.15.0의 `node:sqlite` 안정성 표기는 release candidate다.
근거: [Node v24.15.0 SQLite](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html), [SQLite transaction](https://sqlite.org/lang_transaction.html), [SQLite synchronous](https://sqlite.org/pragma.html#pragma_synchronous).

CAS는 같은 파일시스템의 임시 파일에 bytes를 기록하고 file fsync 후 독점적으로 게시한다.
대상 digest가 이미 존재하면 덮어쓰지 않고 내용의 무결성을 확인한다.
게시 후 디렉터리 fsync를 수행하고 그 이후에 DB 참조를 채택한다.
불변성은 저장소 API의 불변 규칙과 worker의 저장소 접근 차단으로 집행하며 파일 mode만으로 보장하지 않는다.
근거: [Node 파일시스템 API](https://nodejs.org/download/release/v24.15.0/docs/api/fs.html).

Docker는 실행 자원만 담당한다. 그래프, 결과 유효성, attempt, fence, 취소 tombstone은 제어기가 소유한다.
Docker 이벤트 알림이나 컨테이너 이름만으로 업무 성공·실행 소유권을 판정하지 않는다.
종료 관측 후 snapshot을 확보하는 동안에도 writer/captureHold를 유지한다.

## 2. 지원 capability와 거절 조건

| 정책 | 최초 지원 범위 | 지원 범위를 벗어날 때 |
|---|---|---|
| 네트워크 | `none`; 외부 연결 없이 로컬 단계 실행 | `restricted`, allowlist, 일반 외부 연결은 `capability_unsupported` |
| secret | secret 없음; 제어기 자격증명·환경을 worker에 상속하지 않음 | secret 주입 요청은 `capability_unsupported` |
| 효과·재개 | checkpoint가 명시된 로컬 replayable 단계 | 외부 효과와 검증되지 않은 재시도 정책은 시작 거절 |
| 격리·자원 | 태스크별 쓰기 공간, 읽기 전용 입력·root, CPU·memory·pids 제한 | 미지원 정책을 무시하지 않고 시작 거절 |

지원하는 네트워크 정책의 이름은 `none`으로 고정한다.
Docker `--network none`은 loopback만 남긴다. 네트워크가 필요한 모델 호출도 이 최초 worker capability에 포함하지 않는다.
근거: [Docker none network](https://docs.docker.com/engine/network/drivers/none/).

작업 공간만 쓰기 가능하게 제공하고 입력 snapshot은 별도 읽기 전용 bind mount로 연결한다.
다른 태스크의 공간, 제어기 DB/CAS 루트, Docker socket, 호스트 관리 경로는 마운트하지 않는다.
비 root UID, `--cap-drop ALL`, `no-new-privileges`, `--read-only`를 기본 실행 조건으로 둔다.
CPU·memory·pids 값은 execution policy에서 명시하며 daemon capability와 실제 적용을 확인한다.
근거: [Docker bind mount](https://docs.docker.com/engine/storage/bind-mounts/), [실행 옵션](https://docs.docker.com/reference/cli/docker/container/run/), [자원 제한](https://docs.docker.com/engine/containers/resource_constraints/).

중단은 SIGTERM으로 checkpoint 저장 기회를 주고 종료를 관측하는 과정이다.
유예 시간 이후 강제 종료되면 checkpoint의 완전성을 별도로 검사한다.
컨테이너 stop 성공 응답만으로 snapshot 확보나 업무 성공을 선언하지 않는다.
재개는 정확한 spec·입력·환경·checkpoint를 고정한 새 attempt와 새 프로세스로 실행한다.
근거: [Docker stop 의미](https://docs.docker.com/reference/cli/docker/container/stop/), [계약 C08–C09](../../docs/rebuild/contracts.md#c08--실행-신원과-실제-상태).

Docker Linux container의 격리 범위를 검증하며 VM 수준의 강한 다중 사용자 격리를 주장하지 않는다.
실행기·도구·snapshot 형식이 추가되면 해당 capability와 검증 증거를 별도로 확장한다.

## 3. 고정 이미지와 로컬 실측 결과

호스트 Node는 `v24.15.0`, 포함된 SQLite는 `3.51.3`이었다.
Docker CLI와 Engine은 `27.4.0`, Docker Desktop은 `4.37.2`였다.
실행 환경은 `linux/arm64`, Linux kernel `6.10.14-linuxkit`, cgroup v2였다.

공식 `node:24.15.0-alpine` registry manifest를 조회하고 다음 참조를 고정했다.

```text
실행 검증한 linux/arm64(v8):
node@sha256:693101c77e947e45e001910202dcb37a659c0b1a4c27619848f1b8b7eaee0def

manifest만 확인한 linux/amd64:
node@sha256:8e2c930fda481a6ec141fe5a88e8c249c69f8102fe98af505f38c081649ea749
```

digest는 registry manifest 식별자다. 컨테이너 inspect의 image config ID와 혼동하지 않는다.
실행 시 태그를 다시 해석하지 않고 플랫폼과 digest를 함께 지정한다.
근거: `docker manifest inspect --verbose node:24.15.0-alpine` 실측, [Docker digest 고정](https://docs.docker.com/reference/cli/docker/image/pull/#pull-an-image-by-digest-immutable-identifier).

| 실측 영역 | 수행한 검사 | 결과 |
|---|---|---|
| SQLite 원자성 | state/event/intent rollback·commit, 두 연결 writer 잠금, stale revision CAS, DB 재오픈 | 통과; 재오픈 값 `[revision=2, events=1, intents=1]` |
| 파일 CAS | 독점 게시, 같은 digest 중복 게시, SHA-256 재읽기, file·directory fsync | 통과; 중복 게시 `EEXIST` |
| Docker 격리·제한 | 입력·root 쓰기 시도, 노출 mount, 외부 연결, cgroup 내부 값 | 통과; 세부 값 아래 기록 |
| 중단·새 프로세스 재개 | SIGTERM checkpoint, 정확한 컨테이너 종료 확인, 새 컨테이너 복원 | 통과; 세션·완료 단계·마지막 tick 보존 |

Docker probe는 독립된 임시 폴더와 전용 컨테이너만 사용했다.
다음 실행 설정을 적용했다.

```text
--platform linux/arm64 --init --restart no --user 1000:1000
--read-only --cap-drop ALL --security-opt no-new-privileges
--network none --cpus 0.5 --memory 64m --memory-swap 64m --pids-limit 32
/input: 전용 입력 폴더의 read-only bind mount
/work: 전용 작업 폴더의 writable bind mount
/tmp: 16 MiB tmpfs
```

컨테이너 내부 실측은 Node `v24.15.0`, UID `1000`, 입력·root 쓰기 거절이었다.
다른 공간과 Docker socket은 노출되지 않았고 네트워크 인터페이스는 `lo`만 존재했다.
외부 주소 연결은 `ENETUNREACH`로 실패했다.
`cpu.max=50000 100000`, `memory.max=67108864`, `pids.max=32`를 내부에서 읽었다.
이는 자원 정책의 cgroup 적용 확인이며 의도적인 OOM이나 CPU 부하 시험은 수행하지 않았다.

`docker stop --time 5` 이후 inspect 결과는 `Running=false`, `Status=exited`, `Pid=0`, `ExitCode=0`이었다.
종료 시간은 `2026-09-26T12:51:14.620244793Z`였다.
SIGTERM handler는 `session=saved-session`, `completed=[probe]`, `tick=135`를 파일에 저장했다.
새 컨테이너가 이 파일을 읽고 세션·완료 단계·마지막 작업 파일의 동일성을 확인했다.
프로세스 메모리나 열린 연결을 복원하는 시험은 아니다.

## 4. 검증 제한과 구현 인계

첫 Docker 접근은 sandbox socket 제한으로 실패했다.
승인된 실행에서 daemon 미기동을 확인했고 Docker Desktop을 시작한 뒤 정상 연결을 확인했다.
자동 승인 검토의 거절은 없었다. 실패했던 `docker info`의 빈 값은 capability 부재로 해석하지 않았다.

probe 컨테이너 두 개는 검증 후 제거했다. 내려받은 고정 Node 이미지는 구현 검증에 재사용할 수 있도록 남겼다.
호스트 SQLite와 CAS 시험의 임시 파일은 제거했다. Docker probe 임시 폴더도 결과 기록 후 제거한다.
기존 Docker 이미지·컨테이너의 설정이나 내용은 변경하지 않았다.

RuntimeBackend는 이 문서의 실측과 별개로 intent 중복 전달, 취소 tombstone, fence, captureHold를 검증해야 한다.
StateStore는 실제 제어기 장애를 주입해 상태·이벤트·intent의 원자성 및 복구를 검증해야 한다.
CAS는 snapshot 경로 검증, 심볼릭 링크·경로 탈출 거절, 무결성 확인, 참조 보존 규칙을 구현해야 한다.
T02의 환경 capability 확인을 제품 계약의 구현 완료로 대체하지 않는다.
