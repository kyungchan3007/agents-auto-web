# 계획

## 무엇을 · 왜
- GA4 수집 스크립트(apps/api/scripts/ga4-sync.ts)는 워크플로에서 `node --experimental-strip-types` 로 바로 돈다. 스크립트가 가져오는 apps/api/src/features/ga4/report.ts 가 `@hav/shared/date` 를 가져오고, 그 파일이 `./kst` 를 확장자 없이 가져와 node 가 찾지 못한다(작업 0318 IndexNow 와 같은 종류)
- 고침: report.ts 가 패키지 이름 가져오기 없이 돌게 한다(날짜 모양 검사를 report.ts 안에 둠 · 상대 경로는 .ts 확장자까지)
- 같은 실수를 막기: node 로 바로 도는 스크립트 세 개(ga4-sync · ig-insights · gsc-sync)가 가져오는 파일을 따라가며 패키지 이름 가져오기 · 확장자 없는 상대 경로가 없는지 보는 테스트 (apps/web/scripts/indexnow-imports.test.ts 와 같은 방식)
- 작업 종류 ③ · 패치(버그) · 어드민 · API 만 → 변경 기록 없음 · 머지 뒤 main 반영 · 워크플로 다시 돌려 확인

## 애매한 곳
- 없음

## 파일 계획
- apps/api/src/features/ga4/report.ts (builder)
- apps/api/scripts/*.test.ts 또는 apps/api/src/checks/** 의 새 테스트 (test)
- .agents/specs/0325-ga4-script-import/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] main 반영 뒤 ga4-sync 워크플로 성공 · D1 에 행 저장

## 허점
- 0324 에서 builder 가 스크립트 경로 안의 파일에 패키지 가져오기를 넣었고, test 는 단위(vitest)로만 봐서 node 로 바로 돌 때의 실패를 못 잡았다. 0318 과 같은 허점이 두 번째 → 스크립트 세 개를 보는 테스트로 막는다
