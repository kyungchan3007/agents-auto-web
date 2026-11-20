# SDD — 작업 0234 · 항공권 출발일 달력

> 요구사항: [prd.md](prd.md) · 원문: [request.md](request.md)

## 접근
기존 지표 수집(indicators 슬라이스)과 같은 모양으로 새 API 슬라이스 하나 · 계약 하나 · 화면 구역 하나를 더한다.

### 1. 계약 (packages/shared)
- `packages/shared/src/contracts/airfare.ts` — `AirfareCalendar` (zod)
  - `{ fetchedOn: "YYYY-MM-DD" | null, cities: Array<{ id, city, airport, fetchedOn, days: Array<{ depart: "YYYY-MM-DD", return: "YYYY-MM-DD", price: number /* KRW 정수 */ }> }> }`
  - 받지 못한 도시는 목록에 없음(빈 값 · 숫자를 만들지 않음). `low` (구글 싼 날)는 계약에 넣지 않음(쓰지 않는 값).
- `packages/shared/src/domain/airfare.ts` — 순수 계산: 가장 싼 날 · 요일별 평균 · 출발일에 따른 차이(최저 ↔ 최고) · 머리 문장 · 풀이 · 가격 색 단계(아래 1/4 · 위 1/4). 화면 · API 둘 다 여기 씀.

### 2. API (apps/api) — 새 슬라이스 `features/airfare/`
- `serpapi.ts`: `google_flights_calendar` 요청 만들기 · 응답 → `days[]` 변환(형식 검사 · 가격 없는 날 버림 · 응답 글은 데이터로만). 키는 `env.SERPAPI_KEY` · 없으면 건너뜀(다른 수집과 같음). 키 · 전체 URL 을 로그에 쓰지 않음.
- `due.ts`: 이 회차에서 받을지 — UTC 03:00 회차 · 요일 월 · 수 · 금 · 그날 이미 받은 도시는 건너뜀(재시도 회차가 다시 부르지 않게 → 한 달 104회 유지).
- `collect.ts`: 8곳을 차례로 · 도시마다 실패해도 다음 도시 계속 · 결과 `{status, rows, cities}` 로그.
- `store.ts`: 받은 묶음 저장 · 도시별 가장 최근 묶음 읽기.
- `routes.ts`: `GET /airfare/calendar` → `AirfareCalendar`. BFF 허용 목록에는 넣지 않음(빌드 때만 읽음 — 브라우저가 부를 일 없음).
- `index.ts` scheduled: `CRON.fxDaily` 회차에서 `airfareDue` 면 수집 (새 cron 문자열 없음 → wrangler.jsonc 안 바꿈).
- `env.ts`: `SERPAPI_KEY?: string` 이름만.
- 고정 자료: `features/airfare/fixtures/` — `.tmp/airfare-cal/bundle.json` 과 SerpApi 원 응답 모양 (키 · 검색 주소 빼고).

### 3. DB (보호 파일 · 승인 필요)
- `apps/api/src/db/schema.ts`: 새 표 `airfare_calendar`
  - `airport` text · `fetched_on` text(YYYY-MM-DD · 받은 날) · `depart` text · `return_date` text · `price` integer · `fetched_at` text
  - 기본 키 (airport, fetched_on, depart) — 같은 날 다시 받으면 덮어씀. 지난 묶음은 남김(나중 누적 신호용 · 한 번에 8 × 42 ≈ 336줄 · 주 3회 ≈ 한 달 4,400줄).
  - 읽기는 도시별 최신 fetched_on 하나만 → 인덱스 (airport, fetched_on). D1 읽기 한도: 빌드 한 번에 약 336줄 + 인덱스 탐색.
- 새 마이그레이션 `apps/api/drizzle/migrations/0011_airfare_calendar.sql` (기존 파일 수정 없음 · drizzle-kit 생성 → meta 포함)

### 4. 배포 (보호 파일 · 승인 필요)
- `.github/workflows/deploy-api.yml`: env 에 `SERPAPI_KEY: ${{ secrets.SERPAPI_KEY }}` · 비밀값 넘김 반복 목록 `for name in KCS_KEY KOSIS_KEY ECOS_KEY` 에 `SERPAPI_KEY` 추가. GitHub Secrets 에는 이미 등록됨(11-19).

### 5. 화면 (apps/web) — `features/travel-price/` 안 새 구역
- `app/flights/page.tsx`: 빌드 때 `api.airfareCalendar()` 를 같이 받음 (`shared/api.ts` 에 한 줄).
- `components/airfare-calendar/*`: 구역 · 탑승권 · 글자판 가격 · 날짜 띠 · 요일 막대 · 요약 · 안내 한 줄. 시안 `.tmp/motion-pages/m-airfare.src.js` · `m-airfare.css` 를 React · Tailwind · 토큰으로 옮김.
  - 글자판 가격은 기존 FlapBoard/글자판 부품(packages/ui) 재사용 · 국기는 0199 국기 부품 재사용.
  - 움직임은 motion/react · 고른 날 표시 위치는 칸 `offsetLeft`/`getBoundingClientRect` 픽셀 값 · 비행기 애니메이션은 다음 비행 전에 `cancel()`.
  - `useReducedMotion` 이면 최종 상태.
  - 자료가 없으면(`fetchedOn: null` · 도시 0) 구역은 "아직 받지 못했습니다" (다른 구역과 같은 문구 · 숫자 없음).
- `flights-page.tsx`: 창밖 12달 아래에 구역 한 줄 추가 (그 외 변경 없음).

## 대안 · 트레이드오프
- 새 cron(월 · 수 · 금) 문자열 → `wrangler.jsonc` 도 보호 파일이라 승인 세 곳이 됨. 기존 평일 회차 + 요일 판단(순수 함수 · 테스트 가능)으로 대신함.
- 기존 `indicator_points` 표 재사용 → 값 하나(series, period)라 돌아옴 날짜 · 받은 날을 담지 못하고 source enum 도 바꿔야 함(어차피 스키마 변경). 새 표가 명확함.
- 화면이 BFF 로 실시간 읽기 → 자료가 주 3회만 바뀜 · D1 읽기 한도 · 정적 사이트 원칙. 빌드 때 읽기로 충분(수집 뒤 다시 빌드 후크는 기존 것 사용 여부를 builder 가 확인 — 지금은 fx 저장 시에만 부름. 월 · 수 · 금 03:00 수집이 fx 수집과 같은 회차라 평일 다시 빌드(03:30)에 포함됨).

## 파일 계획
- packages/shared/src/contracts/airfare.ts · packages/shared/src/domain/airfare.ts (+ 테스트) · packages/shared/package.json exports (필요하면)
- apps/api/src/features/airfare/** · apps/api/src/index.ts · apps/api/src/env.ts
- apps/api/src/db/schema.ts **(보호)** · apps/api/drizzle/migrations/0011_*.sql · apps/api/drizzle/migrations/meta/** (새 스냅숏 · 기존 파일 수정은 _journal.json 추가 줄만)
- .github/workflows/deploy-api.yml **(보호)**
- apps/web/src/shared/api.ts · apps/web/src/app/flights/page.tsx
- apps/web/src/features/travel-price/components/airfare-calendar/** · flights-page.tsx · apps/web/src/features/travel-price/lib/airfare*.ts
- apps/web/e2e/** · *.test.ts(x) (test)
- docs/domain/** (항공권 달력 규칙 — 받지 못한 값 · 주 3회)
- .agents/specs/0234-airfare-calendar/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
-

## 위험
- 보호 파일 두 곳 — 승인 전에는 머지 불가. 게이트는 `ALLOW_PROTECTED` 없이 보호 파일 경고/실패를 낼 수 있음 → test 판정 보고에 그대로 적고, 승인 후 사람이 `ALLOW_PROTECTED=1` 로 확인.
- 마이그레이션은 되돌리기 어려움 — 새 표 추가만(기존 표 변경 없음).
- SerpApi 무료 한도: 재시도 회차 · 수동 실행에서 중복 호출 → `due.ts` 가 "그날 받은 도시 건너뜀"으로 막음 · 테스트로 고정.
- 아직 안 받아 본 공항 4곳(DAD · SIN · JFK · LHR) — 빈 결과면 그 도시는 화면에서 빠짐(R10). 구현 때 한 번씩만 실제 확인(총 4회) · 결과는 trace 에.
- 시안 움직임이 복잡 — 사파리 엔진 픽셀 위치 · 두 번째 비행 문제를 e2e(webkit)로 고정.

## 검증 계획
- 단위(test): 계약 파싱 · 도메인 계산(가장 싼 날 · 요일 평균 · 차이 · 문장) · serpapi 응답 변환(빈 결과 · 가격 없는 날) · due(요일 · 그날 받은 도시) · store · routes · scheduled 연결
- e2e(test · 고정 자료 빌드): R1 ~ R8 · chromium + webkit · 1280 · 390 · reduced-motion
- 게이트: Full (`bash .agents/checks.sh`) → verdict.md 규칙
- 미리보기: 1280 · 390 시안 스크린샷과 나란히 캡처
- PR: CI gate 최신 커밋 SUCCESS · 보호 파일 승인 요청 문단

## 순서
1. test — 테스트 먼저(단위 + e2e · FAIL 확인) 커밋
2. builder — ① 계약 · 도메인 → ② API 슬라이스 · 스키마 · 마이그레이션 · 워크플로 → ③ 화면 (단계별 커밋)
3. builder — 아직 안 받아 본 공항 4곳 각 1회 실제 확인(키는 .dev.vars · 값 출력 금지) → trace
4. test — 판정 · 미리보기 캡처
5. lead — PR (보호 파일 두 곳 · 이유 · 승인 요청) → CI gate 확인

## 계획과 달라진 점
- (lead · 테스트 먼저 뒤) CI 게이트는 운영 API 를 읽는데 운영엔 `/airfare/calendar` 가 머지 전까지 없다 → 고정 자료 e2e(R1 ~ R8)가 CI 에서 "건너뜀"이 된다. 그래서 **PR 전에 test 가 고정 자료 빌드로 한 번 확인한다**: `e2e/fixture-api.mjs` 를 켜고 `TRIPFX_API_URL=http://127.0.0.1:4398 AIRFARE_FIXTURE=1` 로 빌드 1회 + e2e(크롬 · 사파리 엔진). 결과를 PR 설명에 적고, CI gate 는 그대로 규칙 2로 본다. 머지 · 배포 뒤 첫 수집이 되면 운영 자료로 e2e 가 다시 돈다.
- (lead) 사파리 엔진: Playwright WebKit 을 저장소 안 `.tmp/pw-browsers` 에 설치한다 (`PLAYWRIGHT_BROWSERS_PATH=.tmp/pw-browsers npx playwright install webkit`) — 작업 폴더 밖에 쓰지 않음(AGENTS.md 5).
- 함수 · 파일 · testid 이름은 test 가 각 테스트 머리 주석에 적은 것이 계약이다 (shared exports `./airfare` · `./airfare-domain`).
