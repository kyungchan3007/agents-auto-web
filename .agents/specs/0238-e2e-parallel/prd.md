# PRD — 작업 0238 · CI e2e 병렬 (Full · 게이트 시간 측정이 목적)

> 원문(request.md)이 판정 기준. 이 문서는 A 절과 가리키는 작업서(.tmp/task-e2e-parallel-1120.md)를 옮긴 것.

## 문제
- Full 게이트가 16 ~ 22분 걸린다. 대부분 e2e(spec 43개 × 넓은 화면 · 휴대폰). playwright 설정에 `workers` · `fullyParallel` 이 없어 CI(4코어) 기본 workers 2 · 파일 단위로만 나뉜다.

## 목표
- 같은 e2e 를 더 빨리 — 게이트 6 ~ 8분 근처. 테스트 내용은 바꾸지 않는다.
- 전후 시간을 재서 PR 본문에 적는다.

## 비목표
- `.github/workflows/checks.yml`(보호) · shard · 고정 자료 빌드 — 제안만 · 다음 작업
- retries 늘리기 금지(불안정을 숨기지 않음)

## 애매한 곳
- workers 값 · fullyParallel 켤지: 둘 다 재 보고 정함 (원문). 후보 1) CI workers 4 2) + fullyParallel true
- 기준 시간: 직전 Full 게이트의 CI gate 실행 시간(예: #282 · 0231 약 22분)을 test 가 GitHub Actions 기록에서 읽음 (가정)

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Full · verdict.md 규칙)
- [ ] PR 최신 커밋 CI gate SUCCESS
- [ ] PR 본문에 전후 시간 · 불안정 spec(있으면 이름 · 증상) · 10분 넘으면 shard 제안
