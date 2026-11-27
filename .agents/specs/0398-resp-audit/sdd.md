# SDD: 반응형 전수 점검 · 여백 · 정렬

## 점검 (test · e2e 로 남김)
- 새 spec apps/web/e2e/resp-audit.spec.ts(+ .agents/e2e-map.json): 페이지 / (블프 장 · 기본 장 · 고르기 전후) · /currencies · /currencies/USD · /currencies/JPY · /prices · /prices/JPN · /prices/VNM · /prices/FRA · /prices/MAC · /flights · /calc · /about · 404 × 320~1600 20px + 넓은 글꼴.
- 항목: a 가로 스크롤 · 화면 밖 · 글자 넘침 · 겹침 / b 같은 줄 두 칸 이상(높이 200 넘는 것) 아래 끝 차이 > 24 / c 899 이하 주요 덩어리 좌우 여백 차 > 2 / d 구역(section · hero · 카드) 안 마지막 내용 아래 ~ 구역 아래 끝 빈 공간 > 25% 또는 160px / e 동적 변화 전후 높이 · 아래 구역 위치.
- 결과: 페이지 · 폭 · 항목 목록(.tmp 에 파일 + 실패 메시지) · 문제 폭 캡처. 처음엔 목록만 내고(builder 에 넘김) 0 이 되면 실패 기준으로 굳힘. 로컬은 이 spec 만(새로 쓴 spec 이라 가드 허용).

## 고침 (builder · 방향은 lead 결정)
- ① 나라 물가 두 칸: grid 줄 높이를 맞추고(stretch) 예산 카드를 flex 열로, 카드 안 결과 영역을 flex-1 로 늘려 마지막 내용(설명 · 링크)이 카드 바닥에 붙게(justify 로 위아래 나눔) → 카드 안 빈 띠 없음. 환율 없는 나라(카드가 길 때)는 왼쪽 열 마지막 덩어리(요약 칸)가 바닥에 맞도록 같은 방식. 카드 안 입력 · 나라 칸 위치는 그대로.
- ② 첫 페이지 블프 장 600~899: 글 칸을 0393 가운데 기둥(최대 600 · 좌우 22px)에 맞춤(블프 쪽 선택자가 빠졌는지 확인) · 두 장을 같은 grid 칸에 겹친 높이는 그대로 두되 짧은 장은 내용을 세로 가운데(align-self/justify center)로 두어 아래 한쪽에만 빈 공간이 몰리지 않게. 기본 장도 같은 기준.
- ③ section.today 가 화면에 들어올 때 늘어나는 높이를 처음부터 자리 예약(등장 모션은 투명도 · 이동만).
- ④ 전수 점검 목록에 나오는 나머지.

## 규칙
- tsx 로직 없음 · 토큰 · 장식 추가 없음 · 초점 고리 · 12px · 받지 못한 숫자 지어내지 않음.

## 파일 계획
- builder: apps/web/src/features/prices/country/** · apps/web/src/features/home/{blackfriday,hero,carousel,destinations,today 관련}/** · 점검에서 나온 페이지의 css · tsx(이유는 trace 에)
- test: apps/web/e2e/resp-audit.spec.ts(새로) · .agents/e2e-map.json · 기존 spec 중 배치 바뀌어 깨지는 것
- .agents/specs/0398-resp-audit/** · .agents/orchestration/TASKS.md
