# 계획 (Quick)

> 요청 원문: [request.md](request.md)

## 목표
- 어드민에 네 번째 화면 "알리기"(/marketing) 틀을 만든다. 알리기는 Meta(인스타그램 · 페이스북) 광고로 한다(사용자).
- 내용은 저장소에 있는 것만: geo 가 만든 소재 초안(`docs/marketing/YYYY-MM-DD/` — 이미지 · 문구.md)을 빌드 때 읽어 날짜별 카드로 · 문구 복사 단추 · 초안이 없으면 빈 상태
- 올렸는지 · 반응 · 광고비는 저장소에 기록이 없고 공개 저장소에 적지 않기로 해(team.md geo 절) 화면에 넣지 않는다.

## 작업 종류 (team.md test 절)
- 새 화면(동작 있음: 초안 읽기 · 복사) → 요구마다 기능 테스트(단위: 문구.md 나누기 · e2e: 화면 · 메뉴 · 빈 상태)

## 파일 계획
- apps/web/src/app/marketing/page.tsx (새 · 빌드 때 docs/marketing 읽기 · 검색 막음)
- apps/web/src/features/marketing/** (새 · 화면 · lib/drafts.ts 문구.md 나누기)
- apps/web/src/shared/admin-nav.tsx (메뉴에 알리기 · 단축키 4)
- packages/ui/src/components/admin/icons.tsx · admin-shell.tsx (알리기 아이콘)
- apps/web/worker/host.ts · routes.ts · host.test.ts · apps/web/wrangler.jsonc(보호 · run_worker_first 에 /marketing)
- 테스트: features/marketing/lib/drafts.test.ts · apps/web/e2e/admin.spec.ts · .agents/e2e-map.json
- .agents/specs/0304-admin-marketing/**

## 계획 밖 변경 이유
