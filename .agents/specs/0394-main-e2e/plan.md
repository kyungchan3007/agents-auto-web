# 계획

## 무엇을 · 왜
- #470 (develop 51848f8c · run 45983018139) 전체 e2e: 1563 통과 · 실패 17 · 간헐 11. 실패 spec: country-pick · home-pick:149 · home-redesign:22 · tap-44:71 · tokens:9 · word-cheap:38 · :50 · home-guide:105(휴대폰). 대부분 오늘 바뀐 첫 페이지 hero(0393 숫자 칸 · 제안 목록 · 0384 카드 지움)와 이어짐.
- test 가 로그 · 코드로 각 실패를 (가) 코드가 규칙 · 동작을 어김(builder) (나) 테스트 기대값이 옛 화면 기준(test) 으로 가르고 고침. 간헐 11개 중 home-pick 은 이번 작업 새 spec 이라 함께 안정화.
- 고친 뒤 develop 머지 → #470 다시 돌림 · 통과하면 claude-desktop 이 main 머지 · 릴리스 없음.

## 파일 계획
- test: apps/web/e2e/{country-pick,home-pick,home-redesign,tap-44,tokens,word-cheap,home-guide}.spec.ts
- builder(코드 문제일 때만 · 이유 적음): apps/web/src/features/home/hero/** · apps/web/src/shared/trip/**
- .agents/specs/0394-main-e2e/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 뒤 #470 전체 e2e 통과

## 허점
