# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 기간 고르기: 서버 HTML 에 두 hero 를 모두 그리고, html 에 붙는 data 속성을 head 의 작은 인라인 스크립트가 첫 그림 전에 지금 시각으로 정함 → CSS 로 하나만 보임. 이유: 정적 빌드라 빌드 시각으로 고를 수 없고, 클라이언트 교체(useEffect)는 첫 그림에서 기본 hero 가 잠깐 보임(깜빡임). 스크립트가 꺼진 경우는 기간 판정 lib 를 쓰는 클라이언트 훅이 같은 값으로 맞춤(대체). 판정 함수(isBlackFriday(now))는 lib 한 곳 · 상수 BF_END = 2026-12-01T17:00:00+09:00.
  - 인라인 스크립트가 CSP 와 충돌하면 builder 가 멈추고 lead 에게(대안: 클라이언트 교체 + 첫 그림 숨김).
- 계산기: import-calc rules · customs-rate 를 재사용하는 lib(bf-calc) · 커스텀 훅 · tsx 에 로직 없음. 입력값은 상태에만.
- 영수증 모션: 커스텀 훅(한 번만 · 반복 없음) · prefers-reduced-motion 이면 끝 상태.
- 기간이 끝나면 다음 작업에서 코드를 지움(이번 범위 밖 · 허점에 적음).

## 대안 · 트레이드오프
- 빌드 시각으로 고르기: 12-01 17:00 에 빌드가 없으면 안 바뀜 · 고르지 않음.
- 클라이언트에서만 교체: 첫 그림 깜빡임 · 고르지 않음.

## 파일 계획
- apps/web/src/features/home/** (블프 hero · 영수증 · 계산기 · 기간 판정 · 훅 · lib)
- apps/web/src/app/layout.tsx 또는 page head (기간 판정 인라인 스크립트가 필요하면 · 보호 파일이면 멈춤)
- apps/web/src/features/import-calc/calculator/rules.ts (재사용 · 바꾸지 않음이 원칙)
- packages/ui/src/tokens.css (필요하면)
- .changeset/*.md (minor)
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0381-hero-bf/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
