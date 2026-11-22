# PRD — 무엇을 · 왜

> 원문(request.md)을 옮긴 파생 문서. 요구 충족 판정 기준은 언제나 원문이다

## 문제
- 어드민(작업실 · GEO 측정 · 만드는 방식 · 알리기)이 운영 앱 `apps/web` 안에 섞여 있다.
  - 라우트(`app/`) · 기능 폴더(`features/`) · 앱 공통(`shared/`)이 같은 폴더를 함께 쓴다.
  - Worker 하나가 주소(host)를 보고 나눈다(`worker/host.ts`). 어드민 경로 목록이 `host.ts` · `admin-nav.tsx` · `routes.ts` · `wrangler.jsonc` · 페이지 metadata 다섯 곳에 따로 적혀 있다.
  - 어드민 빌드가 실패하면 운영 배포도 함께 막힌다.
- 역할 분담이 어긋난 곳이 있다(점검 결과는 sdd.md "점검 결과").
  - `.tsx` 안에 비즈니스 로직이 있다. 예: `app/how/page.tsx` 의 fs 읽기와 세기, `admin-shell.tsx` 의 상태 7개와 효과 4개.
  - 두 곳 이상에서 쓰는 로직이 중복돼 있다. 예: `repoRoot()` 2벌, 상대 시간 문구 2벌, 한국 시각 문구 3벌.
  - `hooks/` · `lib/` · `components/` 에 파일이 평평하게 늘어서 있다. 예: `currencies/lib` 18개, `currencies/hooks` 13개, `packages/ui/src/hooks` 16개.
  - 디자인 시스템 `@hav/ui` 안에 어드민 전용(`components/admin/*` · `lib/admin-events`)과 범용이 섞여 있다.

## 목표
기준은 사용자 저장소 `kyungchan3007/frontend-architecture` 의 정리 내용이다(sdd.md "기준").
1. 어드민을 `apps/admin` 으로 떼어 낸다. 별도 Next 정적 앱으로 만들고 Worker 를 따로 둔다(admin.flapfx.com). `apps/web` 에는 운영 화면만 남긴다.
2. 두 앱이 함께 쓰는 코드는 `packages/` 로 올린다. 예: API 호출, 사이트 주소 상수, BFF 프록시, 검색 막기 머리글, 범용 훅.
3. 한 앱 안에서만 여러 곳이 쓰는 코드는 그 앱의 도메인 공통(`src/shared/`)에 둔다.
4. 디자인 시스템도 같은 기준으로 나눈다. 두 앱이 함께 쓰는 것(tokens · 범용 훅 · 찾기 match)은 `@hav/ui` 에 남긴다. 어드민만 쓰는 부품은 어드민 도메인으로 옮긴다.
5. `.tsx` 는 그리기만 한다. 상태 · 효과는 커스텀 훅(`use-*.ts`)에, 계산 · 문구 고르기 · 파싱 · fs 읽기는 lib 순수 함수(서버 전용은 `*.server.ts`)에 둔다.
6. 폴더를 종류별로 평평하게 두지 않는다. 기능 폴더 안을 하위 도메인(관련 화면 · 훅 · lib 묶음) 폴더로 나눈다. 훅 · lib · 컴포넌트 모두 같다.
7. 아무도 쓰지 않는 파일은 지운다.

## 비목표
- 화면 모양 · 문구 · 동작은 바꾸지 않는다. 구조만 바꾸는 리팩터링이다.
- `apps/api` 내부 구조는 바꾸지 않는다. 이번 범위는 프런트(apps/web · apps/admin · packages/ui · packages/shared)다.
- Cloudflare 대시보드 설정(새 Worker 프로젝트 · Workers Builds 연결 · 배포 후크)은 에이전트가 하지 않는다. 사용자가 한다(sdd.md "배포 전환").

## 애매한 곳
- 어드민 전용 부품을 별도 패키지(`@hav/admin-ui`)로 뺄지, `apps/admin/src/shared/ui` 에 둘지 → (가정) 앱 안에 둔다. 근거는 기준 저장소의 "앱이 하나면 src/ui 로 시작하고, 다른 앱과 함께 쓸 일이 생기면 패키지로 옮긴다"(2026-11-03-pkg.md)다.
- 운영만 쓰는 도메인 UI(여행 · 통화 · 비행기 3D)가 `@hav/ui` 에 있는 것 → (가정) 이번에는 `@hav/ui` 안에서 `domain/` 묶음으로 구분만 한다. 모두 옮기면 변경이 너무 커지고, 화면 회귀 위험이 이득보다 크다. sdd 에 근거를 적는다.
- 보호 파일 변경 → 앱 분리에는 꼭 필요한 변경이다. 사용자 요청("apps/admin 으로 분리 · 진행해")을 승인으로 보고, 바꾼 목록을 sdd · PR 에 밝힌다. `harness-approved` 라벨은 사용자가 단다.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] `apps/admin` 이 단독으로 빌드된다. /log · /geo · /how · /marketing 이 지금과 같은 화면으로 나온다.
- [ ] `apps/web` 빌드 결과(out/)에 어드민 페이지가 없다. flapfx.com/log 같은 옛 주소는 계속 admin.flapfx.com 으로 301 넘어간다.
- [ ] `.tsx` 에 상태 · 효과 훅을 직접 쓰는 곳이 없고, 정해 둔 비즈니스 로직 위반 목록(sdd "점검 결과")을 모두 옮겼다.
- [ ] 기능 폴더에 평평한 `hooks/` · `lib/` · `components/` 가 남지 않았다(하위 도메인 폴더로 나눔).
- [ ] 두 앱이 함께 쓰는 코드가 앱 안에 복사본으로 남지 않았다.
