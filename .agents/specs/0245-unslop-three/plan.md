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
<!-- 한 줄 = 경로 하나(범위 검사가 읽음) · 담당: builder 화면 · test 테스트 · lead 문서 -->
- apps/web/src/features/home/**
- apps/web/src/features/import-calc/**
- apps/web/src/features/currencies/**
- apps/web/src/features/travel-price/**
- packages/ui/src/components/motion/rolling-number.tsx
- packages/ui/src/components/flap/**
- apps/web/e2e/**
- apps/web/src/shared/calc-blue.test.ts
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- 파일 수(16개 · Quick 기준 10 초과): 화면 파일 11개 중 7개가 "작은 글자판 이음선" 한 줄짜리 같은 수정이고 나머지 5개는 작업 문서(request · plan · handoff · 작업표)라 계약 · 경계 변경이 없음 → Quick 유지.
- apps/web/src/shared/calc-blue.test.ts: 직구 머리 min-height 계산식을 보는 단위 테스트 — 휴대폰 규칙을 푼 변경으로 깨져 test 가 새 동작으로 고침.
