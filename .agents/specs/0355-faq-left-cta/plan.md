# 계획

## 무엇을 · 왜
- 시안 10-A · 10-B: 자주 묻는 질문 구간이 가운데라 어색하다는 지적 → 왼쪽 칸에 맞춤(읽기 폭 44rem 그대로). /prices/[code] 와 /currencies/[code] 가 같은 FaqList(packages/ui) 를 쓰면 한 곳만 고침.
- /prices/[code] 아래 "여행 물가 전체 보기" 작은 링크가 눈에 안 띈다는 지적 → 테두리 버튼 "다른 나라 물가도 보기 · N개 나라 ›"(N 은 실제 나라 페이지 목록 개수). 위치 그대로.
- 테두리 버튼은 공통 부품(packages/ui)으로 만들어 작업 0356 의 "다른 나라 통화 보기" 버튼과 같은 모양 규칙을 씀.
- 통화 상세 위쪽 "이 통화 쓰는 나라 물가 보기" 링크는 그대로.
- 작업 종류: 위치 · 정렬 ② + 버튼 글 · 나라 수(숫자) ③ → 나라 수 · 버튼 링크는 기능 테스트, 정렬은 새 테스트 없음(디자인).

## 애매한 곳
- 버튼 누르는 자리 44px 이상(사용자 조건 · 작업 0268) (확인됨: 기존 조건).

## 파일 계획
- packages/ui/src/components/** (FaqList · 테두리 버튼 공통 부품)
- apps/web/src/features/prices/country/** · apps/web/src/features/currencies/detail/**
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0355-faq-left-cta/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] /prices/[code] · /currencies/[code] 의 기존 e2e(연결표로 고른 것)도 로컬에서 확인(0351 허점)

## 허점
-
