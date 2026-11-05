# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 근거: [Hono](https://hono.dev/docs/guides/best-practices) 경로 옆 핸들러 · [Workers](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) 바인딩 타입 생성 · 구조화 로그 · 소스 맵 · floating promise
- 기능마다 `routes.ts`(입력 · 응답) · `store.ts`(D1) · 순수 함수 파일. 공용 service 계층은 만들지 않음 (architecture.md VSA)
- `src/log.ts`: JSON 한 줄 로그 · `authkey=` 가림 · `app.onError` · 예약 실행 결과 기록
- `worker-configuration.d.ts` 를 `wrangler types` 로 생성 · `Env` 는 생성 타입에서 바인딩을 고르고 비밀값만 옵션으로 적음
- `packages/config/eslint.mjs`: typescript-eslint 권장 + `no-floating-promises` · api · ui · shared 가 사용

## 대안 · 트레이드오프
- 저장소 계층을 공용으로: 기능 폴더 원칙과 어긋남 → 기능마다 store
- 웹에도 같은 규칙 적용: Next 설정과 겹침 · 이번 범위 밖

## 파일 계획
- apps/api/**
- packages/config/** (보호 파일)
- packages/ui/**
- packages/shared/**
- apps/web/src/**
- package-lock.json (보호 파일)
- docs/architecture.md
- .agents/specs/0127-backend-roles/**

## 계획 밖 변경 이유

## 위험
- 예외 응답이 글자 → JSON: 화면은 상태 코드만 보므로 영향 없음
- 소스 맵 업로드로 배포 크기 증가: Worker 한도와 무관 (소스 맵은 별도)
- wrangler.jsonc 는 보호 파일 · harness-approved

## 검증 계획
- 게이트 Full · 배포 뒤 /health · 환율 · 신호 · 상태 경로 확인

## 계획과 달라진 점
<!-- 구현하며 바뀐 결정과 이유 (끝나고 채움) -->
