# 프로젝트 사실 기록표 (2026-11-15 기준)

> 사이트 소개 · README · 문서에 쓰는 숫자 · 사건은 모두 이 표에서 가져온다. 각 항목 끝 괄호가 출처다.
> "확인 필요"는 글에 쓰지 않는다.

## 1. 기간 · 규모
- 첫 커밋 2026-10-28 `07a0579`, 마지막 2026-11-15 `6fb63f9` (#181) (git log)
- 전체 커밋 168개 (`git rev-list --count HEAD`)
- 작업 폴더 135개, 모두 요청 원문(request.md) 있음 (`.agents/specs/0*`)
- 머지된 PR 140개, #1(10-28) ~ #181(11-14) (`gh pr list --state merged`)
- 첫날(10-28) 하네스 · 뼈대 · 수집 · D1 연결 · 자동 배포 · "만드는 중" 페이지까지 머지 (#1 ~ #51 포함, 날짜 기준에 따라 개수가 달라 개수는 쓰지 않음)
- 11-14 ~ 15 에이전트 팀(lead · builder · test · geo)으로 공공 자료 3종 연동 (#178 · #179 · #180 · #181)

## 2. 연동한 공공 자료
- 한국수출입은행 현재환율 — 평일 12:00, 실패 시 13:30 · 15:00 (`apps/api/src/features/fx/sources/koreaexim.ts`, `apps/api/wrangler.jsonc`)
- Frankfurter (예비, 키 없음) — 공식 값을 덮지 않음, 최근 30일 공식 통화만 채움 (FX-05 · FX-09, `docs/domain/fx.md`)
- 관세청 과세환율 (XML) — 주 1회, 이미 받은 주 건너뜀 (`apps/api/src/features/indicators/kcs.ts`, #178)
- 통계청 KOSIS 항공료 · 단체여행 물가지수 — 매달 최근 24개월 다시 받기 (`indicators/kosis.ts`, #179)
- 한국은행 ECOS 수입물가지수 — 매달 최근 24개월 (`indicators/ecos.ts`, #181)
- 세계은행 나라별 물가 수준 — 처음 고른 지표가 API에서 빠져 계산식 변경 (`apps/api/src/features/prices/worldbank.ts`)
- 받지 못한 값은 만들지 않고 "자료 없음" (FX-02, `docs/domain/fx.md`)
- 빌드 때 zod 스키마로 응답 검사 → 짐바브웨 물가 0.0003 원본 오류를 잡음 (`docs/architecture.md`, 작업 0035)
- 인증키가 없으면 그 수집만 건너뛰고 환율 수집에 번지지 않음 (`indicators/collect.ts`)

## 3. 구조
- Turborepo: web(Next.js 16 정적 → Cloudflare Pages) · api(Hono → Workers · D1 · Drizzle · Cron) · ui · shared(zod 계약) (`docs/architecture.md`)
- 흐름: Cron 수집 → 형식 검사 → D1 → 새 값이면 Pages 재빌드 훅 → 빌드 때 API에서 받아 정적 HTML (작업 0094)
- 화면은 BFF(`/bff/*`)로만 API 접근, 읽기 경로만 허용, CORS 없음 (작업 0048)
- 보조 안전망: GitHub Actions가 평일 30분마다 오늘 값 확인 (`ensure-fx.yml`)

## 4. 실제 사고와 해결
### A. 데이터베이스 하루 읽기 한도 초과 (10-29)
- 증상: 표를 읽는 모든 경로 500, 24시간 오류 7,500건, 읽은 줄 816만 (한도 500만) (`.agents/specs/0077-fx-index/plan.md`)
- 원인: 기본 키 (날짜, 통화) → 한 통화 1년 조회에 약 5,400줄, 빌드 한 번 약 15만 줄 × 하루 수십 번 빌드 (같은 파일)
- 2차 피해: 빌드 보호 장치가 환경 변수를 못 받아 "자료 없음" 홈이 배포됨 (`0078-turbo-env`)
- 조치: (통화, 날짜) 색인 → 한 통화 1년 약 245줄 (#78), 환경 변수 전달 (#80), 장애 안내 · 복구 예약 (#82), 응답 캐시 (#85)
- 결과: API 200, 사이트 5곳 "자료 없음" 0건 (`0082-outage-cleanup/plan.md`, #84)

### B. 수출입은행 간헐 연결 오류 HTTP 525 (11-02 ~, #128)
- 증상: 영업일 4일 동안 예비 출처만 저장, 통화 22 → 21개, 화면은 정상처럼 보임 (#128)
- 원인: 예비 값을 "오늘 값 있음"으로 판단해 재시도를 건너뜀 (`0121-official-retry/plan.md`)
- 조치: "공식 값이 있는가"로 재시도 판단 + 14일치 교체 (#125), 예비 값만 있으면 상태판 경고 (#151), 같은 회차 안 30초 · 90초 재시도 (#165)
- 결과: 11-09 13:30 자동 재시도로 공식 22개 교체, 11-13 두 번째 재시도로 성공 (#128 댓글)

### C. 금요일마다 예약 수집이 안 돎
- 원인: Cloudflare cron 요일 숫자 1 = 일요일 → `1-5`가 일~목 (`0138-cron-weekday/plan.md`)
- 조치: `MON-FRI`로 변경 + 숫자 요일 금지 테스트 (#144), 놓친 날 재수집 예약 (#96), Actions 예비 실행 (#109)

### D. 인증키가 실행 환경에 없음 (#180)
- 원인: 키는 저장소 Secrets에만 있고 수집은 Worker에서 돎 (`0166-worker-keys/request.md`)
- 조치: 배포 때 키를 Worker에 넣는 단계, 값은 로그에 남기지 않음 (#180)
- 결과: 머지 뒤 배포 성공 (deploy-api 16:51Z)

## 5. AI 에이전트 개발 방식
- 완료 조건 = 자동 검사 통과 (타입 · 린트 · 테스트, 큰 변경은 빌드 · e2e 추가) (`.agents/checks.sh`, CI `checks.yml`)
- 사람 승인 없이 못 바꾸는 파일 목록 → PR 라벨로만 통과 (`.agents/protected.txt`, `checks.yml`)
- 작업마다 요청 원문 그대로 보관 (135개 모두)
- 작업마다 "허점" 기록 183개, 반복된 허점은 테스트로 막음 (예: 숫자 요일 금지 0138, 환경 변수 0078)
- CI 393회 중 성공 349, 배포 125회 중 성공 117 (gh run list)
- 에이전트 팀: lead(계획 · 통합) · builder(구현) · test(테스트 먼저 작성해 실패 확인) · geo(검색 노출 측정) (`.agents/orchestration/team.md`)

## 6. 검색 · AI 답변 노출 측정 (실측만)
- 질문 24개(브랜드 8 · 일반 16)를 직접 검색해 노출 · 인용 기록 (`docs/geo-measurement.md`)
- 6회 측정 모두 노출 0 · 인용 0 (`apps/api/data/geo-answers/*.json`)
- Search Console 노출 3회 · 클릭 0회, 봇 방문 bingbot 19 · Googlebot 13 · GPTBot 1 (#157)
- 원인 조사: 사이트맵 파일 정상(29개 주소 모두 200)인데 구글 상태 "가져올 수 없음", 원인 미확정 (#157)

## 7. 테스트
- 단위 테스트 파일 69개, e2e 2개, 테스트 약 520개 (`git ls-files *.test.*`, grep)
- 도메인 규칙(FX-01~09)마다 테스트 연결 (`docs/domain/fx.md`)

## 8. 비용 · 인프라
- Cloudflare 무료 요금제(Pages · Workers · D1 · Cron), GitHub Actions (`0029-d1-id/plan.md`, README)
- 금액 기록 없음 → 글에 금액 쓰지 않음

## 9. 주소
- 사이트 https://flapfx.com (플랩 · 2026-11-17 이름 · 주소 바꿈 · 옛 tripfx.pages.dev 삭제) · 작업실 /log · GEO 측정 /geo
- API https://tripfx-api.developfff.workers.dev
