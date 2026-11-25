# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 노선 정의(순수 함수 · packages/shared domain travel): routeOf(tab, levels) · 탭 목록 · 동남아 · 유럽 나라 표 · 많이 가는 곳 표(출처 주석 · 확인한 날) · 내 여행지 끼워 넣기(그 노선에 없으면 물가 순서 자리에) · 자 눈금 범위.
- 화면: features/prices/route 의 기존 노선 부품에 탭 줄 · 상태 훅(고른 탭 · localStorage · try/catch) · 내 여행지(usePickedTrip) · 칩 ✕(그 노선에서만 빼기 · 페이지 안 상태).
- 움직임: 기존 노선 모션(작업 0229 등) 규칙을 따라 핀 · 칩 차례로 · 비행기 이동. 움직임 줄이기는 바로.
- 서버 첫 그림: 기본 탭 노선 그대로(SEO 문장 바뀌지 않음).

## 대안 · 트레이드오프
- 탭마다 정적 페이지: 같은 페이지 안 흐름이라는 사용자 요구와 맞지 않아 고르지 않음.

## 파일 계획
- packages/shared/src/domain/** · docs/domain/travel-price.md (많이 가는 곳 출처는 geo · 규칙 문서)
- apps/web/src/features/prices/** · apps/web/src/features/home/** (usePickedTrip 공유가 필요하면)
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0360-route-tabs/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 많이 가는 곳 출처가 확인되지 않으면 탭을 빼고 냄(지어내지 않음).

## 검증 계획
- 단위: 탭별 노선 · 내 여행지 끼워 넣기 · 빼기 · 자 범위 · 고른 탭 기억.
- e2e: 탭 바꾸기 · 내 여행지 · ✕ · 서버 첫 그림 기본 노선 · 세 폭(1440 · 900 · 375).
- CI gate · main 대상 전체 e2e.

## 계획과 달라진 점
- 휴대폰(760 이하)은 시안 375(가로 자)와 달리 0283 세로 노선(사용자 결정 A안)을 그대로 두고 탭 줄을 위에 더함(지금 화면을 대신하지 않음 · 사용자에게 알림).
- 탭을 바꾸면 비행기 · 카드는 새 노선 첫 정거장(내 여행지가 있으면 그 나라). 예산 카드에서 고른 나라도 내 여행지(원문).
- 넓은 화면 노선에서 몰린 핀은 한 줄 더 밀어 냄(휴대폰 rulerTiers 규칙) · 줄기는 라벨 뒤.
- 많이 가는 곳: 한국관광공사 데이터랩 2025년 순위 · 물가 자료 있는 앞 6곳(대만 건너뜀).
