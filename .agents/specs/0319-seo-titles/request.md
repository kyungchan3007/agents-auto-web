# 요청 원문

사용자(2026-11-23 · claude-desktop 경유):

> 확인해보니까 첫 화면만 geo가되어 있고 나머지 화면은 geo랑 seo가 안되어 있네?

claude-desktop 작업서 원문: .tmp/today-1123/seo-titles.md (큐 qitem-20261123040729-b61bf6f06241b555) 중

> ## 확인한 사실 (Bing Webmaster · URL Inspection → Live URL · 11-23 13:05 ~ 13:06)
> - `/` · `/flights`: "No SEO/GEO issues found" · 구조화 자료 2종 인식.
> - `/prices`: **"1 SEO/GEO issue found — Error: Title too short"**. 지금 제목 "여행 물가 · Flapfx"(14자).
> - 통과한 제목 길이: 홈 약 40자 · /flights "여행 타이밍 · 항공료 · 단체여행비 물가지수 · Flapfx"(31자).
> - 같은 이유로 걸릴 가능성이 큰 짧은 제목: `/calc` "직구 계산기 · Flapfx" · `/currencies` "통화 둘러보기 · Flapfx" · `/about` "소개 · 판단 기준 · Flapfx" · `/currencies/[코드]` "달러 USD · 통화 둘러보기 · Flapfx". (Bing 에서 다 돌려 보지는 못함)
> - 설명이 짧은 곳: `/currencies` "통화마다 오늘 환율 · 싼 편인지 · 최근 1년 흐름"(24자) — Bing 에서 설명이 짧다고도 볼 수 있음.
>
> ## 만들 것
> - 위 짧은 제목을 30 ~ 60자 사이로, 그 페이지가 실제로 보여 주는 것과 사람이 검색할 말로 늘림(예: /prices → "여행지 물가 비교 — 한국보다 싼 나라 · 비싼 나라 · Flapfx"). 사실과 다른 말 · 과장 · 예측 표현 금지. 작업서의 예시 문구도 코드 · 화면과 대조.
> - `/currencies` 설명도 70 ~ 155자 사이로 늘림.
> - 제목 · 설명을 바꾸면 고정해 둔 테스트가 깨질 수 있음 → test 가 확인.
> - 운영 화면 문구(제목)가 바뀌므로 `.changeset` 에 `"@hav/web": patch` 한 줄.
