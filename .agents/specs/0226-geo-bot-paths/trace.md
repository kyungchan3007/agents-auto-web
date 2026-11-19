# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 확인 | schema.ts 의 방문 집계 표(day · kind · name · path · hits, 기본 키 넷)와 summary.ts 를 읽음 | 봇 이름과 경로가 한 행에 함께 남음 → 스키마 변경 없이 집계만 추가 가능 |
| 2 | 루프 | Full Loop | API 응답 계약(packages/shared)이 바뀌고 api · web 두 쪽 · test · builder 두 역할 |

| 3 | 테스트 먼저(test) | API 단위(geo.test.ts botPages 6개 + 빈 값 모양 갱신) · 계약(geo.test.ts 3개) · 화면 계산(geo-bars.test.ts botPagesView 6개) · e2e(geo-bot-pages.spec.ts 7개) · 기준 화면 .tmp/screen-1119/geo-ref/(운영 'AI 봇이 읽은 페이지' 카드 1280 · 390) | 구현 전(ce4870a)에서 단위 14건 FAIL · 구현 폴더에서 단위 36건 · e2e 7건 통과(만족 가능 확인). 빈 값 기대에 botPages: [] 를 넣음(필드는 항상 있음) |

## 허점
