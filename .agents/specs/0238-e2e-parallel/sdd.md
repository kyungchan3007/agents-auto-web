# SDD — 작업 0238

> 요구사항: [prd.md](prd.md)

## 접근
- `apps/web/playwright.config.ts` 한 파일: `workers: process.env.CI ? 4 : undefined` (로컬은 기본 그대로) · `fullyParallel: true`
- 측정은 CI 에서: 후보마다 커밋을 올려 CI gate 실행 시간(전체 · test:e2e 단계)을 GitHub Actions 기록으로 잰다.
  1. 후보 1 (workers 4 만) 커밋 → CI 시간
  2. 후보 2 (workers 4 + fullyParallel) 커밋 → CI 시간 · 불안정 확인
  - 더 빠르고 불안정이 없는 쪽을 남김. 마지막 커밋이 고른 설정.

## 대안 · 트레이드오프
- shard(잡 나누기) — checks.yml 보호 파일 · 이번엔 제안만
- 로컬 측정만 — 코어 수가 달라 CI 시간을 대신할 수 없음

## 파일 계획
- apps/web/playwright.config.ts
- .agents/specs/0238-e2e-parallel/**

## 계획 밖 변경 이유
-

## 위험
- fullyParallel 로 같은 파일 안 테스트가 서로 상태(localStorage · 서버)를 나눠 쓰면 흔들림 → spec 이름 · 증상 기록 · 고치지 않고 보고(테스트 수정은 다음 작업)
- 정적 서버(e2e/serve.mjs) 하나에 동시 요청 증가

## 검증 계획
- test: 기준 시간(직전 Full CI gate) · 후보별 CI gate 시간 · test:e2e 단계 시간 · 실패 · 흔들림(retry 뒤 통과) 목록
- 게이트 판정은 verdict.md 규칙

## 계획과 달라진 점
-
