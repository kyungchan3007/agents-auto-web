# 계획 — 작업 0278 · 모서리 값을 여섯 가지로 (Quick · 디자인 PR · 시안 47)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 모서리 단계 4(작은 칸) · 6(꼬리표) · 10(단추 · 막대) · 14(입력 칸) · 24(카드) · 알약 을 토큰으로. 옮김: 2 · 3 → 4 / 5 → 6 / 8 · 9 · 11 → 10 / 16 → 14 / 18 · 20 · 22 · 26 · 28 → 24. 알약 표기 두 가지는 하나로(모양 변화 없음).
- 그대로: 꼬리표 6px · 알약 모양 · 창밖 창문 모양(88 ~ 118px) · 둥근 국기(50%).

## 애매한 곳
- 바뀌는 곳 수(여행 타이밍 89 / 홈 26 / 직구 13 / 여행 물가 5)는 claude-desktop 측정 → builder 대조, 크게 다르면 먼저 보고. (작업서)
- 대상 아님: /geo · /log · 글자판 · 큰 환율 숫자. (작업서)
- 파일이 10개를 넘으면 lead 가 나눈다 — builder 가 바꿀 파일 수를 먼저 보고. (0273 처리와 같음)
- 모서리 값을 고정한 테스트: @design 이면 목록에 쌓고 개수 · 이름 알림 · 표시 없는 테스트면 의도된 값인지 가려 맞춤 · 팝업 그림자 예외 등 예전 결정과 부딪치면 멈추고 알림. (작업서)

## 누가
- builder — 대조 · 파일 수 보고 → 구현 · 로컬 빌드 확인 · 한 번에 푸시
- test — 깨진 테스트 · 로컬 e2e(4399 점검 · 새 spec 이면 연결표 + 하네스 테스트) · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- packages/ui/src/** (tokens.css · 부품)
- apps/web/src/shared/** · apps/web/src/app/globals.css
- apps/web/src/features/{home,currencies,travel-price,import-calc,intro,about}/**
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0278-radius-six/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 대상 페이지 모서리 값이 여섯 단계 밖 0(그대로 두는 것 제외)

## 허점
-
