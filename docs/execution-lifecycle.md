# 실행 설정과 완료 판정

## 보관 저장소는 운영 설정이다

Graph MCP의 `task_instance_create.spec`는 `archive`를 받지 않는다. 운영자가 설정한 `TASK_INSTANCE_ARCHIVE_CLAIM`에서 보관 볼륨과 정리 정책을 주입한다. 직접 사용하는 InstanceManager/TaskInstance API는 보관 설정을 지원하지만 생성과 재개 시 해당 네임스페이스의 PVC 존재 여부, 삭제 여부, Lost 상태를 검사한다. Pending PVC는 WaitForFirstConsumer 바인딩을 지원하기 위해 허용한다.

Graph MCP는 그래프 작업을 점유하기 전에 사전 검사를 수행한다. Kubernetes와 SQLite 사이에는 분산 트랜잭션이 없으므로 컨트롤러도 실행 직전에 모든 마운트 대상 PVC를 검사한다. 기존의 잘못된 인스턴스는 `Blocked/ArchiveUnavailable` 상태와 PVC 이름을 노출한다. 설정을 바꾸거나 임의의 볼륨을 생성하지 않는다. 운영자가 해당 저장소를 복구하면 다음 조정에서 진행한다.

## 대기는 실패 이유를 보존한다

Pending Pod의 PodScheduled=False 조건 및 초기화/작업 컨테이너의 waiting reason/message를 TaskInstance 상태에 전달한다. 스케줄링 문제는 일시적일 수 있으므로 곧바로 실행 실패로 확정하지 않는다. Running으로 전환하면 이전 대기 진단을 제거한다. Graph MCP 상태 조회 결과의 진단은 호스트 진행 상태에도 표시한다.

## 관리자 응답 종료는 작업 완료가 아니다

호스트는 요청에서 생성·재개한 실행의 논리 태스크 ID를 저장한다. 관리자 응답이 종료되면 해당 그래프 태스크의 verified/integrated 상태를 검사한다. 미완료 작업은 같은 요청·세션에서 후속 메시지로 계속 확인한다. 메시지 ID와 prepared 상태를 전송 전에 저장하여 호스트 재시작 시 중복 제출을 방지한다. 후속 요청에는 기존 실행을 유지하고 실제 결과를 확인하도록 지시한다. 실패·차단으로 끝난 그래프 작업은 성공으로 기록하지 않는다.

원격 Graph MCP만 연결되어 호스트가 완료 상태를 확인할 수 없는 경우에는 interrupted로 기록한다. 현재 자동 후속 실행은 로컬 그래프 DB를 읽을 수 있는 구성에서 지원한다.

Kubernetes 작업의 task_complete는 산출물 종류와 무관하게 현재 run의 성공 종료를 요구한다. 코드 산출물에는 기존 입력 스냅샷 및 코드 증빙 검사도 적용한다.
