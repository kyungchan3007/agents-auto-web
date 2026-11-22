# 계획 — 작업 0291 · 직구 큰 숫자를 합계로 · 흰 점 지움 (Quick · 평소 PR · 시안 58)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
1. 결과 카드 머리 큰 숫자를 물건 값(r.priceKrw) → "모두 합쳐 예상"(r.tax.total). 면세 한도 안이면 두 값이 같아 지금과 같게.
2. 합계를 계산할 수 없는 상태(한도 초과 · 관세율 없음 등): **사용자 결정 전까지 지금 동작(물건 값) 그대로** 두고 안만 적음(overnight.md · 작업서 2번). 받지 못한 숫자는 지어내지 않음.
3. 카드 오른쪽 위 흰 점(calc-tag-top 안 absolute top-4 right-4 size-3 rounded-full) 삭제.
4. 그대로: 기울인 도장 · 한도 막대 · 내역 줄 · 숫자 굴러가기 · "값이 바뀌어도 아래 칸이 밀리지 않는다"(0208). 휴대폰 긴 금액 글자 줄이기는 합계 기준으로.
5. 같은 숫자를 다른 곳(휴대폰 요약 띠 등)에서 큰 숫자로 쓰면 어느 값을 쓰는지 PR 에 적음.

## 2번 안 (claude-desktop 이 사용자에게 여쭐 것)
- 안 A: 지금처럼 물건 값을 큰 숫자로(라벨은 "물건 값"으로 바꿔 합계와 헷갈리지 않게)
- 안 B: 큰 숫자 자리를 비우고 "관세율을 넣으면 합계가 나옵니다" 한 줄
- 이번 PR 은 지금 동작 그대로(물건 값 · 라벨은 지금 것) — 결정이 오면 고침.

## 누가
- builder — 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고(5번 확인 포함)
- test — 로컬은 단위 · typecheck · lint + e2e-select 목록(team.md 49 ~ 51) · 합계 기준 · 계산 불가 상태 지금 그대로 · 밀림 없음 기능 확인
- lead — PR · gate · 머지

## 파일 계획
- apps/web/src/features/import-calc/**
- apps/web/e2e/** · **/*.test.ts(x) (test)
- .agents/specs/0291-calc-big-total/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 큰 숫자 = 합계(계산 가능할 때) · 계산 불가 상태 지금 그대로 · 흰 점 없음 · 밀림 없음

## 허점
-
