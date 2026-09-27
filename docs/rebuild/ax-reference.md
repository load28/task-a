# AX 참고 분석: 신규 태스크 에이전트의 계약 경계

AX에서 실행 단위, 환경 명세, runner 계약, 제어 루프의 분리를 참고한다.
태스크 그래프와 변경 전파 규칙은 신규 시스템의 독립된 계약으로 정의한다.

## 1. 조사 기준과 AX가 제공하는 범위

- 조사일: 2026-09-26.
- 고정 참조: [`google/ax` 커밋 `d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9`](https://github.com/google/ax/commit/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9).
- 조사 대상: 공식 문서, 공개 API 스키마, 서버, 저장소, controller, runner 코드.
- 이 문서는 고정 원본의 분석 근거다. 이후 결정한 코드 도입 범위는 [AX 원본 우선 도입 설계](ax-implementation-adoption.md)를 따른다.

이하 **확인 사실**은 위 커밋의 문서나 코드에서 직접 확인한 내용이다.
**설계 해석**은 그 사실을 바탕으로 신규 시스템에 제안하는 원칙이다.
설계 해석을 AX가 제공하는 기능이나 보장으로 읽어서는 안 된다.

**확인 사실 — AX의 기본 단위는 격리 실행이다.**
Task는 이미지, 명령, 환경 변수, 자원 요청과 제한, Workspace 참조를 갖는다.
Workspace는 Git 저장소, 파일, 도구와 스킬 구성을 표현하는 재사용 가능한 환경 명세다.
같은 Workspace를 여러 Task가 참조해도 각 sandbox 내부에 환경을 구성한다.
근거: [개념 문서](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/concepts.md#L5-L32), [API 스키마](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/pkg/apis/v1alpha1/ax.proto#L62-L158).

**확인 사실 — AX는 태스크 계획의 형태를 직접 모델링하지 않는다.**
개념 문서는 계획, 위임, 재시도, 분기 등의 구성을 에이전트가 조합하도록 맡긴다.
Task 스키마에는 의존성 간선, 입력·출력 계약, 계약 revision, 변경 전파 규칙이 없다.
근거: [Task의 범위](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/concepts.md#L7-L9), [TaskSpec과 TaskStatus](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/pkg/apis/v1alpha1/ax.proto#L70-L114).

**설계 해석 — 실행 모델과 업무 모델을 구분한다.**
업무의 목표와 검증 조건은 태스크 계약이 소유한다.
개별 실행의 생명주기와 자원은 실행 계약이 소유한다.
DAG의 적합성, 실행 가능 여부, 변경 영향은 그래프 계약이 소유한다.
이 책임 구분은 특정 실행 backend의 선택과 무관하다.

## 2. 차용할 원칙: 작은 실행 단위와 명시적 경계

### 2.1 실행 명세와 환경 명세를 분리한다

**확인 사실.** Task의 Workspace 바인딩은 이름, 경로, 환경 준비 목표를 가진다.
각 환경은 별도 경로에 구성되며 첫 번째 경로가 명령의 작업 디렉터리가 된다.
근거: [WorkspaceRef](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/pkg/apis/v1alpha1/ax.proto#L70-L102).

**설계 해석.** 재사용할 환경 정의와 실행마다 할당할 작업 공간을 별개 자원으로 둔다.
환경 정의를 공유하더라도 실행 중 변경 가능한 파일과 진행 상태의 소유자는 명확해야 한다.
환경의 이름만으로 재현성을 보장하지 않고, 실행이 사용한 환경 revision을 기록한다.

### 2.2 runner가 지켜야 할 계약을 먼저 정의한다

**확인 사실.** AX runner는 명세 수신, 환경 준비, 명령 감독, 상태 관찰 접점을 제공한다.
기본 runner를 교체해도 제어 평면과 합의한 실행 계약을 지켜야 한다.
근거: [runner 역할과 실행 인터페이스](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/runner.md#L1-L24).

**설계 해석.** 실행 adapter에 준비, 시작, 관찰, 중단, 복원, 정리의 의미를 명시한다.
각 요청의 성공 조건, 반복 요청의 결과, 실패 상태를 계약에 포함한다.
실제 실행 방식은 [AX 원본 우선 도입 설계](ax-implementation-adoption.md)의 Substrate actor와 AX runner를 따른다.

### 2.3 준비 완료와 업무 완료를 구분한다

**확인 사실.** AX는 WorkspaceReady와 Ready 조건을 구분한다.
runner는 명령이 끝난 뒤에도 관찰을 위해 살아 있으며 제어 평면은 명령 종료 코드를 읽지 않는다.
근거: [준비 조건](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/concepts.md#L11-L20), [명령 종료 이후의 runner](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/runner.md#L41-L45).

**설계 해석.** 환경 준비, 실행 생존, 명령 종료, 결과 검증을 서로 다른 사실로 기록한다.
하위 태스크의 시작 조건은 선행 실행의 생존 상태가 아니라 검증된 결과를 기준으로 한다.
명령의 종료 코드가 성공이어도 산출물이 계약을 만족하는지는 별도로 판정한다.

### 2.4 저장된 의도에서 실행 상태를 수렴시킨다

**확인 사실.** AX 서버는 자원을 저장하고 이벤트를 발행하며 controller가 실행 자원을 조정한다.
태스크 저장과 reconcile 이벤트 발행은 Redis transaction에 함께 묶인다.
근거: [구성요소의 책임](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/DESIGN.md#L36-L43), [저장과 이벤트 발행](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/store/redis/store.go#L122-L175).

**설계 해석.** 사용자 명령의 접수와 실제 실행 완료를 구분한다.
저장된 의도를 기준으로 재조정할 수 있어야 하며 이벤트는 조정을 깨우는 수단으로 사용한다.
저장소와 메시지 전달 방식은 미정이며 원자성·복구성 요구를 먼저 확정한다.

## 3. 보강할 계약: 관찰 상태, 중단 의미, 동시성

### 3.1 목표 상태와 관찰 상태를 별도로 저장한다

**확인 사실.** AX SuspendTask와 ResumeTask는 status.phase를 즉시 변경한다.
reconciler는 같은 필드를 실행 의도로 읽고 실제 actor의 중단·재개를 요청한다.
중단 요청의 실패는 경고를 남기지만 이후 상태는 Suspended로 기록한다.
근거: [서버 상태 변경](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/server/server.go#L167-L215), [중단·재개 처리](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/controller/reconciler.go#L192-L216).

**설계 해석.** desiredState와 observedState를 구분한다.
요청된 변경의 세대와 관찰이 반영한 세대를 연결한다.
중단 요청 접수는 중단 완료가 아니며 실패 시 미완료 사실과 원인을 보존한다.

### 3.2 중단·재개의 보존 대상을 명시한다

**확인 사실.** AX 문서는 /workspace를 복원한 새 컨테이너에서 프로세스 트리가 새로 시작된다고 설명한다.
중단 시 SIGTERM을 전달하고 필요한 상태를 저장한 뒤 종료하는 책임은 runner와 에이전트에 있다.
기본 runner는 명령의 프로세스 그룹에 종료 신호를 보내고 유예 시간이 지나면 강제 종료한다.
근거: [복원과 종료 계약](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/runner.md#L26-L45), [프로세스 그룹 종료 구현](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/runner/runner.go#L211-L233).

**설계 해석.** 파일 보존, 에이전트 문맥 저장, 실행 위치 복원, 메모리 복원을 구별한다.
재개가 어느 상태에서 다시 시작하는지와 checkpoint의 완전성을 확인하는 조건을 정한다.
checkpoint가 불완전하면 재개 성공으로 표시하지 않는다.
외부 시스템에 이미 발생한 효과의 재실행 여부도 별도 계약으로 다룬다.

### 3.3 오래된 실행의 쓰기를 차단한다

**확인 사실.** 확인한 Redis 상태 갱신은 자원을 읽은 뒤 수정된 전체 값을 저장한다.
해당 경로에는 revision 조건부 갱신이나 실행 소유권 token 검사가 없다.
근거: [UpdateTaskStatus](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/store/redis/store.go#L259-L280).

**설계 해석.** 계약 revision, 실행 attempt, 실행 소유권을 구별한다.
상태와 산출물의 제출은 현재 attempt 및 소유권과 일치할 때만 수락한다.
소유권을 잃은 실행의 늦은 응답이 새 결과를 덮어쓰지 못하도록 fencing 조건을 둔다.

### 3.4 이벤트 전달과 복구 보장을 구분한다

**확인 사실.** AX worker는 reconciliation 실패에도 이벤트를 ACK한다.
Redis consumer는 새 이벤트를 읽으며 해당 구현에는 pending 이벤트 재확보 절차가 없다.
새 consumer group은 stream 끝에서 시작하고 WatchTask는 Pub/Sub으로 상태를 전달한다.
근거: [worker 처리와 ACK](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/controller/worker.go#L64-L103), [consumer 구현](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/store/redis/store.go#L590-L660), [WatchTask](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/internal/store/redis/store.go#L682-L705).

**설계 해석.** 이벤트 저장, 처리 소유권, ACK 조건, 재전달, 재시도 한계를 명시한다.
중복 수신을 전제로 효과의 멱등성을 보장하고 서버 재시작 후 미완료 작업을 복구한다.
화면에 전달하는 알림과 복구의 근거가 되는 영속 기록을 구분한다.

## 4. 도입 결정과 신규 설계 영역

**AX의 내부 기술과 실행 구현을 채택한다.**
2026-09-27 사용자 결정에 따라 Kubernetes, Redis, Agent Substrate와 AX 원본 실행 구조를 유지한다.
이 결정은 신규 시스템의 계약을 완화하지 않으며 미지원 범위는 별도로 명시한다.
근거: [AX 구성](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/DESIGN.md#L3-L43).

**로드맵을 현재 보장으로 차용하지 않는다.**
메모리와 파일을 포함하는 stateful branching, 자동 유휴 중단은 조사 시점의 로드맵 항목이다.
근거: [Actor Architecture 로드맵](https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/docs/roadmap.md#L17-L23).

**DAG와 변경 전파는 신규 설계에서 책임진다.**
태스크 계약의 입력·출력·검증 조건, 의존 간선의 의미, 순환 금지 규칙을 정의한다.
입력 revision과 산출물 식별값을 기록하고 변경 시 영향받는 하위 태스크를 계산한다.
무효화된 결과를 참조한 실행의 중단·폐기·재실행 조건을 결정한다.
변경되지 않은 입력에 대한 재사용 가능 여부도 명시적으로 판정한다.

**확인 사실과 채택 결정을 혼동하지 않는다.**
이 문서의 설계 해석은 이후 계약의 검토 근거이며 독립적인 기능 명세를 대신하지 않는다.
각 기능의 수용 조건은 신규 계약과 그 계약을 검증하는 시나리오에서 확정한다.
