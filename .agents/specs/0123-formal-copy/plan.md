# 계획

## 무엇을 · 왜
- 점검판 "안 돎" → "실패" · 사이트 문구 전체에서 캐주얼한 표현을 "~합니다" 체와 정확한 단어로 바꿈

## 애매한 곳
- "싼 편 · 비싼 편" 은 판단 규칙의 이름이라 유지 (가정)
- 파일이 10개를 넘지만 문구만 바꿔 경계 · 계약 변경이 없어 Quick (가정)

## 파일 계획
- apps/web/src/app/not-found.tsx
- apps/web/src/features/home/** · apps/web/src/features/import-calc/** · apps/web/src/features/travel-price/** · apps/web/src/features/log/** · apps/web/src/features/currencies/**
- apps/web/src/shared/freshness.ts · freshness.test.ts
- packages/shared/src/currency.ts · packages/shared/src/*.test.ts
- README.md · docs/**
- .agents/specs/0123-formal-copy/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 운영 HTML 에서 새 문구 확인

## 허점
- 문구 검사가 없어 표현 지적이 반복됨 — 다음에 또 나오면 검사로 막음
