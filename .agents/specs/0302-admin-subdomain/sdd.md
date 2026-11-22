# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **같은 Worker · 같은 빌드에 주소(host)만 하나 더.** `apps/web/wrangler.jsonc` routes 에 `admin.flapfx.com`(custom_domain)을 더하고, Worker 가 요청의 host 로 나눈다.
  - `worker/host.ts` 의 `hostRoute(url)` — 순수 함수 · 결과: 넘기기(주소 · 상태) | robots(글) | admin 으로 제공 | 손대지 않음
    - flapfx.com · www.flapfx.com + /log · /geo(하위 포함) → 301 `https://admin.flapfx.com{경로}{쿼리}`
    - admin.flapfx.com
      - `/robots.txt` → `User-agent: *` · `Disallow: /`
      - `/` → 302 `/log`
      - /log · /geo(하위 포함) · /bff/* → 제공(응답에 `X-Robots-Tag: noindex, nofollow` · GEO 방문 기록 안 함)
      - 그 밖(Worker 를 지나는 방문자 주소 · sitemap) → 301 `https://flapfx.com{경로}{쿼리}`
    - 그 밖의 host(미리보기 workers.dev · 로컬) → 손대지 않음
  - `worker/index.ts` 가 `hostRoute` 를 먼저 보고, 없으면 지금 흐름(/bff 프록시 · 방문 기록 + 자산).
- **메뉴:** `SiteNav` 는 page 가 log · geo 면 어드민 메뉴(작업실 · GEO 측정 · 사이트로 가기 → SITE_URL), 그 밖이면 방문자 메뉴 다섯 개(작업실 · GEO 측정 뺌). 정적 빌드라 host 를 몰라도 page 로 정해진다.
- **사이트맵:** `PUBLIC_PAGES` 에서 /log · /geo 를 뺀다. 두 페이지 metadata 에 `robots: { index: false, follow: false }` · canonical 은 `ADMIN_URL + 경로`.
- **링크:** `site.ts` 에 `ADMIN_URL = "https://admin.flapfx.com"`. 소개의 "작업실" 링크 → `${ADMIN_URL}/log`.
- **AGENTS.md:** "만드는 중 페이지에 공개" → "어드민(admin.flapfx.com)의 작업실에 공개"(보호 파일 · 라벨).

## 대안 · 트레이드오프
- 어드민을 별도 앱(apps/admin) · 별도 Worker 로 — 화면 · 부품 · BFF 를 나눠야 해서 이번 범위(옮기기만)에 비해 큼. 나중에 어드민 기능이 커지면 다시 본다.
- run_worker_first 를 모든 주소로 — admin 주소의 /flights 같은 비목록 주소까지 넘길 수 있지만 모든 자산 요청이 Worker 를 지나 요청 수가 늘어난다(작업 0189 가 피한 것). 비목록 주소는 admin 주소에서도 그대로 열리지만 정식 주소(metadataBase)가 flapfx.com 이라 검색 중복은 없다.

## 파일 계획
- apps/web/worker/host.ts (새) · apps/web/worker/index.ts · apps/web/worker/index.test.ts · apps/web/worker/host.test.ts (새)
- apps/web/wrangler.jsonc
- apps/web/src/shared/site.ts · apps/web/src/shared/site-nav.tsx
- apps/web/src/app/log/page.tsx · apps/web/src/app/geo/page.tsx
- apps/web/src/features/about/lib/criteria.ts
- apps/web/src/**/*.test.ts · apps/web/e2e/*.spec.ts — 메뉴 · 공개 페이지 · 링크를 고정한 테스트를 새 모습에 맞춤
- AGENTS.md
- docs/architecture.md (주소 한 줄)
- .agents/specs/0302-admin-subdomain/**

## 계획 밖 변경 이유

## 위험
- custom_domain 은 main 배포(Workers Builds) 때 Cloudflare 가 만든다. flapfx.com 은 같은 계정이라 자동이지만, 실패하면 admin 주소가 열리지 않고 옛 주소 넘기기만 동작해 두 화면에 못 들어간다 → 배포 직후 admin 주소를 사용자에게 알리고, 안 열리면 넘기기를 되돌린다.
- 하루 마무리 PR(#353)이 열려 있는 동안 develop 에 머지하면 그 PR 에 커밋이 붙어 전체 e2e 가 다시 돈다 → #353 이 main 에 들어간 뒤 머지한다.

## 검증 계획
- worker 단위 테스트(ADM-01 ~ 05 · 09 · 10) · 메뉴 · 사이트맵 · 링크 단위 테스트(ADM-06 ~ 08)
- CI gate(develop · build 까지) → main PR 의 전체 e2e
- 배포 뒤 admin.flapfx.com/log · /geo · flapfx.com/log 넘기기를 사용자가 확인

## 계획과 달라진 점
