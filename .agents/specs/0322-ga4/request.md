# 요청 원문

사용자(2026-11-23 · claude-desktop 경유 · 원문):

> 메타 광고랑 이거 이제 다 붙어 있는데 이거 측정할수 있지 않나

> 인스타 성과는 없겠지 이제 측정을 해야할거야

앞선 요청(원문):

> 계정을 만들고 GA4? 인가 그거 연결해야 되는데 유입수이런거 확인하게

> 일단 지금 팀이 seo 작업을 하고 있거든 이거 끝나고 하자

claude-desktop 작업서 원문(.tmp/handoff-1123/lead-ga4-measure.md) 중 lead 작업:

> 1. GA4 태그를 운영 사이트(apps/web)에 넣기 — lead 작업
>    - 측정 ID: G-9B9FLT5S9X (공개 값 · 비밀 아님) · 속성 flapfx.com · 스트림 "Flapfx 웹"
>    - 운영 화면(flapfx.com)만. 어드민 · 미리보기 주소에서는 보내지 않기(미리보기 숫자가 섞이지 않게).
>    - Next.js 버전 문서(node_modules/next/dist/docs) 확인 뒤 방식 결정. 정적 내보내기(Cloudflare Pages)와 맞는지 확인.
>    - 인스타 링크 UTM 규칙: utm_source=instagram|facebook · utm_medium=social|paid_social · utm_campaign=daily-YYYYMMDD 또는 profile → GA4 에서 이 값으로 유입을 나눠 볼 수 있어야 함.
>    - 운영 화면 코드가 바뀌니 변경 기록(changeset) 한 줄.
>
> gate 통과 뒤 develop 머지. 운영 반영(main)은 사용자 확인 뒤.
