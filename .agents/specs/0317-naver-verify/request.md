# 요청 원문

사용자(2026-11-23 · claude-desktop 경유):

> Bing 이랑 네이버 등록 준비 팀에 맡겨

앞선 질문(원문):

> 왜 안나오지? 아니 색인도 다되어 있고 그런데 이유가 뭐야 대체

claude-desktop 작업서 원문: .tmp/today-1123/bing-naver.md (큐 qitem-20261123034929-16eeeb2c6041e04e)

> ## 만들 것
> 1. **IndexNow (Bing · 네이버 둘 다 받음)**
>    - 키 파일을 `apps/web/public/<키>.txt` 로 둠(키는 공개되는 값이라 비밀 아님 · 무작위 32자 이상).
>    - 사이트맵 주소 목록을 IndexNow(`https://api.indexnow.org/indexnow`)에 보내는 스크립트. 운영 sitemap.xml 을 읽어 보냄 · 응답 코드만 출력.
>    - 키 파일이 운영에 올라간 뒤(main 반영 · 배포 끝) 한 번 돌려 결과(HTTP 코드)를 PR · 회신에 적음.
>    - 매일 자동으로 보내는 것은 워크플로(보호 파일)라 이번엔 만들지 말고 다음 작업 후보로 작업표에 적음.
> 2. **네이버 인증 태그 자리**
>    - layout 의 `verification.other` 에 `naver-site-verification` 을 더할 수 있게, 값은 상수(shared/site.ts 등) 한 곳에 둠. 값이 비어 있으면 태그를 내지 않음.
>    - 값은 사용자가 네이버 서치어드바이저에서 받아 알려 주면 넣음 — 지어내지 않음.
> 3. **robots 확인** — 네이버 수집 봇(Yeti) · bingbot 이 막히지 않는지 확인만. robots.ts · sitemap.ts 는 보호 파일이라 바꿀 일이 생기면 claude-desktop 에 알림.
> 4. **사람이 할 일 안내** — 사용자 회신에 짧은 순서로
