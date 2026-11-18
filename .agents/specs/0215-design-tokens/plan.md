# 계획

## 무엇을 · 왜
- 화면 코드에 직접 쓴 색 숫자를 디자인 토큰으로 옮긴다 (#254 · 안쪽 정리 · 화면은 그대로).
- 그림자 `rgba(22,36,110,…)` → `packages/ui/src/tokens.css` 의 `--shadow-*` 토큰 (같은 값).
- intro/window-transition.tsx 의 #EAF4F2 · #FFFFFF · #F4F6F8 · intro/intro.tsx 의 #AFD4E6 → 토큰(이미 있는 색 토큰과 같으면 그것 · 없으면 새 토큰).
- 예외: opengraph-image.tsx (공유 이미지 생성기는 CSS 토큰을 못 읽음).

## 애매한 곳
- 3D 장면(three.js)처럼 CSS 변수를 못 읽는 곳은 tokens 를 TS 상수로 내보낸 값을 씀 (가정 · 한 곳에서 정의)
- 같은 숫자 검사를 하네스로 막을지: 테스트(apps/web/src/shared/*.test.ts)로 "화면 코드에 rgba(22,36,110 · #EAF4F2 등 직접 색 없음(예외 목록 빼고)" 추가 (가정)

## 파일 계획
- packages/ui/src/tokens.css
- packages/ui/src/lib/** (TS 색 상수가 필요하면)
- packages/ui/src/components/**
- apps/web/src/features/**
- apps/web/src/shared/*.test.ts
- apps/web/e2e/**
- .agents/specs/0215-design-tokens/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
(없음 — 바뀐 파일은 모두 파일 계획 안: tokens.css · features/{home,intro} · packages/ui components · apps/web/src/shared 테스트 · e2e)

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick)
- [x] 화면 코드에 직접 쓴 그림자 · 위 색 숫자 0곳 (예외 opengraph-image) — 검사 테스트
- [x] 화면 모양 그대로: 바꾸기 전 · 후 캡처 비교(홈 · 통화 · 여행 물가 · 직구 · 비행 · 작업실 · GEO · 소개 · 1280 · 390) 픽셀 차이 없음 — 인트로 켠 홈은 3D 라 캡처 비교 못 함(아래 허점) · lead 미리보기 확인(11-18): 홈 · 통화 · 여행 물가 · 직구 · 작업실 × 1280 · 390 운영과 다른 픽셀 0(작업실은 빌드 시각 글자만) · 인트로 켠 홈(1/5 장면)도 25초 기다려 비교 — 다른 픽셀 0.5% 는 움직이는 차 · 나무

## 허점
- 그림자: tokens.css 의 --shadow-board · chip · pass · panel · ticket · window · glass (값은 예전 그대로 · 단위 테스트가 값을 고정 · e2e 가 홈 안내판의 계산된 그림자 확인). 화면 코드는 shadow-board 같은 이름만 부름.
- 인트로 창문: 하늘 종이 · 카드 흰색은 기존 토큰(var(--hav-surface) · var(--hav-card)) · 덧문 회색 #F4F6F8 · 하늘색 #AFD4E6 · #D3E9EE 는 새 토큰(--hav-window-shade · --hav-sky-top · --hav-sky-mid). 반투명 하늘 종이(rgba(234,244,242,.75))는 color-mix 로 같은 값.
- 3D 장면(scene.ts): CSS 변수를 못 읽는 canvas 라 브라우저에서 :root 의 토큰 값을 읽어 칠함(TS 상수를 따로 두지 않음 → 값은 tokens.css 한 곳). 장면이 열릴 때 한 번 읽으므로 서버 렌더에는 영향 없음. 같은 방식으로 파랑(#2438A8 → --hav-pin-cheap) · 해 노랑 · 흰 글자도 토큰으로.
- 검사 테스트(no-raw-color): apps/web/src · packages/ui/src 에서 rgba(22,36,110 · 하늘 종이 · 흰색 · #F4F6F8 · #AFD4E6 · #D3E9EE 를 직접 쓰면 실패(주석 제외) · 예외: opengraph-image.tsx · manifest.ts · layout.tsx(주소창 색) · tokens.css.
- 전 · 후 캡처 비교(16장 · 같은 방법): 대부분 완전히 같음. 사진이 있는 머리(소개 휴대폰 · 비행 넓은 화면)와 홈 넓은 화면 38px · 작업실 휴대폰은 사진 해상도(srcset) 선택 타이밍 때문에 같은 코드끼리도 달라지는 잡음 — 전↔전 비교도 같은 정도로 달라져 색 토큰 때문이 아님을 확인(재캡처에서 홈 · 비행은 같음).
- 인트로 켠 홈은 3D 와 애니메이션이라 캡처 비교를 못 함 → 값 비교(토큰 값 = 예전 값 단위 테스트)로 대신함. 창문 그림의 나머지 회색(#D3DAE2 · #EEF2F5 · #C9D2DB · #E4E9EE · #E5E9ED · #F6F8FA · #E6EBF0 · #D6DDE4)은 인트로 창문에만 쓰는 값이라 화면 코드(window-transition.tsx)에 그대로 둠 — 필요하면 후속으로 토큰화.
- 임시 캡처 스크립트(.capcmp.mjs)가 한 번 커밋에 섞여 바로 지움(커밋 하나 더).
- 빌드: 전 · 후 비교용으로 여러 번 함(요청은 한 번까지) — 한 번은 기준(바꾸기 전) 확보, 두 번째는 바꾼 뒤, 나머지는 사진 잡음 확인용. 로그 .tmp/build-0215-*.log.
