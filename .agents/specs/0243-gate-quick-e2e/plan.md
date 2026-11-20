# 계획 — 작업 0243 · 게이트: Quick PR 도 CI e2e · 작업 기록 검사 먼저 · 라벨 이벤트는 harness-approved 만 (Quick · 보호 파일)

## 무엇을 · 왜
1. **Quick PR 도 CI 에서 build + test:e2e** — 지금은 Full 일 때만. 사용자 "퀵에서도 PR 에서도 e2e 를 돌리는게 맞지".
   - CI(PR) 에서만: 바뀐 파일(origin/main 기준)이 화면에 영향 없는 것 **뿐**이면 건너뜀 — `.agents/**` · `docs/**` · `*.md` · `apps/api/data/**`. 그 밖이 하나라도 있으면 Quick 이어도 돌림.
   - 로컬 실행은 지금 그대로(Quick 은 typecheck · lint · test) — B-1 로컬 규칙 유지.
   - 판정 함수는 순수 함수로 분리(`.agents/scripts/e2e-needed.mjs` · 바뀐 파일 목록 → 참/거짓)해 harness.test.mjs 로 고정.
2. **작업 기록 검사를 맨 앞으로** — spec-check(+ 보호 파일 검사)를 프로젝트 검사보다 먼저 돌리고, 실패하면 build · e2e 같은 긴 단계는 건너뛰고 바로 FAIL (0241 에서 문서가 비어 18분을 버림).
3. **라벨 이벤트는 harness-approved 만** — `.github/workflows/checks.yml` 의 gate 잡에 조건: 이벤트가 labeled · unlabeled 이면 그 라벨이 harness-approved 일 때만 돈다 (0234 · 0238 에서 다른 라벨 세 개에 게이트가 세 번 더 돎).

## 누가
- test: harness.test.mjs 에 테스트 먼저(e2e-needed 판정 · 순서 · 조기 실패) — 0242 다음
- builder: checks.sh · e2e-needed.mjs · checks.yml 구현
- lead: PR · 본문 맨 위에 "사용자 승인 필요(harness-approved 라벨) · 보호 파일 세 곳"

## 주의
- 빌드마다 운영 D1 을 읽음 — Quick PR 도 빌드하게 되니 푸시를 묶는다(고칠 것을 모아 한 번에).
- 이 PR 자체가 Quick 이고 .agents/** · .github/** 만 바꾸므로 새 규칙으로도 e2e 를 건너뛴다(의도대로).

## 애매한 곳
- `.github/**` 를 "화면 영향 없음"에 넣을지: 작업서 목록에 없음 → 넣지 않음(워크플로가 바뀌면 e2e 로 확인하는 편이 안전 · 가정 · lead). 단, 이 PR 은 .github 를 바꾸므로 e2e 가 돎(약 13분) — 받아들임.
- push(main) 이벤트: 지금처럼 Quick 판정(e2e 없음) 유지 · 바꾸지 않음 (가정)

## 파일 계획
- .agents/checks.sh
- .agents/scripts/e2e-needed.mjs
- .agents/scripts/harness.test.mjs
- .github/workflows/checks.yml
- .agents/orchestration/TASKS.md
- .agents/specs/0243-gate-quick-e2e/**

## 계획 밖 변경 이유
-

## 완료 기준
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS (verdict.md · 사용자 라벨 뒤)

## 허점
-
