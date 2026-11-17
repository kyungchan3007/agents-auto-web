# 계획

## 무엇을 · 왜
- 여행 물가(`/prices`)의 "나라 더 보기 (N곳) ›" · "나라 접기"가 본문 크기 파란 글자뿐이라 버튼으로 보이지 않는다 (#231).
- 펼치면 목록이 길어 "나라 접기"가 맨 아래에만 있어 찾기 어렵다.
- 버튼 모양으로 바꾸고, 펼친 상태에서도 접기를 쉽게 찾게 하고, 접으면 목록 머리로 돌아가게 한다.

## 애매한 곳
- 버튼 모양: 사이트의 기존 테두리 알약 버튼과 같게 — `rounded-pill border-2 border-cheap text-cheap hover:bg-surface-2` · 높이 44px 이상 · `focus-visible` 초점 테두리 (확인됨: 이슈 · 기존 코드)
- 펼친 상태의 접기 위치: 화면 아래에 붙어 따라오는 버튼(sticky)과 목록 위 버튼 중 하나 — 화면 아래 sticky 를 기본으로 두고, 모바일에서 카드 글자를 가리면 목록 위 버튼으로 바꾼다 (가정 · builder 가 실제 화면을 보고 정함, 고른 이유를 허점 칸 아래에 적음)
- 접은 뒤 스크롤: `price-bands` 머리로 `scrollIntoView` (모션 줄이기 설정이면 즉시 이동) (가정)

## 파일 계획
- apps/web/src/features/travel-price/**
- apps/web/e2e/**
- .agents/specs/0198-fold-button/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Quick)
- [ ] 버튼이 테두리 알약 모양 · 높이 44px 이상 · 키보드 초점 표시
- [ ] 펼친 상태에서 목록 중간까지 스크롤해도 "나라 접기"가 보임 (또는 목록 위에도 있음)
- [ ] 접으면 목록 머리가 화면 안에 들어옴
- [ ] e2e: 펼치기 · 접기 · 접은 뒤 위치 (넓은 화면 · 휴대폰)
- [ ] 브랜치 미리보기 주소에서 확인 (lead)

## 허점
-
