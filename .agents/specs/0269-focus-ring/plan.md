# 계획 — 작업 0269 · 초점 표시를 하나로 (Quick · 디자인 PR · 시안 43)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 키보드 초점(`:focus-visible`) 고리를 사이트 전체에서 한 가지로: 2px 실선 · 바깥 간격 2px · 밝은 면 파랑 #2438A8 · 파란 · 남색 면 흰색.
- 공용 규칙 하나(tokens.css 또는 globals.css)로 두고, 컴포넌트마다 따로 적힌 outline / ring 값은 걷어 낸다.
- 마우스 · 손가락으로 누를 때는 고리가 보이지 않음(지금처럼).

## 애매한 곳
- 작업서의 "지금 상태"는 claude-desktop 측정값 → builder 가 코드로 사실 대조(따로 적힌 고리 위치 · 기본 1px 인 곳 · 입력 칸 띠). 크게 다르면 고치기 전에 보고. (작업서)
- 예외: 출발일 달력 날짜 칸은 칸 안쪽(굵기 · 색은 공용 규칙대로). 넘치는 부분을 자르는 칸에서 고리가 잘리는 곳은 그곳만 안쪽으로 두고 PR 에 적는다. (작업서)
- 파란 · 남색 면 판정은 공용 규칙에서 면 표시(예: data 속성 · 클래스)로 나눈다 — 방법은 builder. (가정)
- 파일이 10개를 넘을 수 있으나 계약 · 동작 변경 없는 표시만의 일괄 정리라 Quick 으로 둔다. (가정 · 작업서 "Quick")
- 디자인 PR(`design` 라벨) · builder 는 구현만 · test 는 표시 없는 테스트가 깨질 때만. hooks · lib 를 바꾸게 되면 lead 에 알린다. (verdict.md)

## 누가
- builder — 사실 대조 → 구현 · 단계별 커밋 · 푸시 → lead 보고
- test — CI 에서 표시 없는 테스트가 깨지면 고침 · @design 깨짐 개수 보고
- lead — 작업표 · PR(design 라벨) · gate · ALL PASS 면 develop 머지

## 파일 계획
- packages/ui/src/** (tokens.css · form · layout 부품)
- apps/web/src/app/globals.css
- apps/web/src/shared/**
- apps/web/src/features/{home,currencies,travel-price,import-calc,intro,about}/**
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0269-focus-ring/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 따로 적힌 고리 값이 남지 않음 · 공용 규칙 하나
- [ ] @design 테스트 깨짐은 개수를 claude-desktop 에 알림

## 허점
- 0268: 새 e2e(tap-44)의 첫 두 CI 가 테스트 측정 오탐(스크롤 중 좌표 비교 · 덧칸 가운데 가정 · Playwright 전용 선택자)으로 실패 — 기하 측정 테스트는 한 번에 읽고 computed 상자로 계산할 것. 머지 CI 에서도 home year-link 1 flaky → test 수정(0fc0d172)이 #321 머지 직후 올라와 이 브랜치로 옮김(cherry-pick).
