# PRD — 무엇을 · 왜 (0176 큰 제목 글꼴 Pretendard 800)

> 요청 원문: [request.md](request.md) · 앞선 글꼴 결정: [0173 prd](../0173-font-readability/prd.md)

## 문제
- 큰 제목 · 큰 숫자의 Gasoek One 이 "귀엽긴 한데 너무 뚱뚱해서 보기 힘들다" (사용자). 국내 환율 · 여행 사이트(네이버 환율 · 마이리얼트립 · 트리플)는 Pretendard 700 을 씀 (설치 에이전트 조사).
- 사용자가 고른 안: **A. Pretendard 800 · 자간 약 -0.03em**.

## 요구사항
- R1 `--font-display`(큰 제목 · 큰 숫자)를 Pretendard 굵기 800 으로. 자체 호스팅 · 런타임 외부 요청 없음.
- R2 `font-display` 를 쓰는 곳(today-band · currency-detail · calc-result · converter 등 — font-normal 로 박혀 있음)을 굵기 800 · 자간 -0.03em 으로 맞춤. 숫자는 tabular-nums 유지.
- R3 Gasoek One 을 더 쓰지 않으면 layout.tsx 에서 제거. 로고는 화면을 보고 판단(남기면 로고만).
- R4 본문 IBM Plex Sans KR · 제목 속 숫자 강조(노란 띠 · 비쌈 주홍) · 색 · 배치는 그대로. 글꼴만.
- R5 모바일 375 · 데스크톱 1440 에서 홈 · 통화 · 직구 계산 · 여행 물가 레이아웃 깨짐 없음.
- R6 밝은 화면만 · 지구 · 비행기 3D 그대로 · PR 에 캡처 올리지 않음 (미리보기 주소만).

## 성공 기준
- 큰 제목 · 큰 숫자가 Pretendard 800 으로 보임 · 첫 화면에 받는 글꼴 용량이 Gasoek One 때보다 크게 늘지 않음 · `checks.sh` (Full) PASS
