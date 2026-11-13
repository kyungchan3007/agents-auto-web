# 팀 역할과 소유

## lead (Opus)
- 하는 일: 계획, 일 나누기, 결과 통합
  - 사용자 요청을 request.md 에 원문 그대로 고정하고 plan.md(또는 prd·sdd)를 쓴다
  - TASKS.md 에 작업 · 담당 · 잡은 파일을 적어 배정한다
  - 담당에게는 request.md 경로를 넘긴다 (요약해서 넘기지 않는다)
  - 결과를 모아 `bash .agents/checks.sh` 를 실행하고 PR 을 연다
- 고칠 수 있는 곳: .agents/specs/, .agents/orchestration/TASKS.md

## builder (구현)
- 하는 일: lead가 배정한 plan 대로 기능을 만든다 (화면 · API · 수집 · 공용 로직)
- 고칠 수 있는 곳:
  - apps/web/src/** (GEO 소유 파일 제외)
  - apps/api/src/** (GEO 소유 파일 제외)
  - packages/shared/src/** · packages/ui/src/**
  - apps/api/drizzle/migrations/ 에 새 마이그레이션 추가 (기존 파일 수정은 금지)
  - docs/domain/** (규칙이 바뀌면 함께 갱신)
- 고치면 안 되는 곳: 테스트 파일, 보호 파일
  - 테스트 파일: *.test.ts · *.test.tsx · apps/web/e2e/** · apps/web/e2e-responsive/**
  - 보호 파일: .agents/protected.txt 목록 (DB 스키마 · wrangler 설정 · next.config · 워크플로 등)

## test (테스트)
- 하는 일: 구현보다 먼저 테스트 작성(FAIL 확인)
  - request.md 원문의 요구마다 테스트를 하나 이상 만든다
  - 구현이 끝나면 다시 실행해 PASS 를 확인하고 결과를 lead에게 보고한다
  - 빌드 · e2e 는 꼭 필요할 때만 실행한다 (D1 하루 읽기 한도)
- 고칠 수 있는 곳:
  - 소스 옆의 *.test.ts · *.test.tsx
  - apps/web/e2e/** · apps/web/e2e-responsive/**
  - 테스트용 데이터 (fixture)
- 주의: FAIL 단계의 게이트 실패는 정상. 구현하지 말고 보고하고 멈춤

## geo
- 하는 일: 검색 노출 · AI 답변 측정 · 봇 방문 분석
  - robots · sitemap · 메타데이터 · 구조화 데이터 관리
  - 매일 AI 답변 세션 측정 → apps/api/data/geo-answers/YYYY-MM-DD.json
  - 검색 노출 조사 (#157) 결과 정리
- 고칠 수 있는 곳:
  - apps/web/src/app/robots.ts · apps/web/src/app/sitemap.ts
  - apps/web/src/app/geo/** · apps/web/src/features/geo/**
  - apps/web/src/bff/track-visit.ts · packages/shared/src/domain/geo-visit.ts
  - apps/api/src/features/geo/** · apps/api/scripts/geo-ask.ts · apps/api/scripts/gsc-sync.ts
  - apps/api/data/geo-answers/** · docs/geo-measurement.md
- 범위 밖이 필요하면: lead에게 제안 (예: layout.tsx 의 메타데이터 · 페이지 본문 문구)

## 공통
- 커밋·PR:
  - 1작업 = 1브랜치 (task/NNNN-이름). 각자 자기 범위 파일만 그 브랜치에 커밋한다
  - PR 은 lead만 연다. 제목은 "작업 NNNN: 요약", 버그 · 보안 수정은 "작업 NNNN: 패치(버그|보안) — 요약"
  - 담당자는 kyungchan3007 로 지정한다
  - 머지는 사람이 "머지해" 한 뒤에만 한다. harness-approved 라벨은 붙이지 않는다
  - 완료는 checks.sh PASS 일 때만 말한다. 비밀값은 코드 · 로그 · 커밋에 쓰지 않는다
- 남의 범위를 바꿔야 하면: 직접 고치지 말고 lead에게 요청
- 부탁받은 범위만 하고, 끝나면 보고하고 멈춤
- 사용자에게 보이는 글은 모두 한국어
