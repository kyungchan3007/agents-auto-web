# 계획

## 무엇을 · 왜
- /prices/[code] 머리 구역의 "오늘 기준 한 줄 답" 상자(작업 0344)를 화면 · HTML 에서 완전히 지움. 같은 문장을 다른 곳으로 옮기지 않음. FAQ · description 이 원래 쓰던 문장은 범위 밖.
- 더 이상 쓰지 않는 함수 · 테스트(oneLineAnswer 등)는 정리 · 다른 곳(FAQ · description · 통화 상세 0345)에서 쓰면 남기고 이유를 여기에.
- 지운 뒤 요약 칸(0396) 아래가 바로 이어짐 · 새 빈 공간 · 위치 변화 없음.
- 통화 상세(/currencies/[code])의 한 줄 답(0345)은 범위 밖.

## 파일 계획
- builder: apps/web/src/features/prices/country/{country-header.tsx,country-view.ts,…} · 쓰는 곳 (side-view.ts 등)
- test: country-view.test.ts · apps/web/e2e/country-summary.spec.ts · 한 줄 답을 보던 나라 물가 spec
- .agents/specs/0397-no-oneline/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- oneLineAnswer 는 남김: /prices/[code] description 메타(generateMetadata 의 descriptionLine) · 나라 FAQ · 환전 카드 문장이 서버에서 씀(범위 밖). CountryView 에서는 oneLine 을 빼 클라이언트로 넘기지 않음(RSC 데이터에도 없음).
- 여행 물가 목록 사이드 시트(country-side.tsx · side-view.ts)의 한 줄 답도 지움(작업서 '바꿀 것'에 side-view.ts 사용처 포함).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지까지(main · 릴리스는 사용자가 말할 때)

## 허점
- 첫 구현은 상자만 지우고 CountryView.oneLine 을 그대로 넘겨 HTML 페이지 데이터(RSC)에 글이 남음 · claude-desktop · test 가 HTML 검사로 잡음. '화면 · HTML 에 없음' 은 클라이언트로 넘기는 데이터까지 볼 것.
