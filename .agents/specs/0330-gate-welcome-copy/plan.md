# 작업 0330 — 문구 수정 (Quick)

## 할 일
- 어드민 첫 진입 안내 창 첫 줄을 바꾼다: "<b>열람 권한이 부여된 분께만 제공되는 전용 링크입니다.</b> 유효 기간은 발급일로부터 7일입니다." (예전: "지원한 회사마다 따로 발급한 토큰입니다. 전형이 끝나면 지웁니다.") · 나머지 세 줄 · 머리 · 단추는 그대로.
- 문구가 사실이 되도록 `admin:token add` 에서 `--exp` 를 주지 않으면 발급일(한국 날짜) + 7일을 기한으로 넣는다. owner 는 기한 없음 · `--exp` 를 주면 그 날짜.
- 이미 만든 링크의 기한은 바꾸지 않는다(로컬 목록 그대로).

## 파일 계획
- apps/admin/src/shared/gate/gate-welcome.tsx — 첫 줄 문구
- apps/admin/e2e/admin-gate.spec.ts — 새 문구 확인 · 예전 문구 없음 확인
- scripts/admin-token-lib.ts — DEFAULT_EXP_DAYS · expFor
- scripts/admin-token.mjs — add 가 expFor 사용 · 머리 설명
- apps/admin/worker/gate/admin-token-lib.test.ts — expFor 단위
- docs/architecture.md — add 기본 기한 한 줄
- .agents/orchestration/TASKS.md — 0329 머지 상태 · 0330 줄

## 범위
- 보호 파일 없음 · 운영 사이트 변화 없음(.changeset 없음) · 어드민 전용이라 머지 뒤 바로 main
