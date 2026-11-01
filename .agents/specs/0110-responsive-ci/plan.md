# 계획

## 무엇을 · 왜
- 운영 사이트를 크롬 · 파이어폭스 · 사파리 엔진 × 320 · 375 · 768 · 1280 으로 여는 반응형 점검을 CI 에 둠
  - 이 기기에선 Playwright Firefox 가 안 켜짐 (작업 0109) · 리눅스 러너에선 됨
  - 확인: 가로 넘침 없음 · 위 메뉴 다섯 개가 화면 안 (작업 0109 에서 320px 메뉴 잘림을 못 잡았음)
- PR 마다 빌드해서 보지 않고 운영 사이트를 봄 — 빌드는 API(D1)를 읽음 · 이미 하루 한도를 넘긴 적 있음
  - 대신 머지 뒤(배포 5분 기다림) · 매일 한 번 · 손으로

## 애매한 곳
- 머지 전이 아니라 머지 뒤에 잡힘 (D1 아끼려고) (가정)

## 파일 계획
- apps/web/e2e-responsive/**
- apps/web/playwright.responsive.config.ts
- apps/web/package.json
- .github/workflows/responsive.yml (보호 파일 · harness-approved 라벨)
- .agents/specs/0110-responsive-ci/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 이 기기에서 크롬 · 사파리 프로젝트로 운영 사이트 점검 통과
- [ ] 머지 뒤 CI responsive 실행 통과 (파이어폭스 포함)

## 허점
-
