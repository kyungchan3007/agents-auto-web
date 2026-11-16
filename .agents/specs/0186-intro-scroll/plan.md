# 계획

## 무엇을 · 왜
- 작업 0185 공항 인트로가 기존 홈을 건드리는 버그 두 가지 (원칙: 기존 홈은 그대로 · 인트로는 덮기만)
  1. 데스크톱에서 인트로를 끝내거나 건너뛴 뒤 홈이 스크롤되지 않음 — 인트로가 닫혀도 `html { overflow: hidden }` 잠금과 휠 가로채기(5단계)가 남음 (운영 재현: scrollY 0 · overflow hidden)
  2. "오늘 환율"(`/#today`) 같은 사이트 안 링크로 홈에 오면 인트로가 다시 뜸 — 지금 조건은 폭 700 초과뿐

## 애매한 곳
- "매번 보여 준다"의 뜻: 사이트에 들어올 때마다(주소창 · 새로고침 · 외부 링크) — 사이트 안 이동(다른 페이지 → 홈 · `#위치` 링크)에서는 띄우지 않음 (가정 · 사용자에게 알림)

## 파일 계획
- .agents/specs/0186-intro-scroll/**
- apps/web/src/features/intro/hooks/use-intro.ts
- apps/web/src/features/intro/hooks/use-intro-enabled.ts
- apps/web/src/features/intro/lib/**
- apps/web/e2e/intro.spec.ts

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] e2e: 인트로를 끝내거나 건너뛴 뒤 휠로 홈이 스크롤되고 html 잠금이 없음
- [ ] e2e: 주소에 `#today` 가 있거나 사이트 안 이동으로 홈에 오면 인트로 없음 · `/` 로 처음 들어오면 인트로 있음
- [ ] 운영(미리보기)에서 같은 확인

## 허점
- 0185 e2e 는 "인트로가 사라졌는지"만 보고 "그 뒤 홈이 원래대로 동작하는지"는 안 봄 — 덮는 층은 닫힌 뒤 원래 동작 회복을 꼭 검사
