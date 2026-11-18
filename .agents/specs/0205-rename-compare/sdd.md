# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **계약** `packages/shared/src/contracts/geo.ts`: `RENAME_DAY = "2026-11-17"` · `GeoReport` 에 선택 필드 `daily?: { day; kind; name; hits }[]`(봇 · 유입 · test 제외) 와 `answerDays?: { day; edition; engine; question; group; found; cited; status }[]` 를 더함(선택 필드라 옛 응답도 통과).
- **API** `apps/api/src/features/geo/summary.ts`: 이미 읽는 geo_hits 행(날짜별)으로 `daily` 를 만듦 — 새 쿼리를 늘리지 않음(D1 읽기 한도). 답변은 `answersSummary` 가 받는 모든 날짜 행에서 `answerDays` 를 만듦(판 번호는 questions.ts 의 질문 판 정보로).
- **비교 계산** 순수 함수 `apps/web/src/features/geo/lib/rename-compare.ts`: `renameCompare(report, today)` → { bots: [{ name, before: { days, total, perDay }, after: {...}, daily: [...] }], referrals, answers: { general: [{ question, before: {measured, found, cited}, after }], brand: { tripfx, flapfx } }, search: { old, new: null } } · 자료가 없으면 null → 화면 "아직 없음".
- **화면** `apps/web/src/features/geo/components/rename-compare.tsx`(새) · geo-page 맨 위에 넣음. 막대는 기존 차트 부품(@hav/ui)이 있으면 쓰고 없으면 단순 SVG(새 의존성 없음).
- **빌드 시점**: /geo 는 빌드 때 API 를 읽는 정적 페이지 — 새 필드가 없으면(미리보기 · API 배포 전) 비교 구간은 "아직 없음".

## 대안 · 트레이드오프
- 기간 합계만 API 에서 계산해 보내기 → 기준일을 바꾸거나 날짜별 막대를 그릴 수 없어 날짜별 행을 보냄(행 수 적음: 날짜 × 봇 약 수십~수백 줄).
- 새 D1 쿼리 → 읽기 한도 위험이라 기존 쿼리 결과 재사용.

## 파일 계획
- packages/shared/src/contracts/geo.ts
- packages/shared/src/contracts/*.test.ts
- apps/api/src/features/geo/**
- apps/web/src/features/geo/**
- apps/web/e2e/**
- docs/geo-measurement.md
- .agents/specs/0205-rename-compare/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/src/app/geo/page.tsx — 빌드 때 한국 날짜(자료 기준일 asOf)를 화면에 넘김 (후 기간 끝 날짜 · lead 리뷰 반영)
- apps/web/src/shared/old-name.test.ts — 새 파일 4개(비교 화면 · 계산 · 계산 테스트 · geo 계약)가 "Tripfx → Flapfx" · Tripfx 시기를 이름 그대로 적어 옛 이름 검사에 걸림 · 파일마다 이유와 함께 예외 목록에 더함

## 위험
- 응답 크기 증가 → 날짜별 행만 · 경로(path)는 빼서 줄임.
- 하루 평균 분모 착오 → 단위 테스트로 고정 · 화면에 날짜 수 표시.
- 빌드 반복 금지(D1) — Full 빌드 한 번 · 결과는 파일로.

- API 가 지난 30일만 읽어 12-05 쯤부터 첫 기록일이 밀리고 12-17 쯤 전 기간이 사라짐 → 이번 작업은 새 D1 쿼리 없이 위처럼 표시만. 후속 과제: 비교용 고정 시작일(2026-11-05)부터 읽도록 API 창 · 보관을 늘림(읽기 한도와 같이 검토).

## 검증 계획
- 단위: prd 완료 기준
- API 단위: daily · answerDays 모양 · test 방문 제외 · 기존 필드 그대로
- e2e · 미리보기

## 계획과 달라진 점
- 훅 파일 `apps/web/src/features/geo/hooks/use-rename-compare.ts` 를 더함 — 화면(.tsx)은 훅을 직접 못 쓰는 구조 검사 때문. "오늘" 은 useSyncExternalStore 로 브라우저 한국 날짜 · 서버 화면은 빈 값이라 날짜가 달라도 어긋나지 않음.
- `answerDays` 의 `question` 은 질문 글자(번호 아님) — 화면이 글자가 필요하고 번호와 글자는 1:1 이라 글자끼리 이어 비교.
- 판 번호는 questions.ts 의 `editionOfQuestion` (질문을 처음 쓴 판).
- 일반 질문 비교는 "가장 최근 측정일에 있던 질문"(지금 묻는 16개)만 보임 — 지난 판에서만 쓴 질문은 뺌.
- (리뷰 반영) 후 기간 끝 = 자료 기준일 asOf(빌드 때 한국 날짜 · app/geo/page.tsx 가 넘김). 브라우저 날짜는 쓰지 않음 — 정적 화면을 빌드 이틀 뒤에 열어도 자료 없는 날이 분모에 안 들어감. asOf 보다 뒤 날짜는 분모 · 합계 모두 제외. 화면에 "자료 기준일" 표시.
- (리뷰 반영) 전 기간 = 응답에 남은 첫 기록일 ~ 11-16 을 날짜로 적고, 7일보다 짧으면 "전 기간이 짧아 비교는 참고용" 을 띄움.
- 막대는 단순 SVG (새 의존성 없음) · 휴대폰에서 날짜별 막대가 표 밖으로 밀려 봇 이름 아래로 옮김.
