# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 규칙 먼저: docs/domain/import-calc.md 에 제68조 1 · 3호(2호 삭제) 원문 · 출처 주소 · 확인한 날. rules.ts 에 같은 형식 주석.
- 계산(순수 함수 · 기존 import-calc lib): 물건 값 목록 → 합계 · 한도 판단(지금 계산기의 "한도 넘음" 계산을 합계에 그대로) · "하나씩은 한도 안 · 합치면 넘음" 여부 · 막대 아래 문장.
- 화면: 물건 값 칸 아래 "같은 판매자에게 같은 날 산 물건" 목록 · "+ 물건 더하기"(최대 5) · 지우기 · 안내 문장. 상태는 커스텀 훅, tsx 는 그리기만.
- 미국 200달러 · 일반 150달러 등 지금 한도 규칙은 그대로 씀(합계에 적용).

## 대안 · 트레이드오프
- 판매자 · 날짜를 물건마다 입력받아 자동으로 묶기: 입력이 늘어 이탈을 키움. 칸 이름으로 조건을 알려 주고 사용자가 해당하는 물건만 넣게 함.

## 파일 계획
- docs/domain/import-calc.md
- apps/web/src/features/import-calc/**
- packages/shared/src/domain/** (직구 규칙이 여기 있으면)
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0350-import-combined/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 한도 판단 문장이 틀리면 잘못된 세금 안내가 됨 → 출처 문구 그대로 · 단위 테스트로 경계값($150 · $200 · 합계 경계).

## 검증 계획
- 단위: 합계 · 경계값 · 하나씩 안 · 합치면 넘음 · 물건 수 제한.
- e2e: 물건 더하기 · 합계 문장 · 안내 문장.
- CI gate.

## 계획과 달라진 점
