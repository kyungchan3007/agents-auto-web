# 계획

## 무엇을 · 왜
- 작업실 끝의 블록 탑 · 숫자 칸을 빼고 "오늘 발견된 버그 · 보안" 숫자로 바꿈
- 머지된 PR 제목 "패치(버그|보안) — 요약" 중 한국 날짜 오늘 것을 셈 · 이미 받는 /tasks 재사용 (D1 읽기 안 늘어남)

## 애매한 곳
- "발견" 은 찾아서 고쳐 머지한 것 기준 · 못 고친 것은 공개 기록이 없어 못 셈 · 화면에 기준을 적음 (가정)
- 블록 탑 3D 컴포넌트와 막힘 기록(task_snags)은 지우지 않음 · 쓰는 곳만 뺌 (가정)

## 파일 계획
- packages/shared/src/tasks.ts · tasks.test.ts
- apps/web/src/features/log/log-body.tsx
- apps/web/src/shared/three-lazy.tsx
- docs/design.md · docs/domain/build-log.md
- .agents/specs/0122-today-patch-stats/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 로컬 빌드에서 칸 확인

## 허점
-
