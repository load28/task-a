# 재현 가능한 테스트 그래프

`createExample(store, image?, options?)`는 source → A → B → C와 독립 D를 만든다.
integration이 C·D를 소비하고 project 그룹은 모든 작업과 integration 완료를 요구한다.
모든 결과는 `data.json`의 `{value:number}`이며 JSON Schema로 검증한다.
기본 입력 1의 A·B·C·D·integration 결과는 각각 2·4·5·100·105이다.

`value`는 source bytes를 바꾼다. `revision`은 그래프 revision을 지정한다.
`aOffset`, `aRevision`은 A 설계 변경 테스트용이며 함께 갱신한다.
`aDelayMs`는 중단 중인 실행을 관측하는 테스트용 지연이다.
독립 D의 명세는 source/그래프 revision 변경에 영향을 받지 않는다.

기본 이미지 digest는 플랫폼 probe에서 실행한 Node 24.15.0 Alpine arm64/v8이다.
amd64는 `NODE24_AMD64_IMAGE`를 명시한다. 부동 태그는 사용하지 않는다.
함수는 테스트 fixture를 생성할 뿐, 목표의 의미를 해석하거나 모델을 호출하지 않는다.
