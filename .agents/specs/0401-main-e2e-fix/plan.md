# 계획

## 무엇을 · 왜
main 반영 PR #478(develop 63ce5f75 · 운영 v1.6.0) 전체 e2e 실패 31개(실행 46115424957)를 고친다. 화면은 사용자가 확인한 지금 develop 그대로 둔다.

## 실패 묶음과 원인 (lead 로그 분석)
1. focus-ring.spec.ts:83 (/about /calc /currencies/USD /flights /prices · 두 프로젝트 · 10개): 바닥 고정 띠 항목 a[rate-ticker-item] 의 초점 고리가 흰색. 띠는 data-surface="dark" 그대로인데 0400 에서 바탕이 옅은 유리가 되어 흰 고리가 밝은 면 위에서 안 보임 → **화면 버그**. 바닥 띠(data-variant=fixed)만 고리를 공통 밝은 면 파랑(#2438a8)으로(토큰 · 노란 점 · 글자색은 그대로). hero 띠는 파란 면이라 흰색 그대로.
2. country-summary.spec.ts:150 (일본 1024~1440 · 4개): '일본 카드 내용 높이 ≤ 520' 인데 581~603. 0398 에서 예산 카드를 늘린 지금 화면이 확정 → 테스트 기대값을 지금 화면 기준으로(카드 안 흰 빈칸이 없다는 뜻은 유지).
3. home-pill.spec.ts 94 · 128 · 270 · 339 · home-redesign.spec.ts:95 (10개): dest-list 높이 423 · 모서리 0 · 바탕 투명. 0398 에서 도착지 카드 자리를 미리 잡고 알약 → 펼침 모션을 clip-path 로 그 안에서 되살림 → 테스트가 보이는 모양(clip-path 를 그리는 요소)을 재도록 맞춤. 모션 자체는 그대로.
4. resp-audit.spec.ts:98 home-bf · home-default (3개): 'a 겹침 span.rt-chip / small × span.rt-name' — hero 띠의 흐르는 항목이 왼쪽 고정 라벨 뒤로 지나가는 설계(양 끝 흐림) → 흐르는 띠 항목은 겹침 검사에서 뺌.
5. tap-44.spec.ts:93 /currencies/USD (2개): 금액 칩 '10 USD' 눌리는 높이 39.5 — 바닥 띠에 가려 잘린 측정으로 의심 · 원인 확인 뒤 띠에 가리지 않는 위치에서 재거나(테스트) 실제 칩이 작으면 알림.
6. currency-sidebar.spec.ts:105 (휴대폰 1개): scrollY 500 에서 버튼 가운데가 rate-ticker-item 에 덮임 — 바닥 고정 띠가 화면 아래 40px 을 늘 덮는 것은 설계(머리 띠와 같음) → 띠에 가리지 않는 버튼만 누르도록.
7. intro.spec.ts:331 (1개): 홈 링크를 하나씩 누르다 'Element is not attached to the DOM' — hero 띠의 흐르는 복사본 링크(aria-hidden) 또는 캐러셀 장 바뀜 의심 · 원인 확인 뒤 테스트.
8. 흔들림 8개(footer-same:110 · pages:342 · prices-route:179 · rate-ticker:45 · calc-chart:136 · prices-redesign:211)는 이번에 고치지 않고 기록. 단 rate-ticker:45 (hero 띠 높이)는 두 프로젝트 모두 흔들려 원인만 확인.

## 기준
- 화면은 지금 develop 그대로(띠 모양 · 요약 칸 · 반응형 결과) · 화면 버그로 판단되면 claude-desktop 에 먼저 알림(1번은 알림).
- 사용자 동작 · 응답으로 높이 · 위치가 움직이지 않는다는 규칙 유지.
- 로컬은 고친 spec 만 · 전체는 #478 CI.

## 파일 계획
- builder: apps/web/src/shared/ticker/ticker.css · packages/ui/src/tokens.css(띠 고리 토큰 하나)
- test: apps/web/e2e/{focus-ring,country-summary,home-pill,home-redesign,resp-audit,resp-audit-check,tap-44,currency-sidebar,intro}.spec.ts 또는 그 도움 파일
- .agents/specs/0401-main-e2e-fix/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/src/features/currencies/converter/converter.tsx: test 측정에서 tap-44 USD 실패가 테스트 문제가 아니라 화면 문제로 확인됨(416px 미만 금액 칩 두 줄 · 줄 간격 8px 이라 눌리는 영역 44px 가 겹쳐 39.5). 줄 간격만 12px(gap-y-3 · 가로 8 그대로) · claude-desktop 에 알림.
- e2e/resp-audit-check.ts: 흐르는 띠(.rt-track)를 겹침 · 넘침 판정에서 뺌.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate) → develop 머지 → #478 다시 실행(main 머지는 claude-desktop)

## 허점
