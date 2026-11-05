# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 라우트 | status · signal · tasks 쿼리를 store.ts 로 · 집계를 순수 함수로 | fx · prices · activity 와 같은 구조 |
| 2 | 오류 · 로그 | log.ts · app.onError · 예약 실행 결과 기록 | 비밀값 가림을 테스트로 고정 |
| 3 | 타입 | wrangler types · Env 는 생성 타입에서 Pick | 바인딩 이름이 바뀌면 컴파일 실패 · 비밀값은 설정에 없어 옵션으로 적음 |
| 4 | 설정 | upload_source_maps | 보호 파일 · 라벨 |
| 5 | 린트 | packages/config/eslint.mjs · api · ui · shared | no-floating-promises 위반 0건 · scripts 는 node 가 바로 실행하는 .ts 경로라 tsc · eslint 에서 제외 |

## 허점
- 이슈 #128 조사 때 예약 실행 로그가 없어 실패 시각의 원인을 볼 수 없었음
