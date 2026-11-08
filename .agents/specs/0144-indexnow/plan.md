# 계획

## 무엇을 · 왜
- 이슈 #117 남은 일 중 "발견": 2026-11-08 확인 — Google Search Console 사이트맵은 제출 3일째 "가져올 수 없음" · 페이지 색인 보고서는 "데이터 처리 중" · Bing 은 크롬 로그인이 풀려 확인 못 함 · AI 답변 인용 측정(작업 0139) 첫 결과는 검색 결과 등장 0/24
- 색인 요청을 사람 손 없이 계속 보내도록, 평일 환율이 바뀐 뒤 sitemap 에서 그날 바뀐 주소만 IndexNow 로 알린다 (Bing · 네이버 · Yandex 등이 함께 받음)
- 키 파일은 작업 0133 에서 이미 올림 (`apps/web/public/a6932e….txt`) · 비밀값 아님

## 애매한 곳
- 시각: 평일 한국 16:00 (가정 · 12:00 수집 · 13:30/15:00 재시도 · 다시 빌드 뒤)
- 주말 · 바뀐 주소가 없는 날은 보내지 않음 (가정 · 같은 주소를 자주 보내면 429)
- 2026-11-08 전체 29개 주소를 한 번 보냄 → HTTP 200 (확인됨)

## 파일 계획
<!-- tsconfig: 스크립트가 .ts 경로로 가져오도록 allowImportingTsExtensions (noEmit 이라 빌드 영향 없음) · indexnow.yml 은 보호 파일 -->
- apps/web/src/shared/indexnow.ts
- apps/web/src/shared/indexnow.test.ts
- apps/web/scripts/indexnow.ts
- apps/web/tsconfig.json
- .github/workflows/indexnow.yml
- docs/geo-measurement.md
- README.md
- .agents/specs/0144-indexnow/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (보호 파일 승인 뒤)
- [x] 스크립트: 바뀐 주소 없음 → 보내지 않음 · `--all` → HTTP 200
- [ ] 머지 뒤 평일 첫 자동 실행 결과 확인

## 허점
- 작업 0133 에서 IndexNow 를 한 번만 보내고 자동화를 미뤄, 그 뒤 바뀐 페이지는 알리지 않았다
