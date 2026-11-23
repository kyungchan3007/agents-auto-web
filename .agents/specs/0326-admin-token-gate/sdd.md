# SDD — 어떻게

> 요구사항: [prd.md](prd.md) · 시안 .tmp/mock-admin-gate/index.html (세 장면 · 어드민 .adm 토큰 색 · 글꼴 그대로)

## 접근
- 어드민 Worker(apps/admin/worker/index.ts · run_worker_first)가 모든 요청 앞에서 판정. 판정은 순수 함수(apps/admin/worker/gate/**), index.ts 는 결과대로 응답만
- 쿠키 `__Host-admin` · `Path=/; HttpOnly; Secure; SameSite=Lax` · 리뷰어 Max-Age 604800(7일) · owner 2592000(30일) · 값 `토큰이름.만료시각.서명`(Web Crypto HMAC-SHA256 · 열쇠 ADMIN_SESSION_SECRET) · 매 요청 서명 · 만료 · 토큰 이름이 목록에 아직 있는지(해시까지 같은지) 확인
- **토큰 목록은 원문이 아니라 해시로 (lead 결정 · 작업서와 다른 점)**: Worker 비밀값 ADMIN_TOKENS = `{"apply-acme-1124": {"hash": "<SHA-256 hex>", "exp": "2027-02-28"}, "owner": {"hash": "…"}}`. Worker 는 들어온 토큰의 SHA-256 을 길이 일정 비교. 이유: wrangler secret 은 다시 읽을 수 없어 관리 명령이 목록을 어딘가 가져야 하는데, 원문 대신 해시만 로컬(.tmp/admin-tokens.json · git 무시)에 두면 "토큰 값을 파일로 남기지 않음"을 지키면서 add · remove · list 가 됨
- 본인용 owner(사용자 "응 그렇게 넘겨"): exp 없음 · init 이 서명 열쇠 · API 키와 함께 만들고 본인 링크 출력 · 안내 창 · 접속 기록 없음 · `remove owner` 거절 · `add owner`/`init` 으로 다시 만들면 해시가 바뀌어 예전 링크 · 쿠키 무효
- 막는 화면(①) · 사용할 수 없는 링크(③)는 Worker 가 HTML 을 직접 돌려줌(정적 파일도 막혀 있으므로) · noindex
- 안내 창(②)은 어드민 앱 쪽 부품. 토큰 이름은 Worker 의 `GET /session`(쿠키 확인 뒤 {name}) 로 받음 · owner 면 띄우지 않음 · 닫으면 localStorage 로 다시 안 보임
- 접속 기록: 어드민 Worker 가 토큰을 받아 쿠키를 심을 때와 페이지(HTML) 요청 때 API 서비스 바인딩으로 `POST /admin-visits {name}`(어드민 키 머리글 · owner 는 보내지 않음) → API 가 D1 admin_visits(name, first_at, last_at) upsert. 어드민 "만드는 방식" 탭 아래 작은 표(GET /admin-visits)
- API 어드민용 경로 막기: API 가 어드민 전용 경로(/activity GET · /tasks · /geo · /ga4 · /ig · /status · /admin-visits — 운영 BFF 가 쓰지 않는 것)에 `x-admin-key` 머리글 == ADMIN_API_KEY 일 때만 답함. 어드민 BFF(@hav/edge)가 이 머리글을 붙임. ADMIN_API_KEY 가 없으면 막음(닫힌 쪽). 운영 사이트 경로(/fx · /signal · /prices · /indicators · /airfare 등)는 그대로
  - 운영 사이트 빌드 · 다른 워크플로 · 에이전트 훅이 위 경로(특히 POST /activity · GET /tasks)를 부르는지 builder 가 확인(부르면 lead 에게)
- 관리 명령 scripts/admin-token.mjs + package.json "admin:token": add <이름> [--exp] · remove <이름> · list · init — 무작위 토큰(32바이트) 생성 → 해시를 로컬 목록에 → `wrangler secret put ADMIN_TOKENS --config apps/admin/wrangler.jsonc` 로 올림 → 새 링크를 한 번만 출력. init 은 ADMIN_SESSION_SECRET · ADMIN_API_KEY(두 Worker) · owner 를 만들어 올림(열쇠 값은 출력하지 않음 · owner 링크만 출력)

- 이미 등록된 비밀값(11-23 사용자 · 이름만 확인): flapfx-admin = ADMIN_SESSION_SECRET · ADMIN_API_KEY / tripfx-api = ADMIN_API_KEY(같은 값). init 은 `wrangler secret list` 로 이름만 보고 **없는 것만** 만든다(있는 값은 덮어쓰지 않음). ADMIN_TOKENS 는 아직 없음 → init/add 가 처음 만듦
- tripfx-api 에 예전부터 있는 ADMIN_TOKEN(단수)은 다른 용도(관리 쓰기 경로) — 이름 · 코드에서 섞지 않음 · 건드리지 않음

## 대안 · 트레이드오프
- Cloudflare Access: 리뷰어가 이메일 로그인을 해야 함 · "아무것도 입력하지 않음" 요구와 어긋남
- 토큰 원문을 비밀값에: 관리 명령이 목록을 다시 읽을 수 없어 add/remove 때 다른 토큰을 잃음

## 파일 계획
- 보호 파일 — 사용자 승인("승인, 진행해")
  - apps/api/src/db/schema.ts (admin_visits 표 하나) · apps/api/drizzle/migrations/0014_* · meta (builder)
- apps/admin/worker/index.ts · apps/admin/worker/gate/** (판정 · 쿠키 서명 · 화면 HTML) (builder)
- packages/edge/src/** (어드민 BFF 가 x-admin-key 를 붙이는 선택) (builder)
- apps/api/src/index.ts · apps/api/src/features/admin/**(키 확인 미들웨어 · admin-visits 저장 · 읽기) (builder)
- packages/shared/src/contracts/** · client/api.ts (admin-visits 계약) (builder)
- apps/admin/src/**(안내 창 · 만드는 방식 탭 접속 기록 표 · 로그아웃 링크) (builder)
- scripts/admin-token.mjs · package.json scripts 한 줄 (builder)
- docs/architecture.md 어드민 입구 절 (builder)
- 위 옆 *.test.ts · apps/admin/e2e/** · .agents/e2e-map.json (test)
- wrangler 설정 · 워크플로 · 운영 사이트는 바꾸지 않음

## 계획 밖 변경 이유
- scripts/admin-token.mjs · scripts/admin-token-lib.ts · package.json(scripts 한 줄) · docs/architecture.md — team.md builder 범위 목록 밖이지만 관리 명령 · 구조 문서라 lead 가 builder 에게 맡김

## 위험
- 비밀값 없이 main 에 나가면 사용자도 잠김 → main 은 등록 확인 뒤 · 등록 순서를 PR 본문 · 회신에
- 어드민 e2e 가 Worker 를 거치면 막힘 → test 가 쿠키를 만들어 넣는 도움 함수(테스트 전용 열쇠) 사용 · 운영 코드에 우회 경로를 두지 않음

## 검증 계획
- 단위: 토큰 해시 비교 · 쿠키 서명 · 만료 · 목록에서 지운 이름 · owner(30일 · 기록 없음 · remove 거절) · 판정(링크 → 303 · 쿠키 없음 → ① · 무효 → ③ · /bff → 401 · /logout) · API 키 미들웨어(없음 · 틀림 · 맞음 · 운영 경로는 영향 없음) · 접속 기록 upsert
- e2e: 막는 화면 · 링크로 들어와 안내 창 한 번 · 접속 기록 표
- 실제: main 반영 뒤 사용자 링크로 확인

## 계획과 달라진 점
- (끝나고 채움)
