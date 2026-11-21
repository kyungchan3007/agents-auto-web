# 계획 — 작업 0248 · AI 티 걷어 내기 1차 (여행 물가 · 통화 9건 · Quick · 디자인 PR)

항목 원본: [handoff.md](handoff.md) "항목" · "항목별 덧붙임". 0249 가 나머지 8건.

## 무엇을 (handoff 번호)
- 여행 물가: 1번 정거장 카드 깨짐(2024년 자료 위치 · 넓은 화면 하루 예산 아랫줄) · 3번 머리 카드 위치 + "다른 나라 보기" 팝업 밝은 면 · 4번 "나라 더 보기" 편 상태 한 목록 세 단 · 20번 정거장 카드 테두리 1px 잘림(왼쪽 색 띠 유지)
- 통화: 9번 환산 칩 한 줄 · 11번 엔화 "100엔당" 한 줄 · 12번 검색 결과 없음 안내 겹쳐 띄우기 · 17번 "쌈" 배지 → 조용한 글자 · "최근 90일 최저" · 19번 1년 범위 눈금 끝 고리(비행기가 끝점 6% 안이면 안 그림)

## 디자인 PR 규칙 (작업 0246 · 첫 적용)
- lead 가 PR 을 열 때 `design` 라벨을 단다. 바뀐 파일이 모두 화면 쪽(features/*/components · app 화면 코드 · packages/ui/src/components · *.css · 테스트 · 작업 기록 · 문서)이어야 디자인 PR 로 판정된다.
- **builder 는 `lib/` · `hooks/` · `packages/shared` · `apps/api` · 설정을 바꾸지 않는다.** 바꿔야만 하는 항목이 나오면 구현하지 말고 lead 에게 알린다(그 항목은 따로 평소 PR).
- builder 구현만 · 한 항목 = 한 커밋. test 는 기능 테스트가 깨졌을 때만. 디자인 테스트(@design) 실패는 고치지 않고 PR 본문 숫자 · docs/design-tests-pending.md 로 넘긴다(lead). 팀 안 비교 캡처 · 모양 맞추기 왕복 없음.
- 비교 그림: /Users/chan/Documents/develop/harness-auto-web/.tmp/handoff-1121/shots17/ (`*-now` 지금 · `*-after` 만들 모습) · 값 참고: 같은 폴더 위 cmp24.mjs · pop.mjs (그대로 옮기지 않음).
- 파일 수가 10 을 넘을 수 있다(6번 간격처럼 여러 페이지에 걸침) — 화면만 바뀌고 계약이 그대로라 Quick 유지.

## 누가 · 순서
1. builder — 9 커밋 · 푸시 · 회신(17번이 판정 문구를 lib 에서 만들면 알림)
2. test — CI 또는 로컬 기능 테스트가 깨졌을 때만
3. lead — PR(design 라벨) · CI gate · 디자인 테스트 실패 N개 · 미리보기 회신

## 파일 계획
- apps/web/src/features/travel-price/components/**
- apps/web/src/features/currencies/components/**
- packages/ui/src/components/**
- packages/ui/src/tokens.css
- apps/web/e2e/**
- apps/web/src/**/*.test.ts
- apps/web/src/**/*.test.tsx
- packages/ui/src/**/*.test.tsx
- docs/design-tests-pending.md
- .agents/orchestration/TASKS.md
