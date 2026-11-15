# 요청 원문

<!-- 사용자·이슈의 요청을 그대로 붙여 넣는다. 요약·정리하지 않는다. -->

(큐 작업 qitem-20261115135709-25579cb029a569f2 본문 원문)

# 작업 요청 — 큰 제목 · 큰 숫자 글꼴을 Pretendard 800 으로 바꾸기

## 사용자 요청 원문 (request.md 에 그대로 적을 것)
그리고 폰트좀 어떻게 해보자 귀엽긴 한데 너무 뚱뚱해서 좀 보기 힘들다 이거 다른 환율 사이트나 여행 사이트는 무슨 어떤 형태로 쓰는지 확인좀 해봐
A안 Pretendard 800으로 가자

## 배경
- 지금 큰 제목 · 큰 숫자는 Gasoek One (`apps/web/src/app/layout.tsx` 의 `--font-gasoek-one` → tokens.css `--font-display`).
- 사용자가 너무 두꺼워 읽기 힘들다고 함. 조사 결과 국내 환율 · 여행 사이트(네이버 환율 · 마이리얼트립 · 트리플)는 Pretendard 700 을 씀.
- 사용자가 고른 안: **A. Pretendard 800, 자간 약 -0.03em**.

## 할 일
1. `--font-display` 를 Pretendard(굵기 800) 로 바꾼다. `pretendard` 패키지는 이미 의존성에 있음 (opengraph-image.tsx 가 사용). 자체 호스팅 유지 · 런타임 외부 요청 없이 (next/font/local 로 woff2 subset 또는 variable 파일 사용 권장 · 한글 용량 확인).
2. `font-display` 를 쓰는 곳(`font-normal` 로 박혀 있음: today-band · currency-detail · calc-result · converter 등 전부 grep)을 굵기 800 · 자간 -0.03em 정도로 맞춘다. 숫자는 tabular-nums 유지.
3. Gasoek One 은 쓰지 않으면 layout.tsx 에서 제거 (로고에 남길지는 화면 보고 판단 · 남기면 로고만).
4. 본문 IBM Plex Sans KR 은 그대로.
5. 제목 속 숫자 강조(노란 띠 · 비쌈 주홍)는 그대로 유지되는지 확인.
6. Figma 시안 색 · 배치는 바꾸지 않음. 글꼴만.
7. 레이아웃 깨짐 확인: 모바일 375 · 데스크톱 1440 에서 홈 · 통화 · 계산 · 여행 물가 화면.

## 규칙
- 새 작업 폴더(spec:new). PR 하나 · 커밋은 단계별 (테스트 먼저 → 구현 → 문서). 머지는 사용자가 "머지해" 한 뒤 rebase.
- PR #191 (task/0175-user-photos) 이 아직 머지 전. 그 브랜치 위에서 시작하고 PR base 는 그 브랜치로 (191 머지 후 main 으로 옮김).
- 밝은 화면만. 지구 · 비행기 3D 그대로. PR 에 캡처 올리지 않음.
- 공개 저장소: 개인 목적을 드러내는 단어 금지.
- 게이트 `bash .agents/checks.sh` PASS 후 미리보기 주소를 알려 줄 것.

