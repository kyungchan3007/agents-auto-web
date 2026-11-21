# 계획 — 작업 0245 · AI 티 걷어 내기 1차 · 선택 3건 (Quick · 화면만 · 계약 안 바뀜)

요구 · 값 · 그림은 [handoff.md](handoff.md) 가 원본이다. 이 문서는 나누기 · 순서 · 파일 범위만 정한다.

## 무엇을
1. 홈 첫 화면(1024 이상) — 제목 왼쪽 · 탑승권 카드 오른쪽 두 단, 파랑 면이 카드를 품음. 1023 이하 그대로. (`home-now.jpg` → `home-a.jpg`)
2. 직구 계산 휴대폰 머리(639 이하) — 제목 + 설명 덩어리 min-height 풀기, 설명 ↔ 요약 띠 28~32px. 640 이상 그대로. (`calc-*-now` → `calc-*-a`)
3. 작은 글자판 — 이음선을 글자 뒤로(칸 isolation · 이음선 z-index -1). 큰 판(홈 출발 안내판 · 여행 타이밍 머리 · 인트로)은 그대로. (`flap-*-now` → `flap-*-a`)

## 결정 (lead)
- 사용자가 "테스트할 필요 없다"고 했으므로 **테스트 먼저 단계는 생략**한다. builder 구현 → test 가 깨지는 기존 spec 만 고침 + 직구 휴대폰 규칙(0208) e2e 의 휴대폰 부분만 새 동작으로.
- 작은 판 · 큰 판 구분은 builder 가 글자판 부품의 크기 옵션(또는 쓰는 곳)으로 나눈다. 공용 부품에 새 옵션을 더하면 큰 판 쓰는 곳은 값을 넘기지 않아 그대로 있게 한다.
- 0217 의 높이 구간 분기(880 · 1000 · 1180)는 두 단에서 필요 없으면 걷어 낸다. 노트북 4 높이(1280×720 · 1366×768 · 1440×900 · 1920×950)에서 안내판 · 판정 줄 · 칩 · 검색이 첫 화면에 드는지는 test 가 기존 spec 으로 확인.
- 문구 · 색 · 글자 크기 단계 · 칩 수는 바꾸지 않는다. /geo · /log · /design 은 건드리지 않는다.

## 누가 · 순서
1. builder — 세 건 구현 · 한 건 = 한 커밋(3 커밋) · 푸시 · lead 보고
2. test — `node .agents/scripts/e2e-select.mjs` 로 고른 spec + 단위 · typecheck · lint 로컬 실행, 깨지는 spec 만 새 모양에 맞게 고침(커밋 따로) · 미리보기 1280 · 390 비교 캡처 · lead 보고
3. lead — PR(base develop · 담당자 kyungchan3007) · CI gate 확인 · 미리보기 주소 + 볼 경로를 claude-desktop 에 회신 · 머지는 "머지해" 뒤

## 파일 계획
- builder
  - apps/web/src/features/home/** (홈 머리 두 단)
  - apps/web/src/features/import-calc/** (휴대폰 머리)
  - packages/ui/src/** 의 글자판 부품 (이음선 그리는 순서 · 작은 판 구분)
  - 작은 판을 쓰는 곳에서 옵션을 넘겨야 하면: apps/web/src/features/{currencies,travel-price,import-calc}/**
- test
  - apps/web/e2e/** 중 깨지는 spec (후보: home-redesign · home-fix-0217 · home-design · home · flap-board · calc-gap · calc-title · calc-blue · calc-redesign · calc-roll · currency-redesign · detail-design · flights-redesign · airfare-calendar · prices-route)
  - 깨지는 단위 테스트(*.test.tsx)가 있으면 그것만
- lead
  - .agents/specs/0245-unslop-three/** · .agents/orchestration/TASKS.md
