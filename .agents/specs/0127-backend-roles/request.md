# 요청 원문

<!-- 사용자·이슈의 요청을 그대로 붙여 넣는다. 요약·정리하지 않는다. -->
새 PR로 고쳐

(대상: 백엔드 점검 결과)
1. 라우트 안의 SQL — status · signal · tasks 라우트에 쿼리가 직접 있음
2. 공통 오류 처리 · 구조화 로그 — app.onError 와 console 로그가 없음
3. Env 타입 생성 — 손으로 작성 → wrangler types 로 생성
4. 소스 맵 — upload_source_maps 없음
5. 린트 — API 에 lint 가 없고 no-floating-promises 검사도 없음 · apps/api · packages/ui · packages/shared 에 lint 없음 · packages/config 에 공용 eslint 없음
