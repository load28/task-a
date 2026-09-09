#!/usr/bin/env python3
"""구현 명세의 원문 대응 산출물을 재생성하고 행·필드 누락을 검증한다. 애플리케이션 구현은 변경하지 않는다."""
from pathlib import Path
import csv
import hashlib
import html
import json
import re
from collections import Counter

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent
SOURCES = {'A': 'energy-efficient-graph-agent.md', 'B': 'adaptive-task-replanning.md'}
LEDGERS = {'A': 'energy-line-ledger.md', 'B': 'replanning-line-ledger.md'}
ATTACHMENTS = {
 'A': Path('/Users/seominyong/.codex/attachments/8b0460df-1123-4fd5-83de-24f8855ca680/pasted-text.txt'),
 'B': Path('/Users/seominyong/.codex/attachments/3d8e2cff-3806-49f0-ab69-bd898bef3c91/pasted-text.txt'),
}
MODULES = {
 'CP': ('packages/task-engine/src/index.ts', 'packages/task-control/src'),
 'CG': ('packages/task-engine/src/signals.ts', 'packages/task-causality/src'),
 'AP': ('packages/task-domain/src/index.ts', 'packages/task-cognition/src'),
 'CM': ('packages/task-context/src/index.ts', 'packages/task-context/src'),
 'EV': ('packages/integration-engine/src/index.ts', 'packages/task-evidence/src'),
 'PL': ('packages/task-engine/src/feedback.ts', 'packages/task-policy/src'),
 'EX': ('packages/opencode-harness/src/graph-mcp.ts', 'packages/opencode-harness/src 및 packages/task-instances/src'),
 'ST': ('packages/task-store/src/index.ts', 'packages/task-store/src'),
}

def read_tsv(name):
 with (BASE/name).open(encoding='utf-8', newline='') as f:
  return list(csv.DictReader(f, delimiter='\t'))

rows = read_tsv('requirements.tsv')
requirements = {r['id']: r for r in rows}
assert len(requirements) == len(rows) == 158
assert all(all(r[k] for k in r) for r in rows)
fields = {r['field']: r['contract'] for r in read_tsv('schema-field-contracts.tsv')}
assert len(fields) == len(read_tsv('schema-field-contracts.tsv'))
semantic_rows = read_tsv('semantic-line-contracts.tsv')
semantic = {(r['requirement'], r['text']): r['contract'] for r in semantic_rows}
assert len(semantic) == len(semantic_rows)
semantic_used = set()

def escape(s):
 # 한국어는 실제 문자로 유지한다. 표 구분자와 HTML 특수문자만 escape한다.
 return html.escape(s, quote=False).replace('|', '&#124;').replace('`', '&#96;')

def link(path, line=None):
 return f'{path.resolve()}' + (f':{line}' if line else '')

def reqid(doc, number):
 whole, *fraction = number.split('.')
 return doc + whole.zfill(2) + ('.'+fraction[0] if fraction else '')

def section_spans(doc, lines):
 starts = [(1, doc+'00', '제목·초록')]
 for i, line in enumerate(lines, 1):
  m = re.match(r'^# (\d+(?:\.\d+)?)\.?\s+(.+)$', line)
  if m:
   starts.append((i, reqid(doc, m.group(1)), m.group(2)))
 spans=[]
 for k, (start,rid,title) in enumerate(starts):
  end=starts[k+1][0]-1 if k+1<len(starts) else len(lines)
  assert rid in requirements, rid
  spans.append({'start':start,'end':end,'id':rid,'title':title})
 return spans

ENUM_CONTRACTS = {
 'Task.status': {
  'created':'기존 pending에 대응하며 기대·입력·의무 준비 전에는 실행할 수 없다.',
  'ready':'dependency와 admission의 준비 상태를 구분한다. ready 자체는 모델 실행 허가가 아니다.',
  'running':'허가된 implementation attempt만 해당 상태를 갖고 role review run과 구분한다.',
  'blocked':'해결할 dependency/의무/실패 근거와 unblock event를 유지한다.',
  'review':'implemented 이후 local/role/integration 검증 의무가 남은 상태로 대응한다.',
  'completed':'최신 입력과 모든 완료 conjunction 충족 후에만 task/goal 완료를 판정한다.',
  'failed':'실패 evidence와 attribution을 기록하고 해당 영향 영역만 복구한다.',
 },
 'AgentState': {
  'dormant':'등록 역할에 실행 세션이 없는 기본 상태다.',
  'candidate':'신호가 일치했지만 activation score/필수 조건/자원 허가 전인 상태다.',
  'active':'단일 사용 grant와 pinned context/profile로 실행 중이다.',
  'waiting':'증거·자원·종료 event를 기다리며 모델 polling을 하지 않는다.',
  'completed':'해당 run의 terminal 기록을 유지하고 역할은 다시 dormant가 된다.',
 },
 'Evidence.type': {
  'test':'실제 validator 실행 receipt·입력·결과·범위와 연결한다.',
  'code':'실제 content/tree hash와 artifact version을 확인한다.',
  'document':'문서 내용 hash·출처·version·적용 범위를 고정한다.',
  'runtime':'실행 observation·시각·환경·producer attempt를 연결한다.',
  'research':'외부 출처·관찰시각·만료/재검증 조건을 저장한다.',
  'user':'명시 목표·요구·권한의 원문과 시점을 보존한다.',
  'agent':'모델 판단 evidence이며 실제 실행/동등성 증명의 대체물이 아니다.',
 },
 'FailureType': {
  'missed_activation':'과거 skip과 나중 실패의 인과 근거를 연결한다.',
  'unnecessary_activation':'실질 가치와 필수 assurance를 평가한 후 낭비로 귀속한다.',
  'bad_reasoning':'충분하고 유효한 context에서도 판단이 틀린 근거를 확인한다.',
  'insufficient_context':'필요한 정보가 selector/budget에서 누락됐는지 manifest로 확인한다.',
  'stale_context':'당시 사용한 evidence/dependency vector의 유효성 위반을 확인한다.',
  'bad_decomposition':'분할/결합/경계가 실패를 만든 구조 근거를 확인한다.',
  'integration_failure':'정확한 조합 tuple과 충돌 dimension 및 원인 lineage를 남긴다.',
  'validation_gap':'필요 validator/시나리오/조합 의무의 누락 근거를 남긴다.',
  'bad_policy':'당시 불변 정책 버전의 판단 오류를 재생하고 후보 수정에 연결한다.',
 },
 'PolicyProposal.target': {
  'activation':'역할 trigger/weight/threshold/cooldown/quota 평가·shadow·승격 대상이다.',
  'context':'selector·budget allocation·summary hierarchy 정책의 평가·승격 대상이다.',
  'validation':'필수 검증 coverage를 약화하지 않는 validator 선택 정책을 평가한다.',
  'decomposition':'split/chunk의 비용·품질·scope 검증 정책을 평가한다.',
  'role':'capability/prompt/schema/validator/lifecycle 정책을 평가한다.',
  'integration':'공유 boundary 탐지·조합 시나리오·통합 의무 정책을 평가한다.',
 },
 'ChangeSignature.scope': {
  'syntactic':'관찰 의미 view 보존 근거가 있을 때만 관련 cognition을 유지한다.',
  'implementation':'실제 behavior/implementation 소비 포트로만 전파하되 unknown은 보수 처리한다.',
  'behavior':'행동·오류·시간 제약의 소비 관계와 validation/integration을 따라간다.',
  'contract':'required port·공유 contract·implements·integration 관계를 추적한다.',
  'dependency':'추가/제거/변경된 실제 input/resource/tool/environment binding을 전파한다.',
  'assumption':'해당 AssumptionVersion의 소비 node와 그 결과 의존에 전파한다.',
  'subgoal':'변경 subgoal subtree 및 외부 인과 관계의 영향만 계산한다.',
  'goal':'승인 objective 변화의 관련 계층·derived/assumes/depends 관계를 재검토한다.',
 },
}

PRINCIPLES = {
 1:('A09','휴면과 grant 없는 실행 금지'), 2:('A03.2','의미 변화 event만 계산 재평가'),
 3:('A15','역할별 국소 context'), 4:('A13','결정론적 검증 우선'),
 5:('A14','실제 profile을 갖는 L0–L5'), 6:('A05','typed 교차 의존 그래프'),
 7:('A19','통합을 독립 검증 의무로 관리'), 8:('A38','evidence-based escalation'),
 9:('A32','유효 dependency vector의 인지 재사용'), 10:('A28','낭비 활성화의 근거 있는 학습'),
 11:('A28','놓친 활성화와 나중 실패의 인과 학습'), 12:('A30','사례 이름이 아닌 구조 규칙 학습'),
}
COGNITIVE_ROWS = {
 'Goal':'TaskSpecVersion의 상위 objective', 'Subgoal':'하위 계층 objective 및 planning boundary',
 'Event Model':'불변 PlanRevision과 현행 plan head', 'Prediction':'실행 전 ExpectationVersion',
 'Prediction Error':'PredictionErrorVersion의 C/B/D/G 및 SPE', 'Event Boundary':'PlanningBoundaryVersion 및 BoundaryProof',
 'Task Switching':'scoped ReplanLease와 plan revision 교체', 'Switching Cost':'전환·중단·재실행·context의 CostEstimate',
 'Cognitive Chunk':'내부 계보·검증을 보존한 RoutineVersion', 'Hierarchical Behavior':'goal/subgoal/task/action 계층',
 'Selective Attention':'causal task eligibility와 dormant 상태', 'Cognitive Control':'versioned activation/replanning policy',
 'Replay':'prioritized ReplayJob와 snapshot 재검증',
}

all_records=[]
all_spans=[]
field_occurrences=[]
enum_occurrences=[]
formula_blocks=[]
source_manifest={}
for doc, filename in SOURCES.items():
 path=BASE/filename
 raw=path.read_bytes()
 lines=raw.decode('utf-8').splitlines()
 assert len(lines)==({'A':2479,'B':2518}[doc])
 digest=hashlib.sha256(raw).hexdigest()
 original=ATTACHMENTS[doc]
 if original.exists():
  assert original.read_bytes()==raw, f'첨부와 복사본 다름: {doc}'
 source_manifest[doc]={'path':filename,'sha256':digest,'logicalLines':len(lines),'bytes':len(raw),'terminalNewline':raw.endswith(b'\n')}
 spans=section_spans(doc, lines)
 all_spans.extend((doc,s) for s in spans)
 owners={i:s for s in spans for i in range(s['start'],s['end']+1)}
 assert list(owners)==list(range(1,len(lines)+1))
 code=None
 typename=None
 enumkey=None
 formula_start=None
 active_principle=None
 detail=[]
 for i,line in enumerate(lines,1):
  s=owners[i]; r=requirements[s['id']]; clean=line.strip()
  kind='설명·요구'
  decision=r['implementation']
  field=None
  enum=None
  if clean=='':
   kind='빈 줄'; decision='문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다.'
  elif clean.startswith('```'):
   if code is None:
    code=clean[3:] or 'text'; typename=None; enumkey=None
    kind='코드 시작'; decision='이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다.'
   else:
    kind='코드 끝'; decision='위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다.'; code=None; typename=None; enumkey=None
  elif code=='ts':
   m=re.match(r'(?:interface|type)\s+(\w+)',clean)
   if m:
    typename=m.group(1); enumkey=typename if clean.startswith('type ') else None
    kind='타입 선언'; decision=f'{typename}의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다.'
   elif clean in ('}', '};'):
    kind='타입 구문'; decision='타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다.'
   else:
    m=re.match(r'(\w+)\??\s*:',clean)
    value=re.match(r'\|\s*"([^"]+)"',clean)
    if m:
     field=typename+'.'+m.group(1)
     assert field in fields, f'필드 계약 누락 {doc}:{i} {field}'
     kind='데이터 필드'; decision=fields[field]; enumkey=field
     field_occurrences.append({'doc':doc,'line':i,'field':field,'requirement':s['id']})
    elif value:
     v=value.group(1)
     assert enumkey in ENUM_CONTRACTS and v in ENUM_CONTRACTS[enumkey], f'enum 계약 누락 {enumkey}:{v}'
     enum=enumkey+'.'+v; kind='열거값'; decision=ENUM_CONTRACTS[enumkey][v]
     enum_occurrences.append({'doc':doc,'line':i,'enum':enum,'requirement':s['id']})
    else:
     raise AssertionError(f'미분류 TS행 {doc}:{i} {line}')
  elif code:
   kind='예시·흐름'
   decision='검증 fixture: '+r['acceptance']+' 구현: '+r['implementation']
   if clean in {'↓','│','▼','├─ YES','│','└─ NO'}:
    decision='위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다.'
  elif clean=='\\[':
   assert formula_start is None
   formula_start=i; kind='수식 시작'; decision='여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다.'
  elif clean=='\\]':
   assert formula_start is not None
   kind='수식 끝'; decision='수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다.'
   formula_blocks.append({'doc':doc,'start':formula_start,'end':i,'requirement':s['id']})
   formula_start=None
  elif formula_start is not None:
   kind='수식 본문'; decision='식 전체의 구현 계약: '+r['implementation']+' 검증: '+r['acceptance']
  elif clean=='---':
   kind='구분선'; decision='원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다.'
  elif clean.startswith('#'):
   kind='제목'
   decision=r['interpretation']
   m=re.match(r'## Principle (\d+)',clean)
   if m: active_principle=int(m.group(1))
  elif doc=='B' and s['id']=='B74' and clean.startswith('|'):
   vals=[v.strip() for v in clean.strip('|').split('|')]
   if vals[0] in COGNITIVE_ROWS:
    kind='대응표 행'; decision=COGNITIVE_ROWS[vals[0]]+'에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다.'
   else:
    kind='표 구조'; decision='이어지는 13개 인지/시스템 대응 행의 표 머리/구분이다.'
  if s['id']=='A74' and active_principle and kind not in ('빈 줄','구분선'):
   target,meaning=PRINCIPLES[active_principle]
   decision=f'Principle {active_principle}: {meaning}. 상세 구현·검증은 {target}를 적용한다.'
  semantic_key = (s['id'], clean)
  if semantic_key in semantic:
   decision = semantic[semantic_key]
   semantic_used.add(semantic_key)
  if 'cite' in line:
   decision += ' 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다.'
  record={'document':doc,'line':i,'source':line,'kind':kind,'requirement':s['id'],'implementation':decision}
  if field: record['field']=field
  if enum: record['enum']=enum
  all_records.append(record)
  detail.append(record)
 assert code is None and formula_start is None
 ledger=[f'# 원문 {doc}의 전체 줄별 구현 대응', '',f'원문 {len(lines):,}논리행을 원래 순서로 모두 기록한다. 실제 기능 해석은 [절별 대응](source-implementation-map.md)과 [구현 본문](implementation-spec.md)을 함께 따른다. 수식/예시는 여러 행이 하나의 의미를 이루므로 소속 요구의 계약을 공유한다. 필드·열거값에는 별도 구체 계약을 부여한다. 빈 줄·구분선은 기능으로 계산하지 않는다.', '', '상태: 구현할 요구의 추적표이며 코드 구현 완료 표가 아니다.', '']
 for s in spans:
  ledger += [f'## {s["id"]} — {s["title"]}', '',f'원문 {s["start"]}–{s["end"]}행 · [구현 해석·변경·수용 조건](source-implementation-map.md#{s["id"].lower().replace(".","-")})', '', '| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |', '|---|---|---|---|']
  for rec in detail[s['start']-1:s['end']]:
   rawtext=escape(rec['source']) if rec['source'] else '〈빈 줄〉'
   ledger.append(f'| [{rec["line"]}]({link(path,rec["line"])}) | {rawtext} | {rec["kind"]} | {escape(rec["implementation"])} |')
  ledger.append('')
 (BASE/LEDGERS[doc]).write_text('\n'.join(ledger).rstrip()+'\n',encoding='utf-8')

assert set(semantic) == semantic_used, f'원문과 일치하지 않는 세부 계약: {set(semantic)-semantic_used}'
assert len(all_records)==4997
assert set(requirements)=={s['id'] for _,s in all_spans}
assert set(fields)=={x['field'] for x in field_occurrences}, '원문에 없거나 미사용 필드 계약'
for doc in SOURCES:
 rr=[r for r in all_records if r['document']==doc]
 assert [r['line'] for r in rr]==list(range(1,source_manifest[doc]['logicalLines']+1))
 assert [r['source'] for r in rr]==(BASE/SOURCES[doc]).read_text().splitlines()

with (BASE/'line-ledger.jsonl').open('w',encoding='utf-8') as f:
 for rec in all_records: f.write(json.dumps(rec,ensure_ascii=False)+'\n')

spec=BASE/'implementation-spec.md'
spec_text=spec.read_text()
for i in range(1,16):
 anchor=f'<a id="spec-{i}"></a>'
 if anchor not in spec_text:
  spec_text=re.sub(rf'(?m)^(## {i}\. .+)$',anchor+'\n\n'+r'\1',spec_text)
 assert anchor in spec_text
spec.write_text(spec_text,encoding='utf-8')

mapping=['# 원문 순서별 전체 구현 대응', '', '158개 해석 단위는 원문 A의 75개 절·3.1–3.5·도입부와 B의 76개 절·도입부이다. 절 내부의 소절·수식·예시·코드도 줄별 표에서 모두 연결한다. 별도 데이터 필드는 [필드 계약](schema-field-contracts.md)으로 구체화한다.', '', '각 항목은 원문 의미 → 현재 부족한 구조 → 필요한 변경 → 검증 조건 순서다. 모두 구현 예정 명세이며 기존 코드의 완료 기능으로 읽지 않는다. CP/CG/AP/CM/EV/PL/EX/ST의 신규 패키지 책임은 [본문 2절](implementation-spec.md#spec-2)을 따른다.', '']
for doc,s in all_spans:
 r=requirements[s['id']]
 modules=r['area'].split(',')
 for m in modules: assert (ROOT/MODULES[m][0]).is_file()
 current='; '.join(f'[{m}: {MODULES[m][0]}]({link(ROOT/MODULES[m][0])})' for m in modules)
 future='; '.join(f'{m} → {MODULES[m][1]}' for m in modules)
 mapping += [f'<a id="{s["id"].lower().replace(".","-")}"></a>', '',f'## {s["id"]} — {s["title"]}', '',f'원문 [{doc}:{s["start"]}–{s["end"]}]({link(BASE/SOURCES[doc],s["start"])}) · [줄별 대조]({LEDGERS[doc]}) · [구현 본문 {r["spec_section"]}절](implementation-spec.md#spec-{r["spec_section"]})', '',f'**해석:** {r["interpretation"]}', '',f'**현재 차이:** {r["current_gap"]}', '',f'**구현:** {r["implementation"]}', '',f'**기존 연결 위치:** {current}', '',f'**변경 책임:** {future}', '',f'**수용 조건:** {r["acceptance"]}', '']
(BASE/'source-implementation-map.md').write_text('\n'.join(mapping).rstrip()+'\n',encoding='utf-8')

field_md=['# 원문 데이터 필드별 구현 계약', '', '원문의 TypeScript 선언에서 각 필드를 추출한 후 사람이 작성한 필드 계약과 일대일 대조한다. 모든 열거값도 아래에 별도 기록한다. 원문 예시는 인터페이스 이름 그대로 복사하는 요구가 아니라 데이터 의미를 빠짐없이 구현하는 계약이다.', '']
for occurrence in field_occurrences:
 key=occurrence['field']; doc=occurrence['doc']; line=occurrence['line']
 field_md += [f'## {key}', '',f'원문 [{doc}:{line}]({link(BASE/SOURCES[doc],line)}) · {occurrence["requirement"]}', '', fields[key], '']
field_md += ['## 열거값별 처리', '', '| 원문 | 열거값 | 처리 |','|---|---|---|']
for e in enum_occurrences:
 key,value=e['enum'].rsplit('.',1)
 field_md.append(f'| [{e["doc"]}:{e["line"]}]({link(BASE/SOURCES[e["doc"]],e["line"])}) | {e["enum"]} | {ENUM_CONTRACTS[key][value]} |')
(BASE/'schema-field-contracts.md').write_text('\n'.join(field_md).rstrip()+'\n',encoding='utf-8')

formula_md=['# 원문 수식 전체의 적용·검증 목록', '', '수식은 표시용 여러 줄을 하나의 식으로 묶는다. 아래에는 모든 display-math 블록을 원문 그대로 싣고 소속 요구의 적용 계약과 테스트를 연결한다. 변수 정의와 증명 전제는 인접 원문 및 본문 5–7·10–11절을 함께 따른다. 수식 개수는 증명된 정리 개수가 아니다.', '']
for j,f in enumerate(formula_blocks,1):
 r=requirements[f['requirement']]; doc=f['doc']
 source_lines=(BASE/SOURCES[doc]).read_text().splitlines()
 expression='\n'.join(source_lines[f['start']:f['end']-1])
 formula_md += [f'## F{j:03} — {f["requirement"]} / {doc}:{f["start"]}–{f["end"]}', '', f'[원문]({link(BASE/SOURCES[doc],f["start"])}) · [요구 해석](source-implementation-map.md#{f["requirement"].lower().replace(".","-")})', '', '```math',expression,'```', '', '**구현 적용:** '+r['implementation'], '', '**검증 조건:** '+r['acceptance'], '']
(BASE/'formula-contracts.md').write_text('\n'.join(formula_md).rstrip()+'\n',encoding='utf-8')

manifest_path=BASE/'source-manifest.json'
if manifest_path.exists():
 assert json.loads(manifest_path.read_text())==source_manifest, '고정 원문 manifest 불일치'
manifest_path.write_text(json.dumps(source_manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
counts=Counter(r['kind'] for r in all_records)
report={'sourceLines':len(all_records),'requirements':len(requirements),'semanticLineContracts':len(semantic),'fieldOccurrences':len(field_occurrences),'enumOccurrences':len(enum_occurrences),'formulaBlocks':len(formula_blocks),'missingLines':0,'duplicateLines':0,'unmappedFields':0,'kindCounts':dict(counts),'sources':source_manifest}
(BASE/'traceability-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
audit=['# 원문 대응 검증 기록', '', '검증 방법: `python3 docs/design/build-traceability.py`를 실행하여 원문 해시·행 순서·소속 요구·타입 필드·열거값·수식 블록을 검사한다. 사용자 첨부 경로가 존재하면 바이트 일치도 추가 확인한다. 구현 코드/알고리즘 성능을 검증한 결과가 아니다.', '', f'- A: {source_manifest["A"]["logicalLines"]:,}논리행, B: {source_manifest["B"]["logicalLines"]:,}논리행, 총 {len(all_records):,}행.',f'- 요구 대응 {len(requirements)}개, 세부 행 계약 {len(semantic)}개, 데이터 필드 {len(field_occurrences)}개, 열거값 {len(enum_occurrences)}개, 표시 수식 {len(formula_blocks)}블록.', '- 누락 행 0, 중복 행 0, 원문 순서 불일치 0, 미대응 TypeScript 필드 0.', '- 원문 Markdown과 JSONL의 각 source 문자열은 행별로 완전히 동일하다. 빈 줄·구분자도 포함한다.', '', '## 원문 SHA-256', '']
for doc,info in source_manifest.items():
 audit += [f'{doc}: `{info["sha256"]}`', '']
audit += ['## 행 분류', '', '| 종류 | 행 수 |','|---|---:|']
for k,v in counts.items(): audit.append(f'| {k} | {v} |')
audit += ['', '## 수동 해석과 자동 검사의 구분', '', '`requirements.tsv`, `semantic-line-contracts.tsv`, `schema-field-contracts.tsv`는 원문 및 현재 코드에 근거해 작성한 구현 해석이다. 생성기는 이 내용을 참조하는 줄별 표·수식 목록을 만들고 누락을 검사한다. 모든 문장의 의미가 올바르다는 사실을 줄 수 검사만으로 증명하지 않는다. 실제 구현 수용에는 본문 T01–T15와 절별 fixture의 실행 evidence가 추가로 필요하다.', '', '일반 문장과 수식 조각은 소속 요구의 구현 계약을 공유한다. 같은 계약을 공유하는 것은 해당 줄을 생략했다는 뜻도, 그 줄마다 독립 기능이 있다는 뜻도 아니다. 원문에 없는 arbitrary threshold·과학 서지·SDK capability를 검증된 사실로 추가하지 않는다.', '']
(BASE/'traceability-audit.md').write_text('\n'.join(audit).rstrip()+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('sources','kindCounts')},ensure_ascii=False,indent=2))
