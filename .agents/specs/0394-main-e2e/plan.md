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
- word-cheap:38: 0393 숫자 칸 위치 문장 '…%의 날보다 쌈' 이 0276 규칙('쌈' 낱말 하나 금지 · 사용자 결정)에 걸림 → lead 결정: 규칙을 지켜 '…%의 날보다 낮음' 으로(뜻 같음) · builder pickFacts 문장 + test 기대값.
- 하이드레이션 전에 hero 입력창에 쓴 글자는 칸에 남지만 제안이 안 뜸(느린 기기 실제 문제 · test 재현) → builder 가 마운트 때 칸 값을 상태로 읽게 고침(apps/web/src/features/home/hero/use-hero-ask.ts).
- tap-44:71 year-link(CI 에서만 40.5 < 43.5): #455 에선 통과 · 그 뒤 0385 캐러셀 알약 줄이 12달 막대 바로 위에 들어옴 → 알약 · 진행 줄의 넓힌 영역이 year-link 위를 덮는지 builder 가 390px 에서 확인하고 간격으로 떼어 놓음.
  - 결과: 덮는 요소를 찾지 못함(builder 는 브라우저 없음 · test 는 로컬 재현 안 됨 · CI 결과 파일 없음). 로컬 측정이 정확히 44(여유 0)라, 보이는 크기는 그대로 두고 year-link 넓힌 눌리는 영역을 약 48px 로 늘려 여유를 둠(apps/web/src/features/home/timing/year-bars* · 계획 밖).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 뒤 #470 전체 e2e 통과

## 허점
- 느린 기기에서 React 가 붙기 전에 hero 입력창에 쓴 글자: 하이드레이션이 서버 value='' 로 덮어써 지워짐 → 마운트 때 칸 값 읽기로는 못 살림(test 가 CPU 6배로 측정 · 바로 입력 0/4). 지워지기 전에 잡으려면 body 앞 작은 스크립트로 입력을 보관하거나 비제어 입력으로 바꿔야 함 · 이번 main 반영을 막지 않아 새 작업으로 미룸(테스트는 typeHero 로 붙은 뒤 입력).
- tap-44 year-link 를 CI 에서 덮던 요소는 끝내 못 찾음 · 눌리는 영역 여유(52px)로 막음 · CI 실패 때 test-results 를 산출물로 올리지 않아 원인 확인이 막힘(워크플로 보호 파일 · 사람 승인 필요).
- 0393 을 test 전체 결과 전에 develop 에 머지했고, main 전체 e2e 에서 0393 · 0384 · 0385 와 이어진 기존 spec 17개가 한꺼번에 드러남.
