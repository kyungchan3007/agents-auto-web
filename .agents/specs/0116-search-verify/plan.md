# 계획

## 무엇을 · 왜
- 이슈 #117: Google Search Console 에 tripfx.pages.dev 소유권 확인 → 사이트맵 제출
- pages.dev 는 도메인 DNS 방식을 쓸 수 없고, Pages 가 .html 주소를 리다이렉트하므로 메타 태그 방식
- 확인 값은 페이지에 공개되는 값이라 비밀이 아님 · 지우면 확인이 풀림

## 애매한 곳
- 메타 태그는 홈에만 필요하지만 layout 에 둠 (metadata.verification 표준 위치) (가정)

## 파일 계획
- apps/web/src/app/layout.tsx
- .agents/specs/0116-search-verify/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 운영 HTML 에 태그 · Search Console 확인 성공 · 사이트맵 제출

## 허점
-
