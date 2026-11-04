# 계획

## 무엇을 · 왜
- /about 소개 · 판단 기준 페이지 — 규칙 숫자는 API rule · 공용 상수에서 읽음 (지어내지 않음)
- 통화 절반에 요약 문장 · 기간별 표 (비교용 고정 목록 · docs/geo-measurement.md)
- 주요 기준일 `<time>` · 출처 문구 한곳 · 면세 기준 출처 링크
- 측정 기록 docs/geo-measurement.md

## 애매한 곳
- 비교 대상은 요약 · 표만 — 소개 페이지 · time · 출처는 사이트 전체라 나눌 수 없음 (가정)
- 비교군은 지금 통화 21개를 코드순으로 번갈아 고정 · 새 통화는 대조군 (가정)
- 파일이 10개를 조금 넘지만 작은 수정이고 경계 · 계약 변경이 없어 Quick (가정)

## 파일 계획
- apps/web/src/app/about/page.tsx · apps/web/src/features/about/about-page.tsx
- apps/web/src/features/currencies/summary.ts · summary.test.ts · currency-detail.tsx · browse-layout.tsx
- apps/web/src/shared/date-text.tsx · site.ts · site-nav.tsx
- apps/web/src/features/home/home.tsx · apps/web/src/features/import-calc/calc-form.tsx
- apps/web/src/features/log/log-page.tsx · status-text.ts · status-text.test.ts
- apps/web/e2e-responsive/responsive.spec.ts
- packages/shared/src/currency.ts
- docs/geo-measurement.md · README.md
- .agents/specs/0115-citable-content/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 로컬 빌드 HTML 에서 요약 · 표 · time 확인 · 비교군만 나옴 · 반응형 점검 통과

## 허점
-
