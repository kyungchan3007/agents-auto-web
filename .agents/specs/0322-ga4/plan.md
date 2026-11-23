# 계획

## 무엇을 · 왜
- GA4 태그(측정 ID G-9B9FLT5S9X · 공개 값)를 운영 사이트에 넣어 유입 수 · 경로를 본다
- 작업 종류 ③(동작 — 주소에 따라 보내고 안 보냄): 요구마다 테스트
- 운영 화면 코드가 바뀜 → .changeset `"@hav/web": patch` 한 줄 · develop 머지까지 (main 은 사용자 확인 뒤)

## 방식 (Next 문서 확인 · 11-23)
- next.config 는 `output: "export"`(정적) — 미리보기와 운영이 같은 빌드라 빌드 때 값으로는 운영만 고를 수 없음 → **브라우저에서 hostname 을 보고** 운영(flapfx.com · www.flapfx.com)일 때만 gtag 를 불러 보냄
- 문서(02-guides/third-party-libraries.md)는 @next/third-parties 를 권하지만 새 패키지는 package-lock(보호 파일)을 바꿈 → 02-guides/scripts.md 의 `next/script`(afterInteractive)로 gtag.js 를 부름 · 새 패키지 없음
- UTM: GA4 가 주소의 utm_source · utm_medium · utm_campaign 을 스스로 읽음 → 주소의 query 를 지우거나 바꾸지 않으면 됨 (코드 추가 없음 · 지우는 곳이 없는지 확인)
- CSP 머리글 없음(public/_headers 확인) → 바꿀 것 없음

## 요구
1. 운영 hostname(flapfx.com · www.flapfx.com)에서만 gtag.js(googletagmanager.com/gtag/js?id=G-9B9FLT5S9X)를 불러 page_view 를 보낸다
2. 미리보기(*.workers.dev) · localhost · 어드민(admin.flapfx.com) 에서는 불러오지 않는다 (요청 0개)
3. 운영 판정은 순수 함수 하나(hostname → boolean) · tsx 는 그 결과로 그리기만
4. 측정 ID 는 상수 한 곳 (apps/web/src/shared/site.ts)
5. 첫 화면 · 자바스크립트 없음에서 화면 모양 변화 없음

## 애매한 곳
- 동의 배너는 이번 범위 아님 (가정 · 국내 서비스 · 쿠키 동의 요청 없음)

## 파일 계획
- apps/web/src/shared/site.ts (builder · GA_MEASUREMENT_ID)
- apps/web/src/shared/seo/analytics.ts · analytics 를 그리는 부품(apps/web/src/shared/seo/ 안) (builder · shared 바로 아래 새 파일 금지 — role-boundary)
- apps/web/src/app/layout.tsx (builder)
- .changeset/*.md (builder)
- 위 옆 *.test.ts · apps/web/src/checks/role-boundary.test.ts 목록 · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0322-ga4/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 요구 1 ~ 3 테스트
- [ ] main 반영은 사용자 확인 뒤 · 반영 뒤 GA4 실시간 보고서 확인은 사용자

## 허점
- 
