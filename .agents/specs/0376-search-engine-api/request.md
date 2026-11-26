# 요청 원문

사용자(2026-11-26 · claude-desktop 경유):

> 맡겨

claude-desktop 작업서(.tmp/handoff-1123/lead-measure-fix-1126.md) 원문:

> 사용자 요청(원문): "맡겨" (앞선 제안: GA4 자동 방문 거르기 · 인스타 팔로워 수 수집 · 인스타에서 넘어온 방문 세기 · 원하면 네이버 · Bing 숫자도 어드민에)
>
> 배경(11-26 읽기 전용 조사, 숫자는 D1 hav-db 그대로)
> - GA4 11-23 ~ 11-25 사용자 238 · 116 · 374, 거의 전부 (direct)/(none), 세션:사용자 ≈ 1:1, 메뉴 페이지가 고르게 찍힘 → 자동 방문 의심(확인 안 됨)
> - ig-insights 는 팔로워 수를 부르지 않음(apps/api/scripts/ig-insights.ts ACCOUNT_METRICS). 11-24 첫 캐러셀(17919490152498537)은 11-25 · 26 행이 비어 있음
> - 네이버 · Bing 숫자는 D1 에 없음
>
> 할 일 (작업 번호 · 루프는 lead 판단)
> 1. GA4 수집에 사람 판별용 값 더하기: 참여 세션(engagedSessions) · 참여 시간(userEngagementDuration) · 기기 · 국가 등. 어드민 GA4 표에 "참여 세션" 기준 사람 수를 같이 보이기. 받지 못한 값은 빈 칸(지어내지 않음).
> 2. 인스타 팔로워 수 수집(계정 지표에 followers_count 등) + 어드민 인스타 표에 추가. 11-24 첫 캐러셀 행이 왜 비는지 원인 확인.
> 3. 인스타에서 넘어온 방문 세기: GA4 유입 표에서 instagram / l.instagram.com 리퍼러와 utm_source=instagram 을 따로 보이게. 프로필 링크를 utm 붙은 주소로 바꾸는 건 사용자가 앱에서 함 → 넣을 주소만 회신(예: https://flapfx.com/?utm_source=instagram&utm_medium=social&utm_campaign=profile). 게시물 본문 주소는 지금처럼 flapfx.com 만.
> 4. 네이버 서치어드바이저 · Bing 웹마스터 숫자를 자동으로 받을 수 있는지(공식 API 여부 · 필요한 키)만 조사해 회신. 만들기는 사용자 확인 뒤.
>
> 규칙: 비밀값 출력 금지. 워크플로(.github/workflows) · wrangler 변경이 필요하면 먼저 알릴 것(보호 파일). 어드민 쪽은 머지 뒤 develop → admin fast-forward, 함께 나가는 커밋 목록을 회신에.
