# 계획

## 무엇을 · 왜
- 값을 받지 못한 날 화면이 "자료 없음" 글자만 남는 막다른 상태를 없앤다(시안 3-new).
- 빈 상태 공통 부품 하나: 흰 카드 · "자료 없음 · YYYY-MM-DD HH:MM 확인" · 제목(무엇을 왜 멈췄는지) · 이유와 다시 받는 시각 한 줄 · "그동안 볼 수 있는 것" 링크 칩.
  - 다시 받는 시각은 실제 일정: 평일 한국 시간 12시 이후 수출입은행 값을 받고, 받지 못하면 12:10 ~ 17:40 30분마다 다시 시도(ensure-fx.yml), 받은 뒤 사이트를 다시 만듦. 주말 · 공휴일은 직전 영업일 값.
- 적용: /calc 환율 없는 날(입력 카드 자리 · 파랑 면 위 안 보이던 글자 고침), 여행 물가(환율 없는 나라), 통화 상세(값 못 받은 날).
- 링크: /calc → 관세청 과세환율(같은 페이지 아래) · 통화별 1년 흐름 · 여행 물가. 여행 물가 · 통화 상세는 각자 이어 볼 곳(통화 둘러보기 · 여행 물가 · 직구 계산).

## 애매한 곳
- "확인" 시각은 빌드 시각(builtAt) (가정 · 지어내지 않음).
- 여행 물가 빈 상태 자리: 환율을 받지 못한 빌드에서 /prices 와 /prices/[code] 의 예산 카드 결과 칸(하루 · N일 금액)을 공통 빈 카드로. 통화가 원래 없는 나라(마카오 등)는 지금 모습 그대로(환율 '실패'가 아님). /prices/[code] 환전 카드의 한 줄 '자료 없음'은 그대로 (확인됨: lead 11-25).
- 작업 종류 ③: 문구 · 동작 · 링크가 새로 생김 → 요구마다 기능 테스트(빈 상태 고정 자료).

## 파일 계획
- packages/ui/src/** 또는 apps/web/src/shared/ui/** (빈 상태 공통 부품 하나)
- apps/web/src/features/import-calc/** · apps/web/src/features/prices/** · apps/web/src/features/currencies/**
- packages/shared/src/domain/** (수집 일정 문장)
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0346-empty-states/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 세 화면의 빈 상태가 같은 부품 · 이유 · 다시 받는 시각 · 링크

## 허점
-
