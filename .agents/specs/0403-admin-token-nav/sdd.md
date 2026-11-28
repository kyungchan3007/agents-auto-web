# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 경계(서버): apps/admin/worker 에서 입구 판정(runGate) 뒤 세션 이름이 OWNER_NAME 이 아니면
  - 막힌 화면 경로(/log · /marketing · /traffic · /instagram 와 그 하위 · .html · .txt(RSC) · index 변형) → 302 /geo
  - 막힌 BFF(/bff/activity · /bff/tasks · /bff/ga4 · /bff/ig) → 403 (기존 /bff/admin-visits 404 는 그대로)
  - / → 302 /geo (owner 는 기존 host 규칙대로 / → /log)
  - ?t= 로 쿠키를 심을 때 이동 주소: 회사 세션이고 막힌 경로 또는 / 이면 /geo
  - 막을 경로 목록은 한 곳(worker 의 owner 전용 경로 표)에 두고 단위 테스트.
- 화면(클라이언트): ADMIN_NAV 를 세션에 따라 거름. useIsOwner(받기 전 false)로 회사 기본 = GEO · 만드는 방식 두 개, owner 확인 뒤 여섯 개. 사이드 · 휴대폰 메뉴 · 찾기 목록 · 숫자 단축키 · 로고 링크가 같은 거른 목록을 씀(공통 훅 · 2곳 이상이므로 shared).
  - owner 판정이 늦게 와 메뉴 항목이 더해질 때 메뉴 칸 높이 · 위치가 흔들리지 않게(사이드는 위에서부터 쌓여 아래만 늘고, 휴대폰 위 메뉴는 가로 줄 높이 고정).
- 안내 창 삭제: gate-welcome.tsx · use-gate-welcome.ts · admin-shell 의 <GateWelcome /> · gate.css 안내 창 스타일 · 안 쓰게 된 함수(shouldWelcome · hello 등)와 그 테스트.

## 대안 · 트레이드오프
- 화면에서만 숨기기: 주소를 직접 치면 열려서 제외. 서버에서 막고 화면도 거름.
- 받기 전 여섯 개 → 줄이기: 보였다 사라짐 · 회사에 이름이 잠깐 드러남 → 두 개에서 더하는 방향.

## 파일 계획
- builder:
  - apps/admin/worker/index.ts · apps/admin/worker/gate/** · apps/admin/worker/host.ts · apps/admin/worker/*.test.ts(기존 테스트가 깨지는 곳만 맞춤은 test)
  - apps/admin/src/shared/gate/** (안내 창 삭제 · session 판정)
  - apps/admin/src/shared/ui/shell/** (admin-shell · palette · palette-items · use-palette · use-shell-keys · 메뉴)
  - apps/admin/src/shared/nav/** (세션별 메뉴 목록)
- test: apps/admin/worker/**/*.test.ts · apps/admin/src/**/*.test.ts · apps/admin/e2e/** (안내 창 e2e 삭제 · 회사/owner 세션 e2e)
- .agents/specs/0403-admin-token-nav/** · .agents/orchestration/TASKS.md
- 보호 파일(wrangler.jsonc 등)은 바꾸지 않음.

## 계획 밖 변경 이유

## 위험
- 막힌 경로 변형(/log/ · /log.html · /log.txt · /log/index.txt · ?_rsc)을 빠뜨리면 회사가 주소로 열 수 있음 → 단위 테스트로 변형 목록 검사.
- owner 판정 실패(네트워크) 시 owner 도 두 개만 보임 → 서버는 owner 에게 다 열려 있으니 주소로는 열림 · 새로고침으로 회복(허용).
- 기존 e2e(admin-gate 안내 창 · admin 메뉴 여섯 개)가 회사 세션 기준이면 깨짐 → test 가 세션별로 나눔.

## 검증 계획
- worker 단위: 회사 세션 막힌 경로 · 변형 → 302 /geo · 막힌 bff → 403 · /geo · /how · 그 bff → 통과 · / → /geo · ?t= 이동 주소 · owner 는 전부 통과 · / → /log · 접속 기록 그대로.
- e2e: 회사 세션 안내 창 없음 · 메뉴 두 개(사이드 · 휴대폰 · 찾기 · 단축키) · 로고 /geo · owner 여섯 개 · 메뉴 그리는 동안 높이 · 위치 변화 없음.
- gate 통과 → develop 머지.

## 계획과 달라진 점
