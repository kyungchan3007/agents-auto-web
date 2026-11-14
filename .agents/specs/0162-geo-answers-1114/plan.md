# 계획

## 무엇을 · 왜
- 2026-11-14 AI 답변 세션 측정 결과를 파일로 남긴다 (일일 루틴 4번). 머지되면 geo-ask.yml 이 D1 에 저장한다.
- #157 검색 노출 조사를 어제(11-13 사이트맵 조사) 다음 단계로 이어 간다 (일일 루틴 3번). 결과는 #157 댓글로 남긴다.

## 담당
- geo: 질문 24개를 웹 검색해 apps/api/data/geo-answers/2026-11-14.json 작성 (형식: 2026-11-13.json · docs/geo-measurement.md). found · cited 만 사실대로.
- geo: #157 다음 단계 — 오늘 gsc-sync 결과(사이트맵 상태 · 노출 · 색인)와 봇 방문(특히 Googlebot 의 /sitemap.xml 요청) 확인. 11-14 에도 "가져올 수 없음"이면 직접 색인 요청할 주요 페이지 목록을 제안만 한다 (계정 작업 금지).
- lead: 결과 검토 · 게이트 · PR.

## 애매한 곳
- Search Console · Bing 계정 작업은 하지 않는다. 필요하면 제안만 (확인됨: 요청 원문)
- 빌드 금지, 운영 D1 직접 쿼리 금지 (확인됨: 요청 원문)

## 파일 계획
- apps/api/data/geo-answers/2026-11-14.json
- .agents/specs/0162-geo-answers-1114/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 2026-11-14.json 에 질문 24개 결과 (found · cited)
- [ ] #157 에 오늘 댓글
- [ ] 머지 뒤 /geo 에 2026-11-14 기록 표시

## 허점
- spec:new 가 main 기준으로 번호를 매겨 0161(열린 PR #175)과 같은 번호를 만들었다. 손으로 0162 로 바꿨다.
