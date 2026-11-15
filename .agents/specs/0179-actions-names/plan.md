# 계획

## 무엇을 · 왜
- GitHub Actions 화면에 워크플로 10개가 이름만 영어 약어로 섞여 보여, 작업실의 "자동 검사 (main)" 카드를 누르면 검사와 무관한 기록까지 보임.
- 1. 카드 링크를 `actions/workflows/checks.yml?query=branch:main` 으로.
- 2. 워크플로 `name:` 을 "분류 · 하는 일" 한국어로 (Actions 왼쪽 목록이 분류별로 모여 보이게). `workflow_run` 이 이름으로 잇는 곳(deploy-api ← 검사, sync-tasks ← 배포)도 함께. job 이름(gate 등 · 필수 검사)은 그대로.
- 3. README 세부 내용에 "자동으로 도는 일" 접기 블록 하나 (기존 양식 유지 · 표 없이 불릿).

## 애매한 곳
- `.github/workflows/**` 는 보호 파일 — 사용자가 "세 가지 다 해" 로 승인 (확인됨). 게이트는 ALLOW_PROTECTED=1 로 돌림.

## 파일 계획
- .agents/specs/0179-actions-names/**
- .github/workflows/*.yml
- apps/web/src/features/log/components/status-board.tsx
- apps/web/src/shared/actions-names.test.ts
- README.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] 테스트 먼저 (구현 전 FAIL): 모든 워크플로 이름에 한글 · workflow_run 이 가리키는 이름이 실제로 있음 · 카드 링크 · README 블록
- [ ] bash .agents/checks.sh PASS
- [ ] 머지 뒤 deploy-api · sync-tasks 가 새 이름으로 이어서 도는지 확인

## 허점
- workflow_run 은 이름 문자열로 이어져서, 이름만 바꾸면 배포가 조용히 끊김. 테스트로 막는다.
