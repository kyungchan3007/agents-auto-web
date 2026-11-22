# 계획 — 작업 0310 · 알리기 탭 그림을 R2 공개 주소에서 (Quick · 평소 PR · 어드민)

## 무엇을 · 왜
- 어드민 알리기 탭(/marketing · apps/web/src/app/marketing/page.tsx · features/marketing)의 그림을 R2 공개 주소 `https://pub-65c388a50b5648f6bc15b6d076f8c3bc.r2.dev/{YYYY-MM-DD}.jpg` 에서 읽음. 그날 R2 파일이 없으면(이전 묶음) 지금처럼 main raw 주소(`docs/marketing/{day}/image.png`)로 되돌림. 운영 반영 PR 이 늦어도 탭에 그림이 바로 보이게.

## 애매한 곳
- 되돌리는 방법은 builder: 빌드는 정적이라 (가) 브라우저에서 R2 그림이 안 열리면 raw 로 바꾸기 · (나) 빌드 때 R2 에 있는지 묻기 — 빌드가 바깥 주소에 기대지 않는 (가)를 권함. (lead)
- R2 공개 주소 · 버킷 이름은 비밀값이 아님(공개 주소) — shared/site 같은 상수 한 곳에. (가정)
- 작업 종류 ③(동작 — 그림 주소 고르기 · 되돌림) → 기능 확인을 단위 테스트로(주소 고르기 함수). e2e 는 새로 쓰지 않음(어드민 · 바깥 주소). (#354 규칙)
- 어드민 쪽이라 develop 머지 뒤 바로 develop → main fast-forward(사용자). 함께 나가는 목록을 회신에.

## 누가
- builder — 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 주소 고르기 단위 테스트 · 단위 · typecheck · lint · 깨진 기존 테스트
- lead — PR · gate · develop 머지 · main fast-forward

## 파일 계획
- apps/web/src/app/marketing/page.tsx · apps/web/src/features/marketing/** · apps/web/src/shared/site.ts
- apps/web/src/**/*.test.ts(x) (test)
- .agents/specs/0310-marketing-r2/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 알리기 탭 그림이 R2 주소 · 없으면 raw 주소

## 허점
-
