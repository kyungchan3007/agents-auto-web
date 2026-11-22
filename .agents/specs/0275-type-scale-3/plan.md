# 계획 — 작업 0275 · 글자 크기 11단계 (3/3) — 통화 상세 · 홈 · 직구 (Quick · 디자인 PR · 시안 46)

## 무엇을 · 왜
- 0273 · 0274 의 토큰 위에서 통화 상세(currency-detail · period-chart · range-card) · 홈(ticket · destinations-pill) · 직구(result-board · import-calc 3)의 글자를 가장 가까운 단계로(같은 거리면 큰 쪽). 반응형 제목: 홈 휴대폰 57.6 → 56 · 통화 상세 휴대폰 34 → 36 · 직구 32 → 36. 줄 높이 비율 유지. (0273 작업서 · plan)

## 애매한 곳
- 대상 아님: /geo · /log · 글자판 · 통화 상세 큰 환율 숫자. 줄바꿈이 바뀌어 겹침 · 넘침이 생기면 멈춤. (작업서)
- 크기를 고정한 표시 없는 테스트가 깨지면 의도된 값 변경인지 가려 맞춤 · @design 깨짐은 개수 · 이름 기록. (0273 · 0274 처리 그대로)

## 누가
- builder — 구현(준비해 둔 변경) · 로컬 빌드 확인 · 한 번에 푸시
- test — 깨진 테스트 맞춤 · 로컬 e2e(e2e 전 포트 4399 고아 서버 점검) · @design 개수 보고
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/{currencies,home,import-calc}/**
- packages/ui/src/** (해당 부품이 있으면)
- apps/web/src/app/globals.css
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0275-type-scale-3/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 통화 상세 · 홈 · 직구 글자 크기 11단계 밖 0 · 넘침 · 겹침 없음

## 허점
-
