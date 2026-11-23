# 계획

## 무엇을 · 왜
- 어드민 측정 화면 위쪽에 측정 시작 날짜를 보여 리뷰어가 "숫자가 적다 · 비었다"를 오해하지 않게 한다
  - 유입: "GA4 측정 시작 2026-11-23" (태그가 운영에 나간 날 · 작업 0322 · main 반영 11-23)
  - 인스타 유입: "성과 수집 시작 2026-11-23" (ig-insights 첫 성공 실행 11-23 06:02Z · lead 가 돌린 실행)
  - 날짜는 상수 한 곳(apps/admin/src/shared/site.ts 의 MEASURE_START) — 저장된 첫 날짜는 GA4 가 아직 0줄이라 쓰지 않음(lead 판단)
- 유입 빈 상태 문구에 "GA4 는 보통 하루 뒤에 숫자가 들어옵니다 · 다음 수집 매일 04:50"(ga4-sync.yml cron 50 19 UTC = 한국 04:50 확인)
- 메뉴 "인스타 성과" → "인스타 유입"(사용자 원문) · 화면 머리 · 판 제목 · 페이지 제목 · 찾기 창(메뉴 이름을 그대로 씀)
- 작업 종류 ①(보이는 문구) — 새 테스트 없음 · 메뉴 이름을 고정한 기존 테스트는 test 가 맞춤 · 어드민만 → 변경 기록 없음
- 구현은 lead 가 직접(claude-desktop: 작은 작업은 lead 가 해도 됨) · 확인은 test

## 애매한 곳
- 판 제목(ig-section) · 페이지 제목도 "인스타 유입"으로 맞춤(작업서: 같은 이름이 쓰인 곳 모두) (가정)

## 파일 계획
- apps/admin/src/shared/site.ts · apps/admin/src/shared/nav/admin-pages.ts
- apps/admin/src/features/traffic/{traffic-page.tsx,traffic-body.tsx} · apps/admin/src/features/instagram/{instagram-page.tsx,ig-section.tsx} · apps/admin/src/app/instagram/page.tsx
- 메뉴 이름 · 문구를 고정한 테스트(apps/admin/e2e/admin.spec.ts · ig-insights.spec.ts 등) (test)
- .agents/specs/0328-admin-measure-start/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)

## 허점
- spec:new 가 develop 기준으로 번호를 매겨, 아직 머지 안 된 작업(0326 · 0327)과 번호가 겹침 — 손으로 바꿈
