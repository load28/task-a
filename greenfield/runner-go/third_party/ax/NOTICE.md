# AX 코드 차용 기록

원본: https://github.com/google/ax/blob/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9/runner/runner.go

Copyright 2026 Google LLC. Apache License 2.0. 원본 라이선스는 이 폴더의 LICENSE에 보존한다.

차용 위치: `supervisor/supervisor.go`의 명령 시작·프로세스 그룹·종료 대기·SIGTERM/SIGKILL 처리.

변경: AX의 Task/Workspace/gRPC/metadata 의존성을 제거하고 우리 단계 실행 인수·작업 폴더·환경·스트림을 받는다. grace period를 설정으로 받으며 완료 코드를 반환한다. 중단 시 leader만 먼저 종료해도 남은 process group을 정리한다. 전체 컨테이너 종료 증거와 checkpoint는 기존 RuntimeBackend가 담당한다.

AX 제품·서버·Redis·Agent Substrate를 이 모듈의 실행 의존성으로 설치하지 않는다. 표준 Go 라이브러리만 사용한다.
