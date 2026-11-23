# 계획

## 무엇을 · 왜
- IndexNow 보내기 스크립트(apps/web/scripts/indexnow.ts)가 작업 0312 뒤 실패한다. apps/web/src/shared/site.ts 가 @hav/shared 를 다시 내보내게 바뀌었는데, indexnow.yml 은 npm ci 없이 스크립트를 바로 돌려 패키지를 못 찾는다.
- 고침: 스크립트가 가져올 것이 없는 원본 packages/shared/src/site/site.ts 에서 SITE_URL 을 직접 가져온다 (보호 파일인 워크플로는 바꾸지 않음)
- 작업 종류 ③(동작 — 설치 없이 스크립트가 돌아야 함): 요구 1 을 확인하는 검사를 test 가 정한다
- 운영 화면 변화 없음 · 변경 기록 없음

## 요구
1. node_modules 가 없는 저장소에서 `node --experimental-strip-types apps/web/scripts/indexnow.ts` 가 모듈 오류 없이 시작한다 (가져오는 파일들이 패키지 이름 없이 상대 경로로만 이어짐)
2. 보내는 주소 · 키 · host 는 그대로 (https://flapfx.com)

## 애매한 곳
- 워크플로가 `| tee` 때문에 실패해도 success 로 끝나는 문제는 보호 파일(.github/workflows/indexnow.yml)이라 이번에 바꾸지 않고 claude-desktop 에 알린다

## 파일 계획
- apps/web/scripts/indexnow.ts (builder)
- apps/web/scripts/indexnow-lib.test.ts 또는 새 검사 파일 (test)
- .agents/specs/0318-indexnow-import/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/scripts/** 는 team.md 의 builder 범위(apps/web/src/**) 밖이지만 운영 앱 스크립트라 builder 가 고친다

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] main 반영 뒤 IndexNow 전체 주소 한 번 · 로그에 "HTTP 200"

## 허점
- 0312 에서 site.ts 를 다시 내보내기로 바꿀 때 npm ci 없이 도는 스크립트를 놓쳤다 · 워크플로가 tee 로 종료 코드를 가려 매일 실패해도 success 로 보였다
