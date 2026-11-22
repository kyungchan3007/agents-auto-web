# 계획 — 작업 0304 · SEO 기본 보강 (Quick · 평소 PR · 화면 변화 없음)

## geo 점검에서 고를 것 (1 · 2 · 4 · 5 · 7)
1. 홈(또는 공통 layout)에 사이트 이름 · 운영자 구조화 자료(JSON-LD · WebSite + Organization). 사이트 이름 "Flapfx" · 주소 https://flapfx.com.
2. 통화 상세(/currencies/[code])에 환율 자료 구조화 자료(Dataset 또는 WebPage + 기준일 · 출처) · 공개 페이지마다 경로(BreadcrumbList).
4. 홈 전용 description 한 줄(사이트 공통 문구와 분리) — 문구는 지금 화면 · docs/domain 에 있는 사실만.
5. 공유 정보에 og:url(각 페이지 canonical 과 같은 주소) · twitter title · description 명시.
7. sitemap 의 /flights · /about 에도 lastModified(항공 지수 · 달력 갱신일 등 자료에서 · 받지 못하면 넣지 않음).

## 하지 않는 것
- 어드민(/geo · /log · /how) — 비공개용이라 이번에 다루지 않음(사용자). 운영 반영 순서 · admin.flapfx.com 주소 문제(점검 3)도 이번 범위 밖.
- www · http → https 넘기기(점검 6) — Cloudflare 설정 · 코드 밖.
- 화면에 보이는 것은 바꾸지 않음.

## 애매한 곳
- 구조화 자료의 값은 실제 자료에서만(환율 · 기준일 · 출처) · 받지 못한 값은 넣지 않음(AGENTS 규칙 7).
- 작업 종류 ①(화면 변화 없음 · 메타 · 구조화 자료) → 새 테스트 없음 · 로컬 e2e 없음. test 는 단위 · typecheck · 바꾼 파일 lint 와 빌드한 HTML 에서 JSON-LD 가 올바른 JSON 으로 들어가는지만 확인해 보고(새 테스트 아님 · 커밋 안 함).

## 누가
- builder — 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 위 확인 · 깨진 기존 테스트만 맞춤
- lead — PR · gate · 머지

## 파일 계획
- apps/web/src/app/layout.tsx · apps/web/src/app/page.tsx · apps/web/src/app/{currencies,prices,flights,calc,about}/**
- apps/web/src/shared/** (site · sitemap-entries · 구조화 자료 도우미)
- packages/shared/src/domain/** (값을 가져오는 함수가 필요하면)
- apps/web/src/**/*.test.ts(x) (test · 깨진 것만)
- .agents/specs/0304-seo-basics/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 빌드한 HTML 에 JSON-LD(WebSite · Organization · 통화 상세 자료 · Breadcrumb) · 홈 전용 description · og:url · twitter 제목 · 설명 · /flights · /about lastModified

## 허점
-
