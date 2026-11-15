# SDD — 어떻게 (0177)

> 요구사항: [prd.md](prd.md)

## 접근
- **안내판 부품** `packages/ui` 에 (이름은 test 가 정함 · 예: `FlapBoard`): props = 줄 목록(글자 · 색 종류) · 칸 수 · 접근성 문장 · 처음 한 번 움직일지. 칸은 고정폭 그리드(한글 · 숫자 · 기호 모두 한 칸) · 울트라마린 판 · 칸 색 · 가운데 이음선.
- **순수 함수**(packages/ui/src/lib · 테스트 대상): 글자열 → 칸 배열(칸 수에 맞춰 채우기 · 넘치면 줄임 규칙) · 넘어가는 차례(처음 글자 → 최종 글자 단계 목록 · 칸마다 조금씩 늦게) · 값이 없으면 "----"
- **움직임**: CSS/JS 로 한 번만(약 1~2초) · `prefers-reduced-motion` 이면 바로 최종 · 다시 돌지 않음 · 화면 읽기 도구에는 판 전체를 한 문장(aria-label 또는 숨김 텍스트), 칸 글자는 aria-hidden
- **홈 배치**: today-band 를 새 구간으로 교체 — 히어로 사진 구간 아래 끝을 하늘 종이로 흐리게(0175 PhotoHeader 의 막과 같은 방식으로 아래쪽), 안내판은 음수 위 여백으로 사진에 반쯤 걸침. 데스크톱은 안내판 왼쪽 · 3D 지구 오른쪽(배경 없이), 모바일은 안내판 아래 지구 작게. `id="today"` 유지(메뉴 "오늘 환율").
- **자료**: today-band 가 쓰던 cheapestDestination · cheapestCopy 그대로. 1줄 "ICN → {도시}", 2줄 "{금액}원 / {단위}" 형식.
- 0168 · 0169 · 0175 의 "바다 띠 = data-surface dark · 노란 큰 숫자" 기대 테스트는 새 구성으로 test 가 고침.

## 대안
- 지구를 없앰: 사용자가 지구 · 비행기는 유지하길 원했음 → 위치만 옮김.
- 판 전체를 3D 로: 무겁고 접근성 · 글자 선명도 손해 → HTML/CSS 칸.

## 파일 계획
- .agents/specs/0177-flap-board/**
- .agents/orchestration/TASKS.md
- packages/ui/src/components/**
- packages/ui/src/lib/**
- packages/ui/src/tokens.css
- apps/web/src/features/home/**
- apps/web/src/app/page.tsx
- apps/web/src/app/design/**
- apps/web/src/shared/**
- apps/web/e2e/**
- docs/design.md

## 계획 밖 변경 이유
- packages/ui/src/hooks/use-flap-once.ts — 처음 한 번만 넘어가는 움직임을 부품에서 떼어 낸 훅 (부품과 같은 범위)
- packages/ui/src/three/objects/globe.tsx · packages/ui/src/three/scene/lazy.tsx · packages/ui/src/three/lib/geo.ts · packages/ui/src/three/lib/geo.test.ts · packages/ui/src/three/lib/three-tokens.test.ts · apps/web/public/textures/earth-2048.jpg — 14:47 추가 요청 "지구 지워 필요없어 · 안 쓰는 코드 남기지 않음" 에 따라 홈에서만 쓰던 3D 지구 부품 · 지도 좌표 함수 · 지구 텍스처(348KB) · 관련 테스트를 지움 (비행기 three 코드 · 의존성은 그대로)

## 위험
- 사진 · 안내판 겹침이 화면 폭마다 깨질 수 있음 → 375 · 1440 · 1920 e2e 와 배포 화면 확인
- 움직임이 레이아웃을 흔들 수 있음 → 칸 크기 고정
- Full 게이트 build 는 운영 API 를 읽음 → 개발 중 LOOP=quick, Full 은 lead 가 PR 직전 한 번

## 검증 계획
- test(먼저 FAIL): 칸 배열 · 넘침 · 빈 값 "----" · 넘어가는 차례 순수 함수 · 부품 소스 검사(aria-label 한 문장 · 칸 aria-hidden · reduced-motion · 한 번만 · 판 색 · 칸 색 · 이음선) · 홈에 울트라마린 전체 띠 없음 · id="today" 유지 · 지구 · 비행기 코드 그대로 · e2e(375 · 1440 · 1920 겹침 · 넘침 없음 · 도착지 · 금액 · 판정 줄 보임 · reduced-motion 에서 최종 글자 바로 · 긴 금액)
- 화면: lead 가 배포 주소를 375 · 1440 · 1920 으로 확인 (PR 에는 미리보기 주소만)

## 계획과 달라진 점
- 14:47 사용자 결정(A안)으로 '사진에 걸치기'를 취소: 판은 사진 아래 하늘 종이 위에 놓인 짙은 남색 물건(#16246E · 칸 #24337f · 두 줄 노랑 · 그림자 · 모서리 10px) · 홈 3D 지구 제거 · Quick 으로 진행(builder 단독 · 새 e2e 없음)
