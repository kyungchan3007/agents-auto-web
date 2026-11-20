# 계획 — 작업 0241 · 패치(버그) — 항공권 달력 e2e 가 운영 자료로 돌아 실패

## 무엇을 · 왜
- 값 의존 테스트(고정 자료의 날짜 · 가격을 기대)는 고정 자료 빌드(`AIRFARE_FIXTURE=1`)에서만 돈다. 그 밖의 빌드(CI · 운영 API)에서는 건너뛴다. 지금 조건("자료가 없으면 건너뜀")은 운영에 자료가 생기면 무너진다.
- 값에 기대지 않는 검사(구역이 있음 · 순서 · 빈 상태 안내 등)는 그대로 CI 에서 돈다.
- 다음 작업 후보(범위 밖): CI 를 고정 자료로 빌드해 R3 ~ R8 을 CI 에서도 지키기 (보호 파일 · 팀 튜닝 "이번에 하지 않는 것").

## 누가
- test: e2e/airfare-calendar.spec.ts 의 건너뜀 조건만 고침 (구현 코드 변경 없음)

## 파일 계획
- apps/web/e2e/airfare-calendar.spec.ts
- .agents/specs/0241-airfare-e2e-fixture-only/**

## 계획 밖 변경 이유
-

## 확인 (0239 규칙)
- 로컬: airfare-calendar.spec.ts 만 — 운영 API 빌드에서 값 의존 테스트가 건너뜀 · AIRFARE_FIXTURE=1 고정 자료 빌드에서 통과 (빌드는 꼭 필요한 만큼 · D1 한도)
- 판정: PR 최신 커밋 CI gate SUCCESS — 이 작업은 Full 로 열어 CI 가 e2e 를 돌게 함

## 완료 기준
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS (verdict.md)

## 허점
- 0234 테스트 먼저 때 "운영에 자료가 생기면" 경우를 테스트 조건에 넣지 않음. 자료가 없을 때만 확인하고 머지해 첫 수집 뒤에야 드러남
