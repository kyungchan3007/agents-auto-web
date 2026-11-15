# 계획

## 무엇을 · 왜
- 월간 지표(KOSIS 국제항공료 · 해외단체여행비, ECOS 수입물가)가 **비어 있거나 발표된 달보다 오래됐으면 평일 12:00 회차에서 채운다.**
- 지금은 매달 1일 회차에서만 받아서, 키를 넣은 직후(11월 중순)부터 12월 1일까지 비어 있다. 새 디자인의 홈 맨 위(여행 타이밍)가 이 자료를 쓰므로 그동안 "준비 중"만 보인다.
- 덤으로 1일 회차만 쓸 때의 반영 지연(KOSIS 최대 약 한 달 · ECOS 2주~한 달 반)도 줄어든다.

## 설계
- 순수 함수 `monthlyDue(latest: "YYYY-MM" | null, today: "YYYY-MM-DD", publishDay: number): boolean`
  - 기대하는 최신 달 = today 의 일이 publishDay 이상이면 지난달, 아니면 지지난달
  - latest 가 null 이거나 기대 달보다 앞이면 true
- 발표일 기준: KOSIS 5일 (11-03 에 10월 자료 확인 · 여유 두 날) · ECOS 17일 (다음 달 15일경 발표 · 여유 두 날) — 0164 · 0165 plan 의 공식 명세 근거
- `apps/api/src/index.ts` 평일 첫 회차(fxDaily · 과세환율 뒤)에서 각 자료마다: 최신 1행만 읽어(`recentPoints(…, 1)`) `monthlyDue` 면 `collectKosis` / `collectEcos`. 서로 · 환율 · 과세환율과 따로 catch. 키가 없으면 수집 함수가 알아서 건너뜀.
- 매달 1일 회차는 그대로 둔다 (wrangler 변경 없음).
- D1 읽기: 평일 하루 자료당 1행 (KOSIS 는 air-fare 하나로 판단).

## 애매한 곳 (사용자가 자는 중 아님 · 디자인 작업 진행 중이라 lead 가 판단)
- 별도 작업 · PR 로 낸다 (가정 · 디자인과 무관한 API 변경이라 승인 · 되돌리기가 쉽게)
- KOSIS 판단은 국제항공료 시리즈 하나로 (가정 · 두 품목을 한 번에 받음)

## 담당
- test: 완료 기준마다 테스트 먼저 (monthlyDue 경계 · 평일 회차에서 due 일 때만 수집 · 실패 분리)
- builder: 구현

## 파일 계획
- .agents/specs/0171-indicator-backfill/**
- .agents/orchestration/TASKS.md
- apps/api/src/index.ts
- apps/api/src/features/indicators/**
- apps/api/src/scheduled-backfill.test.ts
- docs/domain/travel-price.md
- docs/domain/import-calc.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] monthlyDue: 비어 있으면 true · 기대 달 이상이면 false · 발표일 전후 경계
- [ ] 평일 첫 회차에서 due 인 자료만 수집하고, due 가 아니면 호출하지 않는다
- [ ] retry 회차(13:30 · 15:00)에서는 하지 않는다
- [ ] KOSIS · ECOS · 환율 · 과세환율 중 하나가 실패해도 나머지는 그대로
- [ ] bash .agents/checks.sh PASS

## 허점
-
