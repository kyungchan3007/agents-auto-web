# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 기준 (사용자 저장소 kyungchan3007/frontend-architecture)
- 앱(`apps/`)은 배포 단위다. 앱끼리 서로 참조하지 않는다. 공유 코드는 `packages/` 에 둔다(터보레포 문서 · README "공용 패키지 경계").
- 패키지는 목적을 하나만 갖는다. 도메인 전용 패키지도 허용한다. barrel(index.ts) 대신 `exports` 로 진입점을 낸다. 패키지끼리 `../` 로 넘나들지 않는다(research/01-architecture).
- 앱 공통은 앱의 `shared/` 에, 메뉴(기능) 전용은 그 묶음 안에 둔다(#59 FSD).
- 공통 컴포넌트 판단 표(rule-examples-2): 항상 같음 → 공통 컴포넌트 안 · 정해진 종류 중 고름 → 옵션 · 여러 화면이 쓰되 쓸지는 화면마다 다름 → 작은 컴포넌트 + children · 한 화면만 씀 → 그 화면.
- 앱이 하나만 쓰는 공통은 앱 안(`src/ui` · `src/shared`)에서 시작하고, 다른 앱과 함께 쓸 일이 생기면 패키지로 옮긴다. 패키지로 옮길 때는 토큰도 함께 옮긴다(2026-11-03-pkg).
- 로직 · 훅 · 화면을 나누면 React 없이 로직만 테스트할 수 있다(2026-11-03-role 구조 A).
- 사용자 추가 기준(request.md): `.tsx` 에 비즈니스 로직을 넣지 않고 커스텀 훅으로 뺀다. 두 곳 이상 쓰는 로직은 공통으로 둔다. `hooks/` · `lib/` · `components/` 에 파일을 평평하게 늘어놓지 않고 도메인 · 관련 로직 폴더로 묶는다.

## 접근

### 목표 구조
```
apps/
  web/     운영 flapfx.com — Worker: 방문 기록 · /bff(운영 경로) · 옛 어드민 주소 301
    src/app/                 라우트 · 조립만
    src/features/<기능>/<하위 도메인>/   화면(.tsx) · 훅(use-*.ts) · 로직(*.ts) · 테스트를 한 폴더에
    src/shared/              운영 앱 공통 (nav · seo · outage …)
    src/shared/ui/<도메인>/   운영만 쓰는 도메인 UI (여행지 고르기 · 통화 국기 · 신호 핀 …)
  admin/   어드민 admin.flapfx.com — Worker: /bff(어드민 경로) · 검색 막음 · / → /log
    src/app/                 log · geo · how · marketing
    src/features/<기능>/<하위 도메인>/
    src/shared/              어드민 공통 (nav · 시각 문구 · 숫자 쪼개기 · 저장소 읽기(server) · 복사)
    src/shared/ui/           어드민 부품 (틀 · 패널 · 글자판 · 막대 · 아이콘 · 링크 복사 · admin.css)
  api/     (그대로)
packages/
  shared/  계약(contracts) · 도메인 계산(domain) · 유틸(utils) + site(주소 상수) + client(API 받기)
  edge/    새 패키지 @hav/edge — Worker 공용: BFF 프록시(경로표는 앱이 넘김) · 검색 막음 머리글
  ui/      범용 디자인 시스템 — tokens · 범용 부품 · 범용 훅(묶음 폴더) · 찾기(match)
  config/  (그대로)
```

### 두 앱이 함께 쓰는 것 → 범용 패키지
| 무엇 | 지금 | 옮길 곳 |
| --- | --- | --- |
| SITE_URL · ADMIN_URL · SITE_NAME · REPO_URL | apps/web/src/shared/site.ts | `@hav/shared/site` |
| API 받기(getJson · api · LIVE · mustHave) | apps/web/src/shared/api.ts | `@hav/shared/api` |
| BFF 프록시 | apps/web/src/bff/proxy.ts | `@hav/edge/bff` (경로표는 앱마다) |
| 검색 막음 머리글(withNoindex) | apps/web/worker/host.ts | `@hav/edge/noindex` |
| tokens.css · 찾기(match) · 범용 훅(use-live · use-refresh · use-visible-interval) | @hav/ui | @hav/ui 에 그대로(묶음 폴더로) |
| 숫자 · 원 · 부호 표기, 숫자 입력 파싱, 달 번호 · 기간 문구 | 기능 폴더마다 따로 | `@hav/shared/format` · `@hav/shared/date` |

### 한 앱 안에서만 여러 곳이 쓰는 것 → 그 앱의 도메인 공통
- 어드민: `repoRoot()`(how · marketing 2벌), 상대 시간(relText · agoText), 한국 시각 문구 3종(kstStamp · timeText · shortTime), 큰 숫자 쪼개기(splitRun · splitValue), 복사 + 알림(marketing · perma-link), 펼치기 묶음 훅(use-rules · use-trials) → `apps/admin/src/shared/`
- 운영: 원 표기(destinations · flow), 신호 문구(SIGNAL_TEXT 2벌 · Signal 타입 재선언), 신호 → 맵(browse-layout · price-page), 판정 색(DOT 3벌 · tone 2벌), 0~1 위치(routePosition · scalePosition), 고른 여행지 저장(use-picked-destination · use-picked-trip · use-pick-trip · use-trip-switcher) → `apps/web/src/shared/` 또는 `@hav/shared/domain` (계산은 shared 패키지, 화면용은 앱 shared)

### 디자인 시스템
- 어드민만 쓰는 부품(`components/admin/*` · `lib/admin-events`)은 `apps/admin/src/shared/ui/` 로 옮긴다. admin.css 가 기대는 토큰(`--hav-card` · `--hav-on-accent` · `--font-sans`)은 `@hav/ui/tokens.css` 를 그대로 가져와 쓴다.
- 운영만 쓰는 도메인 UI(currency-flag · flag · pick-trip · trip-switcher · signal-pin · destination-row · year-chart · freshness-note 와 그 훅)는 `apps/web/src/shared/ui/<도메인>/` 으로 옮긴다.
- 아무도 쓰지 않는 모듈(three/** · data-table · ruler-chart · point-labels · page-section · layout/panel · filter-chip · link-row · use-count-tween · lazy-near · contrast)은 지운다. `three` 의존성도 뺀다.
- 범용 훅 · lib 는 평평하게 두지 않는다. `hooks/<묶음>/` · `lib/<묶음>/` 으로 묶는다(browser · motion · chart · live · search …).
- ui 부품 안의 상태 · 효과(nav-bar · fade-up · slide-in · rolling-number · flap-board · year-chart)는 같은 묶음의 훅으로 뺀다.

### 역할 분담 (.tsx 는 그리기만)
- 점검 결과(아래)의 위반은 모두 lib 순수 함수나 훅으로 옮긴다. fs 읽기는 `*.server.ts`, 파싱 · 세기는 순수 함수로 나눈다.
- `.tsx` 에서 로직 함수를 export 하지 않는다(예: currency-chips 의 commitPick).
- 검사로 막는다. `role-boundary.test.ts` 를 두 앱에 두고 넓힌다: 평평한 `components/` · `hooks/` · `lib/` 금지, `.tsx` 의 함수 export 금지, `React.use*` 우회 금지, app/ 라우트 포함.

### 배포 전환
- `apps/admin/wrangler.jsonc`: Worker 이름 `flapfx-admin`, 정적 자산 `out`, 서비스 바인딩 `API`(tripfx-api), 사용자 지정 도메인 `admin.flapfx.com`.
- `apps/web/wrangler.jsonc`: `admin.flapfx.com` 도메인을 뺀다. flapfx.com/log 같은 옛 주소는 계속 admin.flapfx.com 으로 301 넘긴다(검색 기록 보존).
- 사용자가 할 일(에이전트는 하지 않음): Cloudflare 에서 Worker `flapfx-admin` Workers Builds 연결(루트 = 저장소 맨 위 · 빌드 `npx turbo run build --filter=@hav/admin` · 배포 `npx wrangler deploy --config apps/admin/wrangler.jsonc`) · 평일 다시 빌드용 배포 후크를 만들어 Secrets `ADMIN_DEPLOY_HOOK` 에 넣기.
- main 반영 순서: 어드민 Worker 연결 → main 머지 → 운영 배포가 도메인을 놓음 → 어드민 배포가 도메인을 잡음. 어드민 배포가 "도메인 사용 중"으로 실패하면 운영 배포가 끝난 뒤 다시 돌린다.

## 대안 · 트레이드오프
- 어드민을 같은 Worker 에 두고 빌드만 합치기: 배포 단위가 그대로 하나라서 "어드민 빌드 실패가 운영을 막음"이 남는다. 고르지 않음.
- 어드민 부품을 패키지(`@hav/admin-ui`)로: 쓰는 앱이 하나라 설정 파일만 는다(2026-11-03-pkg "앱 하나에서는 얻는 것도 안 보인다"). 앱 안에 둔다.
- `packages/shared` 의 domain(운영만 씀)을 앱으로 내리기: api 도 같이 쓸 수 있는 계산이고, 지금 ui · web 이 함께 기댄다. 이번에는 그대로 둔다.
- 기능 폴더를 FSD 층(widgets · entities …)으로 바꾸기: 지금 규모에서 층이 늘기만 한다. 기능 → 하위 도메인 폴더(관련 화면 · 훅 · 로직 한곳)로 한다.

## 파일 계획
- .agents/specs/0312-admin-split/**
- apps/admin/** (새 앱)
- apps/web/** (어드민 제거 · 하위 도메인 폴더 · 역할 분담 · 테스트 경로)
- packages/shared/** · packages/ui/** · packages/edge/** (새 패키지)
- package.json (루트 scripts) · package-lock.json (보호 — 새 워크스페이스)
- scripts/e2e.mjs (두 앱 e2e 나눠 돌리기)
- apps/web/wrangler.jsonc · apps/admin/wrangler.jsonc · apps/admin/next.config.ts (보호 — 앱 분리에 필요)
- .agents/e2e-map.json · .agents/scripts/e2e-select.mjs · .agents/scripts/e2e-needed.mjs · .agents/scripts/harness.test.mjs (보호 — 어드민 e2e 경로)
- .github/workflows/rebuild-site.yml · .github/workflows/responsive.yml (보호 — 어드민 다시 빌드 · 경로)
- docs/architecture.md · .agents/orchestration/team.md · .agents/orchestration/TASKS.md
- turbo.json (보호 — 필요할 때만)

## 계획 밖 변경 이유
<!-- 경고가 뜬 파일과 이유 -->

## 점검 결과 (2026-11-23 · 옮길 위반 목록)
### 어드민
- app/how/page.tsx: repoRoot · safe · countRepo(fs 읽기 · 정규식 · JSON 파싱) → features/how/repo-counts/(server + 순수 함수)
- app/marketing/page.tsx: RAW 주소 계산 · repoRoot · readDrafts → features/marketing/drafts/
- log: record-card relText · 자르기 · 시간 차, status-board splitRun · shortTime · failed 판정 · 문구, story-section 번호 · sourceLinks, work-flow KEY
- geo: geo-report splitValue, geo-detail 필터 · 문구 · 봇 막대 묶기 · 최근 방문일, bot-pages 필터, day-chart 최댓값, questions-table answerText, rename-compare periodText · brandText · DayBars 좌표 · 라벨
- how: how-page node · count · stats · id 슬러그 · toLocaleString, how-trials 묶음 개수, how-search RANKS · TRY
- marketing-page: swapImage(DOM) · copy · RULES · 문구 조합 · latest
- ui/admin: admin-shell collect · 상태 7 · 효과 4 · 순위 매기기, bars · flap 효과, perma-link 복사
- 죽은 코드: log/lib/status.ts 일부 · stage.ts
### 운영
- import-calc: import-price-section 정규화 · 축 · 달 번호 · 문구, calc-result · customs-section 문구 · 변환, app/calc/page.tsx 레코드 조립
- travel-price: flights-graph 축 · 시리즈 조립, price-route 그라데이션 · 눈금 · 문구, window-months 최솟값 · 문구, price-page 신호 맵, flights-page 조합 · 문구, price-route-list 색 · 문구, airfare-calendar 가공, budget-planner 문구
- currencies: period-chart 통계 · 축, currency-table 맵 · 열 나누기, browse-layout 신호 맵 합치기, currency-chips commitPick export, range-card 단위 문구, currency-detail 조립, converter 문구
- home: destination-table 보간 · 위치, ticket 숫자 쪼개기(ui splitNumbers 있음) · 고르기 · replace, destinations-pill 자르기, year-bars aria, today-board 문구
- intro: boarding-pass 바코드, window-transition 이동 값, intro-cells 칸 채우기, intro 문구
- about: about-page bodyOf
- ui: pick-trip · nav-bar · year-chart · fade-up · slide-in · rolling-number · flap-board 상태 · 효과
- 안 쓰는 파일: currencies use-list-fit · list-fit · describe · load · summary, travel-price plane-model, log stage

## 위험
- 파일 이동이 많아 가져오기 경로가 깨질 수 있다 → 경로 자동 고침 스크립트 + 단계마다 typecheck · lint · 단위 테스트.
- 소스 파일을 경로로 읽는 단위 테스트(apps/web/src/shared/*.test.ts)가 조용히 깨질 수 있다 → 단계마다 단위 테스트를 전부 돌린다.
- 운영 도메인 전환 순서를 틀리면 admin.flapfx.com 이 잠시 끊긴다 → 위 "배포 전환" 순서를 PR · 회신에 적는다. develop 머지만으로는 운영에 영향이 없다.
- 화면이 바뀌면 안 된다 → 기존 e2e(운영 · 어드민)를 그대로 옮겨 돌린다. 화면 모양을 바꾸는 코드는 쓰지 않는다.

## 검증 계획
- 단계마다: 바꾼 패키지 typecheck · lint · 단위 테스트(전체).
- 마지막: 두 앱 build, 어드민 e2e 전체 · 운영 e2e 중 옮기거나 고친 spec, 하네스 테스트, PR 의 CI gate.

## 계획과 달라진 점
- 3D 비행기 부품(`packages/ui/src/three/**` · `motion/lazy-near.tsx`)은 지우지 않았다. 쓰는 곳은 없지만 "비행기 부품 파일은 그대로 둔다"는 예전 결정을 지키는 테스트(home-flap-board)가 있어 보관하고, 디자인 시스템 검사에서만 뺐다.
- 대비 계산(`lib/contrast`)은 쓰는 곳이 테스트뿐이라 지우려 했으나, 디자인 시스템 색 검사가 쓰고 있어 `lib/color/contrast.ts` 로 옮겨 남겼다.
- 요약 글(`currencies/lib/summary.ts`)은 어디서도 그리지 않아 지웠다. 화면에 보이는 "예측이 아닙니다" 안내는 꼬리말에 그대로 있다.
- 여행 물가(travel-price)는 `prices` · `flights` 두 기능 폴더로 나눴다. 두 페이지가 서로 가져오는 코드가 없어 경계가 그대로 드러난다.
- 소스 경로를 읽는 옛 테스트(apps/web/src/shared/*.test.ts 44개)는 깊이가 같은 `src/checks/` 로 옮기고, 화면을 읽던 검사는 "화면 + 옆 로직"을 함께 읽게 고쳤다(로직을 lib 로 옮겨도 같은 약속을 지키는지 봄).
- 작업 0137 의 "기능 폴더는 components · hooks · lib 로" 규칙은 이번 사용자 결정으로 뒤집었다. 새 검사는 종류별 폴더를 금지한다.
- 하네스(e2e 선택 · 가드 · 디자인 PR 판정 · 연결표)와 API 테스트 한 곳(BFF 경로표 위치)을 두 앱 구조로 고쳤다.

## 남은 일
- 선 그래프 · 월 막대(SVG) 부품의 그리기 안 좌표 계산(말풍선 · 꼬리표 비킴 · 막대 튐) — 배치 묶음은 `lib/chart/line-chart-layout.ts` 로 옮겼고, 나머지는 디자인 시스템 검사의 예외 목록에 적어 둠
- Cloudflare 설정(사람): Worker `flapfx-admin` Workers Builds 연결 · `ADMIN_DEPLOY_HOOK` 비밀값 · main 반영 순서는 위 "배포 전환"
- 로컬 어드민 e2e: 메인 폴더의 e2e 가드(이 작업 전 판)가 `apps/admin/e2e` 를 몰라 막음 — 빌드 결과를 띄워 네 화면 응답 · 글 · 검색 막음 · 찾기 창 동작을 확인했고, 전체 어드민 e2e 는 main 으로 가는 PR 의 CI 가 돎
