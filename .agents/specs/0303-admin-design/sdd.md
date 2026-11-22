# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- `apps/web/src/features/admin/` 새 기능 폴더: 틀(admin-shell) · 판(panel) · 숫자(flap) · 막대(bars) · 찾기 창(command palette) · 단축키 · 알림 · 스타일(admin.css, 기능 폴더 안)
  - 찾기 대상은 지금 화면의 DOM(`data-cmd-*` 표시)과 고정 목록(세 화면)에서 모음 → 화면마다 따로 목록을 들고 있지 않음
  - 초성 · 찾기는 순수 함수(lib/match.ts · 단위 테스트)
- 작업실 · GEO 부품은 기존 lib(geo-view · geo-bars · rename-compare · story · record · status-text)를 그대로 쓰고 화면만 새로 짬. 기존 data-testid 는 되도록 유지
- /how: `app/how/page.tsx` + `features/admin/lib/how.ts`(자리 · 단계 · 도구 · 규칙 · 질문 자료) + 부품
- Worker: host.ts ADMIN_PAGES 에 /how · routes.ts · wrangler run_worker_first(보호 파일)
- SiteNav 의 어드민 메뉴 갈래는 지움(어드민은 admin-shell)

## 파일 계획
- apps/web/src/features/admin/** (새)
- apps/web/src/features/log/** · apps/web/src/features/geo/**
- apps/web/src/app/log/page.tsx · app/geo/page.tsx · app/how/page.tsx(새)
- apps/web/src/shared/site-nav.tsx
- apps/web/worker/host.ts · routes.ts · *.test.ts · apps/web/wrangler.jsonc
- 테스트: 위 부품 단위 · apps/web/e2e/*.spec.ts(작업실 · GEO 를 고정한 것 · 새 admin spec) · .agents/e2e-map.json
- .agents/specs/0303-admin-design/**

## 계획 밖 변경 이유
- 공용 어드민 부품(틀 · 판 · 안내판 숫자 · 막대 · 찾기 · 이벤트 · 다시 받기 훅)을 `features/admin` 대신 `packages/ui`(@hav/ui/admin · lib · hooks)에 둠 — 코드 역할 규칙(role-boundary.test: 기능 폴더끼리 가져오기 금지 · 공용 폴더 목록)을 지키려고. `packages/ui/package.json` 에 `./lib/*` 내보내기 한 줄
- 만드는 방식은 새 기능 폴더 `features/how` · 사이트의 어드민 화면 목록은 `shared/admin-nav.tsx`(site-nav.tsx 의 짝 · role-boundary 허용 목록에 더함)
- 고정폭 글꼴(IBM Plex Mono)은 `app/layout.tsx` 에서 next/font 로 넣음(preload: false — 방문자 화면은 받지 않음)
- 옛 화면을 고정한 소스 검사 · e2e(flights-page · font-readability · pages-redesign · site-story · common-design · pages · features · rename-compare · a11y)를 새 배치에 맞춤 · log-design · geo-design spec 은 지우고 admin.spec 으로 기능 검사를 옮김(어드민은 디자인 점검 대상에서 제외)

## 위험
- /log · /geo 를 고정한 @design · 기능 e2e 가 많음 → 어드민 화면을 고정한 것은 새 모습에 맞추거나(기능) 지움(@design: 어드민은 디자인 점검 대상에서 제외 · 메모 geo-log-to-admin)

## 검증 계획
- 단위 · typecheck · lint · 새로 쓰거나 고친 spec 로컬 → main PR 전체 e2e
