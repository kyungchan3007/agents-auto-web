# 검색 노출 측정 (이슈 #117)

> 같은 질문을 같은 방법으로 다시 측정해 비교한다. 인용은 보장할 수 없고, 측정값은 경향만 보여 준다.

## 방법
- 도구: 에이전트 WebSearch (standard) · 질문마다 1회 · 결과 페이지는 열지 않음
- 기록: 검색 발동 여부 · tripfx.pages.dev 가 나왔는지 · 나온 주소
- 한계: 한 번 찍은 값 · 특정 검색엔진 순위가 아님 · 미국 기준 도구라 네이버 · 구글 코리아와 다를 수 있음

## 비교군 (통화 절반에 먼저 적용)
- 요약 문장 · 기간별 표를 먼저 넣은 통화 (`features/currencies/summary.ts`): AED · BND · CHF · DKK · GBP · IDR · KWD · NOK · SAR · SGD · USD
- 넣지 않은 통화: AUD · CAD · CNH · EUR · HKD · JPY · MYR · NZD · SEK · THB
- 소개 페이지 · `<time>` · 출처 표기는 사이트 전체에 적용돼 이 비교에 들어가지 않음

## AI 봇 방문 · AI 서비스 유입
- 공개 페이지 [`/geo`](https://tripfx.pages.dev/geo) (2026-11-05 시작 · 작업 0129)
- 페이지 요청의 봇 이름 · 유입 주소를 하루 · 이름 · 페이지별 횟수로 집계 (`geo_hits`) · IP · 전체 User-Agent · 쿼리는 저장하지 않음
- 봇 이름은 위조될 수 있어 추정치 · AI 답변 인용 여부는 알 수 없음
- Cloudflare Web Analytics 도 켬 (사람 방문 · 유입)
- AI Crawl Control: 계정 메뉴에 없음 · 도메인(zone) 기능으로 보이며 tripfx.pages.dev 는 zone 이 아님

## 구글 검색 자료
- `gsc-sync.yml` 이 매일 Search Console 노출 · 클릭 · 순위 · 상위 검색어 · 페이지를 가져옴 (작업 0130) · 서비스 계정 `tripfx-gsc` (제한적 권한) · 키는 GitHub 비밀값 `GSC_SERVICE_ACCOUNT_JSON`
- AI 답변만 구분한 값이 아님 · 검색어는 노출 2회 이상만 공개

## 색인 요청 (자동 · 작업 0144)
- `indexnow.yml` 이 평일 한국 16:00 에 운영 sitemap 에서 어제 · 오늘 바뀐 주소만 IndexNow(`api.indexnow.org`)로 보낸다 · Bing · 네이버 · Yandex 등이 함께 받음
- 키 파일 `apps/web/public/a6932e161e92d438629d7ca38466be2c.txt` (공개가 원래 방식) · 2026-11-08 전체 29개 주소 1회 전송 → HTTP 200
- 구글은 IndexNow 를 받지 않음 → Search Console 사이트맵 · 색인 요청으로

## AI 답변 인용 (작업 0139 · 0149)
- 2026-11-10 부터: 사용자가 말하면 Claude Code 세션이 기준선 질문 24개(`apps/api/src/features/geo/questions.ts`)를 직접 웹 검색해 `apps/api/data/geo-answers/날짜.json` 을 PR 로 올린다 → 머지되면 `geo-ask.yml` 이 D1 에 저장 (작업 0149)
  - found = 검색 결과에 tripfx.pages.dev 주소가 있음 · cited = 세션이 답의 출처로 그 주소를 씀 · 검색하지 않은 질문은 파일에 넣지 않는다 (지어내지 않음)
  - 매일 05:00 API 예약은 끔 — 2026-11-08 ~ 10 Anthropic API 크레딧 소진(HTTP 400)으로 모두 실패했고, 충전하지 않기로 함
- 처음(작업 0139): `geo-ask.yml` 이 매일 한국 05:00 에 같은 질문을 AI 검색 API 에 물었다 (지금은 손으로 실행할 때만)
- 서비스: Claude(Anthropic 웹 검색 · `claude-opus-5-5` effort low) · ChatGPT(OpenAI Responses API 웹 검색) · Perplexity(Sonar). 키(GitHub 비밀값 `ANTHROPIC_API_KEY` · `OPENAI_API_KEY` · `PERPLEXITY_API_KEY`)가 있는 서비스만 측정하고, 없는 서비스는 기록하지 않는다 (0 으로 채우지 않음)
- 기록: 질문마다 "답의 인용 표시에 tripfx 주소가 있음(cited)" · "검색 결과 목록에 있음(found)" · 실패 여부만 `geo_answers` 에 저장 · 답변 본문은 저장하지 않음 · 90일 보관
- 질문에 사이트 이름을 일부러 넣은 브랜드 질문 8개가 있어, 일반 질문 16개와 나눠 봐야 한다
- 한계: 같은 질문도 날마다 답이 달라짐 · API 검색은 앱 화면의 답과 다를 수 있음 · 사용료가 질문 수만큼 든다

## 새로 측정하면
- 결과를 `apps/api/data/geo-answers/날짜.json` 으로 PR → 머지되면 D1 에 저장되어 측정 페이지 "AI 답변 인용" 에 나옴 (작업 0149)
- 2026-11-05 기준선도 같은 파일 형식으로 옮김 · 측정 페이지의 손으로 쓴 표는 지움 (작업 0155)

## 기록

### 2026-11-05 수정 전 기준선 — 브랜드 0/8 · 일반 0/16
- 24개 모두 검색 발동 · tripfx.pages.dev 는 한 번도 나오지 않음
- 브랜드 질문에는 이름이 비슷한 다른 서비스가 나옴 (Tripfix 크롬 확장 · TravelFX · triFX 등)

| 구분 | 질문 |
| --- | --- |
| 브랜드 | Tripfx · tripfx.pages.dev · Tripfx 환율 · Tripfx 환율 사이트 · Tripfx 직구 계산기 · Tripfx 여행 물가 · Tripfx 달러 환율 오늘 · Tripfx 어떤 사이트 |
| 일반 | 오늘 달러 환율 싼 편인가요 · 지금 환전해도 될까 달러 최근 90일 · 엔화 환율 지금 싼 편인지 확인 · 유로 환율 최근 1년 흐름 · 한국수출입은행 매매기준율 오늘 환율 조회 · 환율 계산기 원화 달러 · 해외직구 관세 계산기 · 미국 직구 목록통관 면세 한도 200달러 · 해외직구 150달러 넘으면 세금 얼마 · 한국 대비 일본 물가 수준 · 나라별 물가 한국 비교 여행 · 태국 여행 경비 하루 예산 물가 · 물가 싼 여행지 환율 같이 비교 · 세계은행 구매력 평가 나라별 물가 한국 기준 · 여행 환전 타이밍 언제가 좋을까 · 직구 타이밍 환율 언제 살까 |

재측정은 색인 후 2~4주 뒤. 검색 등록이 끝나기 전에는 같은 0 이 나와도 내용 탓으로 보지 않는다.

### 2026-11-05 직접 검색 (정식 측정 아님)
- 구글 site: 홈 1건 · `Tripfx` · `Tripfx 환율` · `오늘 달러 환율 싼 편인가요` 상위에 없음 · Bing 없음 · 네이버 미확인
- `Tripfx 환율` AI 개요가 앱 "TripFX – 환율 변환기" 를 설명 — 사이트 이름 질문 측정에 영향
- Search Console: 홈 등록 · 색인 요청 완료 · 달러 페이지 미등록 · 요청 한도로 나머지는 다음 날
- 사이트 이름은 Tripfx 로 유지 (2026-11-05 사용자 결정)
- 재측정 때 "이름이 겹치는 다른 서비스가 답변에 나오는지" 도 기록
