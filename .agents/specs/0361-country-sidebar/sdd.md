# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 1단계(동작 변화 없음): apps/web/src/features/currencies/more/ 의 사이드바 · 시트 틀 · 모션 A(more-motion) · 스크롤 잠금(use-scroll-lock) · 포커스 가두기를 공통(apps/web/src/shared/ui/side-panel/ 또는 packages/ui · role-boundary 허용 목록에 맞춰)으로 꺼냄. 통화 상세는 공통을 가져다 씀. currency-sidebar.spec 이 그대로 통과해야 함.
- 공통 부품 선택 사항: 덮기(시트 · 통화) / 밀어내기(여행 물가 넓은 화면) · 스크롤 잠금 켜기 · 끄기 · 시작 요소(버튼 · 누른 줄)에서 늘어나기 · 내용 바꾸기(옆으로).
- 2단계: features/prices 목록 나라 링크 클릭 가로채기(훅) · 나라 사이드바 내용(0344 나라 페이지 계산 함수 그대로 씀) · ‹ › · n / 전체 · 0360 노선 카드 버튼 연결.

## 대안 · 트레이드오프
- 여행 물가용 사이드바를 따로 만들기: 같은 모션 · 잠금이 두 벌이 되어 고르지 않음(코드 구조 기준).

## 파일 계획
- apps/web/src/features/currencies/more/** (공통으로 옮기고 가져다 쓰기)
- apps/web/src/shared/ui/** 또는 packages/ui/src/components/** (공통 사이드바)
- apps/web/src/features/prices/**
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json · apps/web/src/checks/role-boundary.test.ts (test)
- .agents/specs/0361-country-sidebar/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 공통으로 꺼내며 통화 상세 동작이 바뀔 수 있음 → currency-sidebar.spec 52개가 지킴.

## 검증 계획
- 단위 · e2e(여행 물가 사이드바 · 시트 · 세 폭) · currency-sidebar.spec 회귀 · main 대상 전체 e2e.

## 계획과 달라진 점
- 공통 부품은 packages/ui(side-panel · use-side-panel · use-scroll-lock · side-panel-motion) · 선택 값 width · sheetHeight · layout · modal · trap.
- 사이드바가 열려 본문이 좁아지는 중간 폭(1100 · 1024)에서 노선 카드가 잘려, 노선 카드를 카드 폭 기준(@container 700px 미만)으로 쌓게 바꿈.
- 다음으로 볼 것 번호를 보이는 카드만 1부터(나라 페이지도 같은 함수).
