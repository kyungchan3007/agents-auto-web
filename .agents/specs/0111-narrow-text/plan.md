# 계획

## 무엇을 · 왜
- 직구 계산기 "보내는 곳" 선택지가 320px 에서 잘림 → 이름을 짧게 ("미국 · 목록통관 · 200달러") · 뜻은 안내 글로
- 통화 목록 · 여행 물가의 지역 · 정렬 단추가 옆으로 넘기는 칸이라 "오세아니아" 가 잘림 → 줄을 넘겨 다 보이게
- 통화 목록 통화 줄(옆으로 넘김)은 휴대폰에서 오른쪽 끝을 흐려 넘길 수 있다고 알림
- 홈 통화 탭: 좁은 화면 간격 줄이고 360px 아래는 끝을 흐림
- 작업실 장면 스크롤 길이: 휴대폰 330vh → 230vh

## 애매한 곳
- 흐림 85% (메뉴에 쓰던 값) (가정)

## 파일 계획
- apps/web/src/features/import-calc/{rules.ts,calc-form.tsx}
- apps/web/src/features/currencies/currency-list.tsx
- apps/web/src/features/travel-price/price-bands.tsx
- apps/web/src/features/log/log-body.tsx
- packages/ui/src/components/tabs.tsx
- .agents/specs/0111-narrow-text/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 로컬 빌드를 반응형 점검(크롬 · 사파리 48개) 통과 · 320 화면 눈으로 확인

## 허점
-
