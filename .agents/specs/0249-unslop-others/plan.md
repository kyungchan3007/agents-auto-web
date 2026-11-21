# 계획 — 작업 0249 · AI 티 걷어 내기 1차 (그 밖 8건 · Quick · 디자인 PR)

항목 원본: [handoff.md](handoff.md) "항목" · "항목별 덧붙임". 0248 이 여행 물가 · 통화 9건.

## 무엇을 (handoff 번호)
- 2번 직구 두 카드 높이 맞춤(넓은 화면) · 6번 구간 사이 간격 두 단계(넓은 96 · 휴대폰 72 · 홈 · 여행 타이밍 · 통화 · 여행 물가 · 직구 · 404 — 지금 값을 재서 커밋 메시지에 한 줄씩)
- 7번 탑승권 점선 늘리기(넓은 화면) · 8번 창밖 카드 각주 아래 왼쪽 · 24번 "11월" 밑칠 글자 폭 · 높이 64~90%(EmphText 다른 쓰임 확인)
- 14번 404 세부(마침표 · 링크 모양 · "여행 타이밍" · 바닥 띠) · 16번 떠 있는 "탑승권 보기" 단추 → 카드 안 글 링크(비행기 글자 뺌) · 18번 국기 옅은 테두리(토큰)

## 결정 (lead)
- 16번: 칩 문구가 `features/home/lib/picked.ts` 에 있다. 디자인 PR 이 되려면 lib 를 바꾸지 않는다 — 링크 글은 화면 부품에서 만들고, lib 를 꼭 바꿔야 하면 구현 전에 lead 에게 알린다.
- 6번이 0248 과 같은 파일(여행 물가 · 통화 부품)을 건드리면 충돌한다 → 6번은 0248 이 머지된 뒤 마지막에 하거나, 구간 간격을 공용 부품 · 토큰 한 곳에서 바꾸는 쪽을 먼저 본다(builder 판단 · 회신).

## 디자인 PR 규칙 (작업 0246 · 첫 적용)
- lead 가 PR 을 열 때 `design` 라벨을 단다. 바뀐 파일이 모두 화면 쪽(features/*/components · app 화면 코드 · packages/ui/src/components · *.css · 테스트 · 작업 기록 · 문서)이어야 디자인 PR 로 판정된다.
- **builder 는 `lib/` · `hooks/` · `packages/shared` · `apps/api` · 설정을 바꾸지 않는다.** 바꿔야만 하는 항목이 나오면 구현하지 말고 lead 에게 알린다(그 항목은 따로 평소 PR).
- builder 구현만 · 한 항목 = 한 커밋. test 는 기능 테스트가 깨졌을 때만. 디자인 테스트(@design) 실패는 고치지 않고 PR 본문 숫자 · docs/design-tests-pending.md 로 넘긴다(lead). 팀 안 비교 캡처 · 모양 맞추기 왕복 없음.
- 비교 그림: /Users/chan/Documents/develop/harness-auto-web/.tmp/handoff-1121/shots17/ (`*-now` 지금 · `*-after` 만들 모습) · 값 참고: 같은 폴더 위 cmp24.mjs · pop.mjs (그대로 옮기지 않음).
- 파일 수가 10 을 넘을 수 있다(6번 간격처럼 여러 페이지에 걸침) — 화면만 바뀌고 계약이 그대로라 Quick 유지.

## 누가 · 순서
1. builder — 0248 다음에 · 8 커밋 · 푸시 · 회신
2. test — 기능 테스트가 깨졌을 때만
3. lead — PR(design 라벨) · CI gate · 디자인 테스트 실패 N개 · 미리보기 회신

## 파일 계획
- apps/web/src/features/import-calc/components/**
- apps/web/src/features/travel-price/components/**
- apps/web/src/features/home/components/**
- apps/web/src/features/currencies/components/**
- apps/web/src/features/about/components/**
- apps/web/src/app/not-found.tsx
- apps/web/src/shared/**/*.tsx
- packages/ui/src/components/**
- packages/ui/src/tokens.css
- apps/web/e2e/**
- apps/web/src/**/*.test.ts
- apps/web/src/**/*.test.tsx
- packages/ui/src/**/*.test.tsx
- docs/design-tests-pending.md
- .agents/orchestration/TASKS.md
