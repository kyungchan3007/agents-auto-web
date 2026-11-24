# 계획

## 무엇을 · 왜
- #409 두 번째 전체 e2e 에서 운영(web)은 통과, 어드민 두 곳이 남음.
- admin.spec:140: 0352 의 가짜 /bff/geo 가 이 테스트에 적용되지 않음 → 같은 방식으로 채움(test).
- traffic.spec:42: 빌드 때 /ga4 가 HTTP 401(작업 0326)이라 유입 화면이 빈 상태로 빌드되어 h2 가 하나. 첫 실행에는 없던 실패라 0349 의 빈 상태 판정 변경과의 관계를 먼저 확인. 테스트 원인이면 /bff/ga4 를 가짜 응답으로(test), 코드 원인이면 builder.

## 파일 계획
- apps/admin/e2e/**
- apps/admin/src/features/traffic/** (코드 원인일 때만 · builder)
- .agents/specs/0353-admin-e2e-fixture-2/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #409 전체 e2e 통과

## 허점
- 0352 에서 고친 줄 알았던 테스트(admin.spec:140)가 CI 에서 그대로 실패: 로컬 확인 범위가 실제 고친 테스트를 다 덮지 못함.
