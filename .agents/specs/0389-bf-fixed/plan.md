# 계획

## 무엇을 · 왜
1. 블프 장 영수증이 한 줄씩 찍히며 종이가 길어질 때 hero 높이가 같이 늘어나 아래 화면이 밀림 → 영수증 자리를 처음부터 다 찍힌 최종 크기(줄 · 합계 · 바코드)로 잡고, 찍히는 모션은 그 자리 안에서만(clip-path · transform · 투명도). 레이아웃 높이 변화 0 · JS 로 높이 재지 않음 · 캐러셀 두 장 높이 같음 유지.
2. 금액 입력 옆 통관 select(미국 목록통관 / 일반 · 그 밖의 나라) 를 없애고 "미국 · 목록통관" 고정 글자(칸 모양 안 · 누를 수 없음 · button/select 아님 · 화살표 · 펼침 없음). 한도는 미국 목록통관 $200 고정(import-calc 규칙 한 곳에서 읽음 · IMP-03) · 직구 계산 페이지는 그대로. 입력칸 이름에 "미국 목록통관 기준" 이 읽히게(aria-describedby). 숫자만 · 입력하면 자동 넘김 꺼짐은 그대로.
- 그대로: 영수증 모션 순서 · 속도 · 카운트업 · 도장 · 문구 · 반응형 기준(900 / 1200).

## 파일 계획
- builder: apps/web/src/features/home/blackfriday/** (bf-hero.tsx · bf-receipt-view.tsx · bf-hero.css · use-bf-calc.ts · 필요하면 bf-copy.ts · bf-receipt.ts)
- test: blackfriday 단위 테스트 · apps/web/e2e/{home-bf,home-carousel}.spec.ts(select 검사를 고정 글자로 · 높이 변화 0 검사)
- .agents/specs/0389-bf-fixed/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지까지(main 은 사용자가 말할 때) · 릴리스 없음

## 허점
