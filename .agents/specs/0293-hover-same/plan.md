# 계획 — 작업 0293 · 마우스 올렸을 때 변화 같게 (Quick · 디자인 PR · 시안 62)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 넓은 화면 · 마우스가 있는 기기에서, 기준(홈 도시 칩: 올리면 바탕 흰색 → 옅은 회색)과 같은 방식으로: 여행 타이밍 도시 칩(옅은 회색 · 파랑 테두리) · 달력 ‹ ›(파랑 바탕 · 흰 화살표) · 날짜 칸(옅은 회색) · 창밖 달 버튼(막대 뒤 옅은 회색) · 여행 물가 나라 단추(옅은 회색 · 파랑 테두리) · 창밖 "다시 보기"(파랑 테두리) · 바닥 띠 "소개 · 판단 기준" · 여행 물가 "통화 상세" 링크(올리면 밑줄 · 이미 밑줄이면 색 한 단계 진하게).
- 새 색 없이 토큰만. 이미 고른 것 · 로고는 변화 없음.

## 애매한 곳
- 손가락 기기에서 올림 상태가 남지 않게(@media (hover:hover)). 0268 넓힌 누르는 영역 · 0269 초점 고리와 부딪치지 않게. /geo · /log 제외. 측정값은 claude-desktop 이 잰 것 → builder 대조 · 변화 없는 곳을 더 찾으면 같은 방식으로 맞추고 목록. (작업서)
- 번호: develop 에 사용자 작업 0294 가 먼저 들어가 spec:new 가 0296 을 냈으나 비어 있던 0293 을 씀.

## 누가
- builder — 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 로컬은 단위 · typecheck · lint + e2e-select 목록(team.md 49 ~ 51) · 올림 변화 · 손가락 기기 · 고른 것 변화 없음 확인 · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/{travel-price,currencies,home}/** (airfare-calendar.css · window-months · price-route 등)
- packages/ui/src/** (바닥 띠 · 링크 · tokens.css)
- apps/web/src/app/globals.css · apps/web/src/shared/**
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0293-hover-same/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 목록의 곳에 마우스 올림 변화 · 고른 것 · 로고 변화 없음 · 손가락 기기에 올림 상태 남지 않음

## 허점
- 0292: 작업 폴더를 만든 뒤 원격 푸시가 빠져 builder 가 브랜치를 못 찾음(커밋 체인이 중간에 실패한 것을 확인하지 않음).
