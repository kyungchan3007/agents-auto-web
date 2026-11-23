# 작업 0330 — 문구 수정 (Quick)

## 할 일
- 어드민 첫 진입 안내 창에서 "지원한 회사마다 따로 발급한 토큰입니다. 전형이 끝나면 지웁니다." 줄을 뺀다. 나머지 세 줄 · 머리 · 단추는 그대로.

## 파일 계획
- apps/admin/src/shared/gate/gate-welcome.tsx — 첫 번째 li 삭제
- apps/admin/e2e/admin-gate.spec.ts — 지운 문구 확인을 "없음" 확인으로 바꿈
- .agents/orchestration/TASKS.md — 0329 머지 상태 · 0330 줄

## 범위
- 보호 파일 없음 · 운영 사이트 변화 없음(.changeset 없음) · 어드민 전용이라 머지 뒤 바로 main
