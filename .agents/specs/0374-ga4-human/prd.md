# PRD: 무엇을 · 왜

> 요청 원문: [request.md](request.md)

## 문제
- GA4 11-23 ~ 11-25 사용자 238 · 116 · 374 가 거의 전부 (direct)/(none) · 세션:사용자 ≈ 1:1 · 메뉴 페이지가 고르게 찍혀 자동 방문이 의심된다(확인 안 됨). 지금 어드민은 사람과 자동 방문을 나눠 볼 수 없다.
- 인스타 게시물을 올리기 시작했지만 인스타에서 넘어온 방문을 따로 볼 수 없다.

## 요구사항
1. GA4 수집에 사람 판별용 값을 더한다: 참여 세션(engagedSessions) · 참여 시간(userEngagementDuration) · 기기 · 국가 등 날짜별.
2. 어드민 GA4 표에 "참여 세션" 기준 사람 수를 지금 사용자 수와 같이 보인다.
3. GA4 유입 표에서 인스타 유입을 따로 보인다: instagram · l.instagram.com 리퍼러와 utm_source=instagram 을 나눠서.
4. 프로필 링크에 넣을 utm 주소를 회신한다(예: https://flapfx.com/?utm_source=instagram&utm_medium=social&utm_campaign=profile). 게시물 본문 주소는 지금처럼 flapfx.com 만. 프로필 링크 변경은 사용자가 앱에서 한다.
5. 받지 못한 값은 빈 칸(지어내지 않음). 비밀값 출력 금지.

## 하지 않는 것
- 자동 방문을 막거나 지우는 일(보이기만 함) · 운영 사이트 화면 변경 · 워크플로 · wrangler 변경(필요하면 먼저 알림).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 어드민 머지 뒤 develop → admin fast-forward · 함께 나간 커밋 목록 회신
- [ ] 첫 수집 전에는 빈 상태로 보임 · 첫 수집 시각을 회신 맨 위에
