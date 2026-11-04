# 계획

## 무엇을 · 왜
- 작업실 사이트 상태 밑에 "패치 내역" 칸 — 무엇을 언제 고쳤는지 · PR 링크
- 원본은 머지된 PR 제목 "작업 NNNN: 패치(보안|버그) — 요약" · 표 · API 변경 없음 (D1 읽기 안 늘어남 · 이미 받는 /tasks 재사용)
- 매일 오전 7시 점검은 이 기기의 예약 작업 (저장소 밖 설정)

## 애매한 곳
- 예약을 이 기기에 둠: gh · 게이트가 이미 동작 · 앱이 꺼져 있으면 다음 실행 때 돎 (가정)
- 고칠 것이 없는 날은 기록 없음 (가정)

## 파일 계획
- packages/shared/src/tasks.ts · tasks.test.ts
- apps/web/src/features/log/patch-log.tsx · log-body.tsx
- docs/domain/build-log.md
- .agents/specs/0113-patch-log/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 빈 상태 · 내역 있는 상태를 화면으로 확인

## 허점
-
