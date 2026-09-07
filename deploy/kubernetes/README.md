# Kubernetes task instances

실행 하위 태스크마다 `TaskInstance → Pod + PVC`를 생성한다. 대화 세션과 호스트 체크아웃은 실행 환경을 소유하지 않는다. 로컬 kind와 서버 클러스터는 같은 CRD·컨트롤러·Helm 차트를 사용한다.

## 로컬 설치와 실행

Docker Desktop, kind, kubectl, Helm이 필요하다. 기본 테스트 클러스터는 `task-agent-local`, namespace는 `task-agent`다.

```sh
kind create cluster --name task-agent-local --wait 120s
docker build -f deploy/kubernetes/Dockerfile -t task-agent-instances:local .
kind load docker-image task-agent-instances:local --name task-agent-local
helm upgrade --install task-instances deploy/kubernetes/chart \
  --kube-context kind-task-agent-local --namespace task-agent --create-namespace
export TASK_INSTANCE_CONTEXT=kind-task-agent-local
export TASK_INSTANCE_NAMESPACE=task-agent
npm run instances -- create deploy/kubernetes/example.json
npm run instances -- status example-durable-task
npm run instances -- suspend example-durable-task
# status.phase가 Suspended가 된 후 실행한다.
npm run instances -- resume example-durable-task 2
npm run test:kubernetes
```

`resume`에는 다음 실행 번호를 명시한다. 같은 번호의 재전송은 새 실행을 만들지 않는다. 기존 태스크와 다른 이미지·단계·출발 커밋을 전달하면 생성 요청을 거부한다. 배포를 갱신할 때 Helm은 기존 CRD를 자동 갱신하지 않으므로 먼저 `kubectl --context kind-task-agent-local apply -f deploy/kubernetes/chart/crds`를 실행한다.

## 실행과 복구 계약

- `/data/workspace`에 코드와 미커밋 변경, `/data/home`에 OpenCode 세션 데이터, `/data/checkpoint.json`에 완료 단계·실행 중 단계·시도 횟수를 보존한다. 저장은 fsync와 atomic rename을 사용한다.
- 초기 코드는 `repository.url`(HTTPS)과 `repository.commit`(정확한 커밋 해시)로 가져온다. 호스트의 미커밋 변경은 자동으로 포함하지 않는다. 필요하면 먼저 출발 커밋으로 보존하고 해당 저장소에서 가져올 수 있게 해야 한다.
- 단계는 shell 문자열이 아닌 argv 배열이다. 이미지에 필요한 언어 도구를 설치한다. OpenCode 단계도 `opencode run` 명령으로 실행할 수 있으며, 후속 단계에서 `--continue`로 저장된 세션을 사용한다. 인증과 `OPENCODE_CONFIG_CONTENT` 같은 연결 설정은 `envSecret`으로 주입한다. CRD에는 자격 증명을 넣지 않는다.
- 중단은 프로세스 종료를 요청하고 Pod가 실제로 사라질 때까지 `Suspending`으로 둔다. 완료 단계는 재실행하지 않는다. 중단된 단계는 처음부터 명령을 다시 호출하므로 `/data/resume.json`과 부분 변경을 검사해 이어가도록 명령을 작성해야 한다. 프로세스 메모리·진행 중 명령을 복원하는 기능은 아니다.
- 컨트롤러 재시작은 기존 Pod를 관찰한다. 실행 번호가 같은 완료 Pod는 다시 만들지 않는다. 기록된 Pod/PVC가 사라지면 `RecoveryRequired`로 표시한다. 노드 장애에서 시간 경과만으로 새 작업자를 띄우거나 강제 삭제하지 않는다. 운영자가 기존 실행 종료와 스토리지 복구를 확인해야 한다.
- 컨트롤러는 namespace당 하나를 운영하며 `controller.maxWorkers`로 동시 작업 수를 제한한다. 작업자에는 Kubernetes 서비스 계정 토큰을 주입하지 않는다.

## 기존 태스크 그래프 연결

Graph MCP 프로세스를 아래 환경으로 실행하면 `task_instance_create/status/suspend/resume/delete`가 추가된다. `task_instance_create`는 존재하는 실행 가능한 말단 태스크만 허용한다. `spec.taskId`는 그래프 ID와 일치해야 한다.

```sh
TASK_INSTANCE_BACKEND=kubernetes \
TASK_INSTANCE_CONTEXT=kind-task-agent-local \
TASK_INSTANCE_NAMESPACE=task-agent \
node scripts/graph-mcp.ts /absolute/path/to/tasks.db
```

서버의 Graph MCP에서는 `TASK_INSTANCE_CONTEXT`를 생략하고 전용 ServiceAccount에 TaskInstance get/create/update/delete 권한을 부여한다. 작업자는 중앙 Graph MCP에 연결해 기존 작업 상태·완료 조건을 조회하고 실제 증거를 기록해야 한다. Pod의 `Completed`는 명령 단계 성공을 뜻하며 그래프의 검증 완료를 대신하지 않는다. 독립 저장소의 결과 커밋은 기존 통합 절차로 반영해야 한다. 이 모듈은 자동 merge/push를 수행하지 않는다.

기존 호스트 실행은 설정을 바꾸기 전까지 유지된다. 기존 로컬 실행 세션이나 워크트리를 새 PVC로 자동 이전하지 않는다.

호스트 연결도 전환하려면 `npm run host:install -- --kubernetes-namespace task-agent --kubernetes-context kind-task-agent-local`을 사용한다. 이 설정은 호스트가 시작하는 Graph MCP에 Kubernetes 연결을 전달하고, 매니저의 실행 위임을 인스턴스 도구로 전환한다. 기존 OpenCode 서버 설정 변경은 기존 실행을 중단하고 호스트 서비스를 재시작한 뒤 적용한다. 모델 인증 Secret과 작업용 이미지·저장소 접근을 먼저 준비한다. 원격 Graph MCP는 서버 쪽에도 위 환경 변수를 설정해야 한다.

## 서버 배포와 삭제

서버에서도 같은 이미지와 차트를 사용한다. 레지스트리에 올린 이미지 digest를 `image` 및 각 `spec.image`로 지정하고, `spec.storage.className`으로 서버의 StorageClass를 선택한다. 공유 파일시스템에 SQLite 파일을 직접 여러 작업자에게 열지 말고 중앙 Graph MCP를 사용한다. 저장소 접근과 모델 인증은 서버 namespace의 Secret으로 구성한다.

`instances delete <taskId>`는 finalizer로 Pod 종료를 기다린다. `deletionPolicy: Retain`은 PVC를 남기고, `Delete`는 PVC까지 제거한다. PVC에는 CR 소유자 참조를 걸지 않아 CR 삭제로 보존 데이터가 연쇄 삭제되지 않는다. 보존 PVC는 삭제 전 status의 `volumeName`으로 찾는다. 이 삭제는 suspend와 달리 동일 ID 자동 재개용이 아니며, 보존 데이터 복구에는 운영자 연결이 필요하다.

kind 클러스터 자체를 삭제하면 로컬 노드의 볼륨도 잃는다. 서버 이전은 태스크 DB와 볼륨의 별도 백업·복구가 필요하다. 컨트롤러/CRD 제거 전에 실행 인스턴스를 중단하고 정리한다.

검증: `npm run check`는 컨트롤러 상태 전이와 실제 프로세스 중단·재개를 검사한다. `npm run test:kubernetes`는 독립 CLI 프로세스에서 suspend/resume, 컨트롤러 Pod 재시작, PVC 재사용, 완료 단계 중복 방지와 Delete 정책을 실제 클러스터에서 검사한다.

참고: [Custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), [Persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).
