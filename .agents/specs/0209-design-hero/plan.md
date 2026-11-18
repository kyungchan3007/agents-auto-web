# 계획

## 무엇을 · 왜
- 고른 나라가 없을 때도 머리 사진이 큰 문장 속 나라를 보여 준다 (#248).
  - 홈: 안내판 기본 도착지(빌드 때 "이번 주 가장 싸게 갈 수 있는 곳" · 오늘 파리) 나라 사진 — 서버 HTML 에서 바로(빌드 때 정해짐).
  - 여행 물가: 기본 문장 나라(가장 싼 나라 · 오늘 인도) 사진.
  - 고른 나라가 있으면 그 나라 사진(0201 그대로) · 사진 없는 나라는 지금 사진(피오르 · 스위스 여행자).
- 휴대폰 홈 머리 사진 덮개: 글자 뒤 아래쪽만 흐리게(위쪽은 사진이 보이게).
- 홈 "11월에 떠나세요" 노란 표시줄을 강조 글자 폭에 맞춤.

## 애매한 곳
- 사진 고르는 규칙은 `countryPhoto`(0201) 하나로 — 기본 나라 · 고른 나라 모두 같은 함수 (가정)
- 덮개: 휴대폰에서 위 40% 는 덮개 없음 · 글자가 있는 아래쪽은 지금 정도로 흐리게 · 글자 대비 4.5:1 이상 유지 (가정 · 검사로 확인)
- 노란 표시줄은 EmphText 공통 부품 — 다른 화면 강조도 같이 맞춰질 수 있음 → 다른 화면이 달라지면 캡처로 확인해 이유를 적음

## 파일 계획
- apps/web/src/features/home/**
- apps/web/src/features/travel-price/**
- packages/ui/src/components/layout/photo-header.tsx
- packages/ui/src/components/text/emph.tsx
- packages/ui/src/lib/photo.ts
- apps/web/src/shared/*.test.ts
- apps/web/e2e/**
- .agents/specs/0209-design-hero/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Quick)
- [ ] 안 고른 상태 서버 HTML: 홈 머리 사진 = 안내판 도착지 나라(파리 → country-eur) · 여행 물가 = 문장 나라(인도 → country-ind) · 사진 없는 나라면 지금 사진 (단위 · e2e)
- [ ] 휴대폰 홈 머리 사진 위쪽이 덮개 없이 보임 · 글자 대비 유지
- [ ] 노란 표시줄이 강조 글자 폭과 같음 (e2e: 표시줄 왼쪽 · 오른쪽 끝이 글자 끝과 ±2px)
- [ ] 브랜치 미리보기 확인 (lead · 1280 · 390)

## 허점
-
