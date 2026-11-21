# 계획 — 작업 0265 · 머리 라벨 세 개 지우기 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 38).

## 무엇을
- 페이지 머리 h1 바로 위 라벨 세 개 삭제 + 라벨 ↔ 제목 간격(mt-3 등)도 삭제: /flights "여행 타이밍" · /prices "여행 물가"(여행지 고른 뒤 머리 포함) · /about "소개"
- /prices 오른쪽 예산 카드 위 선을 다시 제목 첫 줄에 맞춤(0248 · 3번 조건)
- h1 하나 · 낭독 구조 그대로 · 메뉴 aria-current 가 페이지 이름 역할을 하는지 확인
- 그대로 두는 라벨 다섯 곳 · 통화 상세 줄 · /log · /geo · /design 은 건드리지 않음

## 결정 (lead)
- 화면 파일만 → 디자인 PR(`design` 라벨).
- 이전 결정("제목 위 라벨 유지")을 고정한 표시 없는 테스트가 있으면, 이 세 곳은 사용자가 조건을 바꾼 것이므로 test 가 새 조건으로(나머지 다섯 곳은 유지 검사 그대로).
- "예산 카드 위 선 = 제목 첫 줄"(0248)은 사용자 조건 — 기능 테스트로 유지 · 통과해야 함.

## 누가
- builder — 페이지별 커밋 · 푸시
- test — 깨진 기능 테스트 · 예산 카드 위 선 맞춤 확인 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/travel-price/components/flights-page.tsx
- apps/web/src/features/travel-price/components/prices-header.tsx
- apps/web/src/features/about/components/** 또는 apps/web/src/app/about/** (소개 머리)
- apps/web/e2e/** · **/*.test.ts(x) (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0265-eyebrow-three/** · .agents/orchestration/TASKS.md
