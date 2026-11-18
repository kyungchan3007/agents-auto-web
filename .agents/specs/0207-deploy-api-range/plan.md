# 계획

## 무엇을 · 왜
- `deploy-api.yml` 은 API 가 바뀌었는지를 `git diff HEAD~1 HEAD` 로만 봅니다(마지막 커밋 하나).
- PR 을 rebase 로 머지하면 커밋 여러 개가 main 에 한꺼번에 들어가고, 검사 · 배포는 마지막 커밋에 대해 한 번만 돕니다.
  - 마지막 커밋이 API 와 상관없으면(문서 · 화면 · 작업 보드) API 변경이 있어도 배포를 건너뜁니다.
  - 실제 사례: 2026-11-18 #245 (summary.ts · routes.ts 변경) → "API · 공용 패키지 변경 없음 — 배포 건너뜀" → 손으로 배포.
- 고침: 비교 기준을 "이번 push 직전의 main"으로 바꿉니다.
  - 직전 main = 같은 워크플로("검사 · 자동 검사")가 main push 로 돈 기록 중 이번 커밋 바로 앞의 headSha (gh run list · 읽기 권한)
  - 기준을 못 찾거나 저장소 기록에 없으면 **배포함** (건너뛰는 쪽보다 안전 — 배포 직전 예약 대기 단계는 그대로)
  - checkout 은 fetch-depth 0 (기준 커밋까지 비교하려면 필요)

## 애매한 곳
- 직전 main 을 push 이벤트의 before 로 받을 수 없음(workflow_run 이벤트에 없음) → 검사 워크플로 실행 기록으로 찾음 (가정)

## 파일 계획
- .github/workflows/deploy-api.yml (보호 파일 — 사람이 harness-approved 라벨)
- .agents/specs/0207-deploy-api-range/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (보호 파일은 라벨로 승인)
- [ ] 비교 스크립트를 로컬에서 #245 머지 범위로 돌려 go=true 가 나옴 · 문서만 바뀐 범위는 go=false
- [ ] 머지 뒤 이 워크플로 자체가 바뀌었으므로 실제로 한 번 배포가 돌아 확인

## 허점
-
