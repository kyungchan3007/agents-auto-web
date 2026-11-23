# PRD — 무엇을 · 왜

> 원문(request.md)을 옮긴 파생 문서. 요구 충족 판정 기준은 언제나 원문이다

## 문제
- 0322 로 운영 사이트에 GA4 태그가 들어가 방문이 모이지만, 결과는 GA4 화면에서만 볼 수 있다. 측정 결과는 모두 어드민에서 보기로 했다.

## 목표
- 매일 한 번 GA4 Data API(runReport)에서 어제까지의 값을 읽어 D1 에 쌓고, 어드민 새 탭 "유입" 에서 본다
  - 날짜별: 사용자 · 세션 · 페이지뷰
  - 유입 경로별: sessionSource · sessionMedium · sessionCampaignName 별 세션 · 사용자 (인스타 UTM: utm_source=instagram|facebook · utm_medium=social|paid_social · utm_campaign=daily-YYYYMMDD|profile 이 그대로 보임)
  - 많이 본 페이지: pagePath 별 페이지뷰
- 받지 못한 값은 빈 값 · 태그가 운영에 나가기 전 날짜(11-23 이전)는 "자료 없음"

- 인스타 성과(0323)를 알리기 탭에서 빼서 별도 화면 "인스타 성과"(/instagram)로 옮긴다 — 보이는 값 · 빈 칸 규칙은 그대로, 알리기 탭은 0323 이전 모습으로

## 비목표
- 어드민에 GA4 태그 넣기(어드민 방문은 세지 않음 · 0322 결정)
- 실시간 보고 · 전환 · 광고 성과(0323 후보)
- 운영 사이트(apps/web) 화면 변경 — 없음

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 하루 한 번 자동으로 GA4 값을 D1 에 쌓음 · 다시 돌리면 그날 값 덮어씀
- [ ] 서비스 계정 키 · 토큰이 출력 · 커밋 · 로그에 없음
- [ ] 어드민 "유입" 탭에서 날짜별 · 유입 경로별 · 페이지별 값을 봄
