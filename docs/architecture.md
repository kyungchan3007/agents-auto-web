# 구조 · 경계

> 사람과 에이전트가 같이 읽는 구조 설명. **코드로 확인할 수 있는 경계는 린트로 옮기고 여기엔 이유만 남긴다.**
> 2026-10-28 합의 (작업 0012 · 이슈 #12).

## 결정 요약
| 항목 | 결정 | 상태 |
| --- | --- | --- |
| 저장소 | 모노레포 · Turborepo (`apps/*` · `packages/*`) | 확인됨 |
| 프론트 | `apps/web`(운영) · `apps/admin`(어드민) Next.js 16 · 정적 내보내기 → Cloudflare Workers 정적 자산 · 앱마다 Worker 하나 · VSA | 확인됨 (어드민 분리 2026-11-23 · 작업 0312) |
| 백엔드 | `apps/api` Hono → Cloudflare Workers · D1 · Cron Triggers · VSA | 확인됨 |
| 디자인 시스템 | `packages/ui` — 두 앱이 함께 쓰는 범용 부품 · 토큰 · 훅만 · 한 앱만 쓰는 도메인 UI 는 그 앱의 `src/shared/<도메인>` | 확인됨 (작업 0312) |
| 백엔드가 필요한 이유 | 환율 알림 · 즐겨찾기 저장 (사용자 설정 · 매일 확인 · 알림) | 확인됨 |
| 데이터 원본 | **D1** (SQLite) + **Drizzle ORM** — 나중에 Postgres 로 옮길 수 있게 (Drizzle 은 둘 다 지원) | 확인됨 (2026-10-28) |
| 수집 | `apps/api` Worker **Cron** 이 매일 수집 → 형식 검사 → D1 (스크립트 · AI 아님) | 확인됨 |
| 화면이 데이터를 읽는 법 | 빌드할 때 API 에서 받아 정적 페이지로 | 가정 |
| 공개 일지 | git 커밋 · PR · 작업 폴더 (데이터 저장 위치와 무관 · 수집 기록은 운영용) | 확인됨 |
| 로그인 · 알림 수단 | 이메일 매직 링크 · 이메일 알림 | 가정 |
| 패키지 매니저 · 이름 | npm workspaces · `@hav/<이름>` | 가정 |
| 주소 | 사이트 `flapfx.com` (Flapfx · Workers `agents-auto-web`) · 어드민 `admin.flapfx.com`(작업실 · GEO 측정 · 만드는 방식 · 알리기 · `apps/admin` · Worker `flapfx-admin` · 검색에 막음 · 작업 0302 · 0312) · API `tripfx-api.developfff.workers.dev` | 확인됨 (2026-11-17 · 작업 0190 · 옛 `tripfx.pages.dev` 는 삭제) |

## 전체 그림
```text
                 ┌──────────── Cloudflare ─────────────┐
방문자 ──▶ Pages: apps/web (정적 HTML)                   │
             │  읽기 전용 화면: 환율 · 신호 · 계산기 · 일지   │
             └──▶ Workers: apps/api (Hono)               │
                    ├─ 로그인 · 알림 설정 · 즐겨찾기 API     │
                    ├─ D1: 사용자 · 알림 조건 · 즐겨찾기     │
                    └─ Cron: 매일 환율 확인 → 알림 발송      │
                 └──────────────────────────────────────┘
```
- 화면은 백엔드 없이도 뜬다 — 백엔드는 로그인이 필요한 기능(알림 · 즐겨찾기)에만 (가정)
- 브라우저는 외부 환율 API를 직접 부르지 않는다 (API 키 노출 · CORS)

## BFF — 같은 주소의 `/bff/*` (2026-10-28 · 작업 0048 · 사용자 선택: "Pages 유지 · BFF만")
- SSR 은 하지 않음 — 하려면 Workers 로 옮겨 주소가 바뀜 → 주소(tripfx.pages.dev)와 정적 화면 유지 · 빌드 때 데이터 + 하루 한 번 재빌드 그대로
- `functions/bff/[[path]].ts` (Pages Functions) → `apps/web/src/bff/proxy.ts` → **서비스 바인딩** `API` → API Worker (인터넷을 거치지 않음)
  - 브라우저는 같은 주소만 부름 → CORS 없음 · API 주소가 화면 코드에 없음 · 캐시를 한곳에서 (작업 기록 3초 · 나머지 5분 · 실패는 캐시 안 함)
  - 읽기 경로만 허용 (`activity` · `fx/latest` · `fx/:통화/history` · `signal` · `prices/levels` · `tasks` · `status` · `geo`) · 쓰기 · 관리 경로는 404/405
- `functions/_middleware.ts` → `apps/web/src/bff/track-visit.ts`: GEO 방문 집계 · 경로는 `public/_routes.json` 으로 HTML 만 · Pages 의 D1 바인딩으로 `geo_hits` 에 바로 씀 (공개 쓰기 경로 없음 · 작업 0129)
- Pages 루트 디렉터리가 저장소 맨 위라 `functions/` · `wrangler.jsonc`(Pages 바인딩 원본)도 맨 위
- 만드는 중 페이지의 지난 작업 · 작업 이름: **GitHub Actions(`sync-tasks.yml`)** 가 자동 토큰으로 이슈 · 머지된 PR 을 받아 D1 `github_items` 에 저장 → `GET /tasks` → `/bff/tasks` (2026-10-28 · 작업 0052)
  - 처음엔 Pages 빌드에서 GitHub API 를 직접 불렀으나 빌드 서버 IP 공유로 403 → 사람이 만드는 토큰 없이 바꿈 (새 비밀값 없음 · D1 쓰기는 배포용 토큰)
  - 언제: API 배포가 끝난 뒤(머지마다) · 이슈 열림 · 제목 바뀜 · 손으로 · **저장소 주인이 연 이슈만** 이름으로 씀 (공개 저장소라 누구나 이슈를 열 수 있음)
- 순서: ① 기록 API (0046) → ② BFF (0048) → 홈 성능 → ③ 만드는 중 페이지 → ④ 🧳 3D 캐릭터

## 사이트 Worker — Workers 로 옮김 (2026-11-17 · 작업 0189 · 사용자 결정: "Workers 로 새로")
- 사이트 이름이 Flapfx · 주소가 `flapfx.com` 으로 바뀜 (#208). `tripfx.pages.dev` 는 끊고, 새 Cloudflare **Workers** 프로젝트 `flapfx` 에서 배포한다 (어드민 페이지도 여기에).
- 화면은 그대로 정적 내보내기(`apps/web/out`)를 Workers 정적 자산으로. Pages Functions 자리는 `apps/web/worker/index.ts` 가 대신함
  - `/bff/*` → `src/bff/proxy.ts` (서비스 바인딩 `API`) · 페이지 → 자산 + `src/bff/track-visit.ts` (D1 `DB`)
  - Worker 를 먼저 지나는 경로는 `worker/routes.ts` → `wrangler.jsonc` `assets.run_worker_first` (이미지 · 스크립트는 Worker 를 지나지 않음)
- 설정 `apps/web/wrangler.jsonc` · Workers Builds: 루트 = 저장소 맨 위 · 빌드 `npx turbo run build --filter=@hav/web` · 배포 `npx wrangler deploy --config apps/web/wrangler.jsonc`
- 운영 빌드 지킴(`mustHave`)은 Pages(`CF_PAGES`) · Workers Builds(`WORKERS_CI`) 둘 다 main 일 때 동작
- 옛 Pages 설정(맨 위 `wrangler.jsonc` · `functions/` · `public/_routes.json`)은 Pages 프로젝트 삭제(2026-11-17)와 함께 지움 (작업 0190) · Worker 이름 `agents-auto-web` · 도메인 `flapfx.com` · `www.flapfx.com` 은 `apps/web/wrangler.jsonc` `routes` 가 원본
- 평일 다시 만들기 · 수집 뒤 다시 빌드는 Workers Builds 배포 후크(`daily-rebuild` · main) — 비밀값 이름은 그대로 `PAGES_DEPLOY_HOOK`

## 자동 배포 (2026-10-28 · 작업 0042 · 사용자 확인: "CI할때자동으로 배포될수 있게 해야지")
| 무엇 | 언제 | 어떻게 |
| --- | --- | --- |
| 사이트 (Pages) | main 머지마다 · PR 마다 미리보기 | Cloudflare Pages ↔ GitHub 연결 |
| API (Worker) | main 의 `checks` 가 통과하면 | `.github/workflows/deploy-api.yml` — D1 마이그레이션 → `wrangler deploy` → `/health` 확인 |
| 사이트 다시 빌드 | 평일 03:30 UTC (수집 30분 뒤) | `.github/workflows/rebuild-site.yml` — Pages 배포 훅 |
| 비밀값 | 사람이 GitHub Secrets 에 | `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` · `PAGES_DEPLOY_HOOK` — 없으면 건너뜀 |

## 어드민 분리 (2026-11-23 · 작업 0312 · 사용자 요청 "어드민을 apps/admin 으로 분리")
- 기준은 사용자 저장소 `kyungchan3007/frontend-architecture` 의 정리: 앱은 배포 단위 · 앱끼리 참조하지 않음 · 두 앱이 함께 쓰는 코드는 `packages/` · 한 앱만 쓰는 공통은 그 앱의 `src/shared` (자세한 근거는 `.agents/specs/0312-admin-split/sdd.md` "기준")
- `apps/admin`: 별도 Next 정적 앱 · Worker `flapfx-admin`(`apps/admin/wrangler.jsonc` · 도메인 `admin.flapfx.com`) · 모든 응답에 검색 막음 · `/` → `/log` · 운영 주소는 `flapfx.com` 으로 301 (`apps/admin/worker/host.ts`)
- `apps/web` Worker 는 옛 어드민 경로(`/log` · `/geo` · `/how` · `/marketing`)를 `admin.flapfx.com` 으로 301 만 (`apps/web/worker/host.ts`) · 어드민 경로 목록은 `@hav/shared/site` 의 `ADMIN_PATHS` 한 곳
- BFF 프록시는 `@hav/edge/bff` 하나 · 경로표는 앱마다(`apps/*/worker/bff-routes.ts`) — 운영은 환율 · 신호 · 물가 · 시계열, 어드민은 작업 · 상태 · GEO · 작업 기록
- 배포: Workers Builds 를 앱마다 연결(사람이 설정) · 평일 다시 빌드는 `PAGES_DEPLOY_HOOK`(운영) · `ADMIN_DEPLOY_HOOK`(어드민 · 없으면 건너뜀)

## 저장소 구조
```text
apps/
├── web/                         @hav/web — 운영 flapfx.com (Next.js 정적 + worker/)
│   └── src/
│       ├── app/                 라우트 조립만 (기능 로직 · 파일 읽기 없음 — 빌드 때 읽기는 *.server.ts)
│       ├── features/<기능>/<하위 도메인>/   화면(.tsx) · 훅(use-*.ts) · 로직(*.ts) · 테스트를 한 폴더에 (종류별 components · hooks · lib 폴더 금지)
│       ├── shared/<묶음>/       운영 앱 공통 — nav · seo · outage · signal · trip · rate
│       └── checks/              사이트 전체 소스 검사 테스트
├── admin/                       @hav/admin — 어드민 admin.flapfx.com (Next.js 정적 + worker/)
│   └── src/ app/ · features/<기능>/<하위 도메인>/ · shared/<묶음>/(nav · ui · time · text · repo · clipboard · fold · live · search)
└── api/                         @hav/api — Hono (Workers)
    └── src/
        ├── index.ts             app.route() 로 슬라이스 묶기 + scheduled(Cron)
        └── features/<기능>/     VSA 슬라이스: 라우트(핸들러 직접) · 로직 · D1 쿼리 · 스키마 · 테스트
packages/
├── ui/                          @hav/ui — 범용 디자인 시스템: components/{layout,text,form,data,feedback,motion} · hooks/<묶음>(browser · view · motion · flap · chart · nav) · lib/<묶음>(chart · motion · text · color) · tokens.css · three/(보관)
├── shared/                      @hav/shared — contracts/ 스키마 · domain/ 업무 규칙 · utils/ 공통 도구 · site/ 주소 · client/ API 받기 (공개 이름은 exports 로 유지)
├── edge/                        @hav/edge — Worker 공용: bff(프록시 · 경로표는 앱이 넘김) · noindex(검색 막음)
└── config/                      @hav/config — tsconfig · eslint 공용 설정
turbo.json                       작업 그래프 (build · lint · typecheck · test)
```

## 규칙
### Turborepo ([근거](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))
| 규칙 | 이유 |
| --- | --- |
| 앱 · 서비스는 `apps/`, 나머지는 `packages/` · 중첩 glob(`apps/**`) 금지 | 공식 권장 구조 |
| 패키지마다 `package.json` · 고유 이름(`@hav/…`) · `exports` 로 진입점 지정 · 전체를 다시 내보내는 barrel 파일 지양 | 패키지 경계를 명확히 |
| 패키지끼리 `../` 상대 경로 import 금지 → 패키지 이름으로 import | 의존성이 lock 파일 · 작업 그래프에 드러나게 |
| 루트 `tsconfig.json` 두지 않음 → 각 패키지가 `@hav/config` 를 상속 | 공식 권장 |
| 루트 `package.json` 은 `private` · 스크립트는 `turbo run …` | 게이트(`checks.sh`)가 루트 스크립트를 그대로 부름 |

### VSA — 프론트 · 백엔드 공통 ([근거](https://www.jimmybogard.com/vertical-slice-architecture/))
| 규칙 | 이유 |
| --- | --- |
| 기능(요청) 하나 = `features/<기능>/` 폴더 하나 — 화면 · 로직 · 데이터 접근 · 테스트를 같이 둠 | 변경이 슬라이스 하나에 머묾 → 이슈 하나 = 폴더 하나 = 에이전트 파일 계획 |
| 슬라이스끼리 직접 import 금지 — 함께 쓰는 것은 `packages/shared` · `packages/ui` 로 | "슬라이스 사이 결합은 줄이고, 슬라이스 안 결합은 키운다" |
| 공용 계층(repository · service)을 미리 만들지 않음 — 슬라이스마다 단순하게 시작, 복잡해지면 그 슬라이스만 나눔 | 원문: 슬라이스마다 방식이 달라도 됨 |

### Hono ([근거](https://hono.dev/docs/guides/best-practices))
| 규칙 | 이유 |
| --- | --- |
| Rails식 컨트롤러 파일을 따로 만들지 않음 — 경로 옆에 핸들러를 바로 씀 (필요하면 `hono/factory` 의 `createHandlers`) | 분리하면 경로 파라미터 타입 추론이 깨짐 |
| 슬라이스마다 `Hono` 인스턴스 → `index.ts` 에서 `app.route('/경로', 슬라이스)` | 공식 권장 큰 앱 구조 |
| 요청 · 응답 모양은 `@hav/shared` zod 스키마 한 곳 · API 는 `validate()` 로 요청 검사 · 실패는 `ApiError` 한 모양 400 | 사용자 확인: "api는 zod 사용하도록 지저분한거 싫으니까" (작업 0033) |
| `apps/web` 은 빌드 때 fetch 로 부르고 **같은 zod 스키마로 응답을 검사** — 실패해도 빌드는 성공 · 화면은 "자료 없음" (Hono RPC `hc` 는 쓰지 않음: 타입만 주고 런타임 검사는 안 해서) | 작업 0035 · 실제 응답에서 원본 오류(짐바브웨 물가 0.0003)를 스키마가 잡음 |
| HTTP 와 예약 실행을 한 Worker 에: `export default { fetch: app.fetch, scheduled }` | [Cloudflare Hono 가이드](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/index.md) · [Cron 예제](https://developers.cloudflare.com/workers/examples/cron-trigger/) |

## 경계 규칙 → 강제 위치
| 규칙 | 강제 | 위치 |
| --- | --- | --- |
| 슬라이스끼리 import 금지 · 앱 공통은 기능을 가져오지 않음 | 테스트 | `apps/{web,admin}/src/role-boundary.test.ts` |
| 화면(`.tsx`)은 그리기만 — 상태 · 효과 훅 직접 금지(커스텀 훅 `use-*.ts`) · 계산(거르기 · 정렬 · 자르기 · Math · 정규식 · 날짜 · 서식) 금지 · 로직 함수 export 금지 | 테스트 (작업 0125 · 0312) | `apps/{web,admin}/src/role-boundary.test.ts` · `packages/ui/src/role-boundary.test.ts` |
| 종류별 폴더(components · hooks · lib) 금지 · 한 폴더에 훅 4개까지 · 파일 읽기는 `*.server.ts` 만 | 테스트 (작업 0312 · 0137 을 뒤집음) | 같은 곳 |
| 앱 공통(`src/shared`)은 묶음 폴더 · 허용 목록 — 두 앱이 함께 쓰면 `@hav/shared` · `@hav/ui` · `@hav/edge` · 의존 방향 shared ← ui ← apps | 허용 목록 테스트 (작업 0126 · 0312) | `apps/web/src/checks/role-boundary.test.ts` |
| 숫자 · 원 · 변화율 · 날짜 · 달 번호 표기는 `@hav/shared/format` · `date` · JSON 받기는 `@hav/shared/fetched` · API 받기는 `@hav/shared/api` | 작업 0136 · 0312 | 해당 패키지 |
| 어드민 메뉴 경로 = `ADMIN_PATHS` (두 Worker 가 같은 목록) | 테스트 (작업 0312) | `apps/admin/src/shared/nav/admin-pages.test.ts` |
| 패키지끼리 `../` import 금지 | (예정) eslint `no-restricted-imports` | `@hav/config` eslint |
| `apps/web` 은 외부 환율 API를 직접 부르지 않음 | (예정) eslint · 테스트 | `@hav/config` eslint |
| API 입력은 zod 검증을 거침 | 슬라이스 테스트 | `apps/api` 테스트 |
| API 라우트에 쿼리 금지 · 쿼리는 기능별 `store.ts` | 테스트 (작업 0127) | `apps/api/src/role-boundary.test.ts` |
| 로그는 JSON 한 줄 · 비밀값 가림 | 테스트 (작업 0127) | `apps/api/src/log.ts` |
| 끝나지 않은 Promise 금지 | eslint (작업 0127) | `packages/config/eslint.mjs` |
| 비밀값은 `.env*` · Wrangler secret · CI Secrets 에만 | `.gitignore` + 보호 파일 | `.gitignore` · `.agents/protected.txt` |

## 아직 정하지 않은 것
| 항목 | 언제 |
| --- | --- |
| 환율 출처 (수출입은행 + Frankfurter 예비 제안) · 신호 계산 · 직구 범위 | 데이터 논의 (#4) |
| 디자인 토큰 · 컴포넌트 목록 | 디자인 논의 (#3) |
| 선 그래프 · 월 막대(SVG)의 그리기 안 좌표 계산 나누기 | 작업 0312 다음 (배치 묶음은 `lib/chart/line-chart-layout.ts` 로 옮김) |
| 로그인 · 알림 방식 · D1 테이블 | 백엔드 이슈 만들 때 |
| Cloudflare 무료 한도 (Cron 개수 등) | 설정할 때 공식 한도 페이지로 확인 (출처마다 숫자가 다름) |
