# 계획 — 작업 0270 · 글자 굵기 요청 값 정리 (Quick · 평소 PR · 시안 44 A안 · 화면 변화 없음)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 본문 글꼴 IBM Plex Sans KR 은 400 · 600 · 700 만 받는다(`apps/web/src/app/layout.tsx`). 500 · 800 · 900 을 요청하는 곳을 실제로 그려지는 값으로: 500 → 400 · 800 → 700 · 900 → 700.
- Pretendard 800(큰 제목)을 쓰는 곳은 그대로. Pretendard 에 600 을 요청하는 한 곳(여행 타이밍)은 지금 그려지는 굵기로 맞춘다.
- 글꼴 파일은 더하지 않는다. 화면이 달라지면 안 된다(디자인 PR 아님).

## 애매한 곳
- 작업서의 곳 수(500 — 홈 10 · 여행 타이밍 12 · 통화 상세 7 · 직구 5 / 800 — 홈 8 · 여행 물가 12 · 여행 타이밍 4 · 통화 3 · 직구 3 / 900 — 홈 2)는 claude-desktop 측정 → builder 가 코드로 대조, 다르면 고치기 전에 보고. (작업서)
- "실제로 그려지는 값"은 브라우저의 글꼴 고르기 규칙에 따른다: 500 요청 → 받은 굵기 중 400(500 이하 가까운 값) · 800/900 → 700. 브라우저가 굵기를 흉내 내던 곳(합성 굵게)이 있어 바꾸기 전 · 뒤 글자 폭 · 줄바꿈이 달라지면 멈추고 보고. (작업서)
- 대상 아님: /geo · /log · 글자판(안내판 숫자) · 통화 상세의 큰 환율 숫자. (작업서)
- packages/ui 부품의 SVG fontWeight(예: line-chart 500)도 같은 규칙. (가정)

## 누가
- builder — 사실 대조 → 구현 · 단계별 커밋 → 로컬 빌드로 바꾸기 전 · 뒤 같은 화면인지 확인 → 푸시 · 보고
- test — 깨진 테스트(굵기 값을 고정한 테스트) 맞춤 · 고친 테스트는 푸시 전 로컬에서 그 파일만 먼저 · @design 깨짐 개수 보고
- lead — 작업표 · PR · gate · ALL PASS 면 develop 머지

## 파일 계획
- packages/ui/src/** (부품 · tokens.css)
- apps/web/src/shared/**
- apps/web/src/features/{home,currencies,travel-price,import-calc,intro,about}/**
- apps/web/src/app/globals.css
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · packages/ui/src/**/*.test.ts(x) (test)
- .agents/specs/0270-font-weight/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 대상 범위에 500 · 800 · 900(IBM Plex) 요청이 남지 않음
- [ ] 바꾸기 전 · 뒤 화면 같음(글자 폭 · 줄바꿈)

## 허점
- 0270 번호는 처음에 "e2e 를 미리보기 주소로" 작업에 썼다가 사용자가 로컬 빌드를 허용해 머지 전에 취소했다(브랜치 삭제) — 같은 번호를 이 작업에 다시 씀.
