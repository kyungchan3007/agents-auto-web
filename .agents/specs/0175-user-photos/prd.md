# PRD — 무엇을 · 왜 (0175 화면별 사진)

> 요청 원문: [request.md](request.md) · 사용자가 확인한 초안: `/Users/chan/Documents/develop/harness-auto-web/.tmp/user-photos/draft.html` (사진: 같은 폴더 `*.webp`)

## 문제
- 사용자가 사이트에 쓸 사진 5장을 직접 만들어 왔고, 초안을 보고 "좋아"라고 확인했다. 지금 각 화면 맨 위는 글자뿐이라 여행 사이트의 느낌이 약하다.

## 요구사항
- P1 화면 맨 위 구간(큰 제목 · 설명)을 사진 배경 위에 — 초안대로
  - 홈 "여행 타이밍" ← window-fjord · /flights ← window-sunrise · /prices ← swiss-traveler · /calc ← plane-below(울트라마린 막 + 흰 글자) · /about ← plane-sunset
  - 밝은 막: 사진 왼쪽(모바일은 아래쪽)을 하늘 종이색 그라데이션으로 덮어 큰 제목이 읽히게
- P2 큰 제목 글꼴 · 색 · 크기는 지금 규칙 그대로 (큰 제목만 Gasoek One · 0173)
- P3 그 아래 구간(그래프 · 목록 · 입력 등)은 그대로 · 홈의 국제항공료 그래프와 선 위의 3D 비행기도 그대로
- P4 작업실 · 통화 · GEO 측정에는 사진 없음
- P5 성능: 화면 폭에 맞춘 크기(WebP)로 · 첫 화면 사진만 우선 불러오기 · 나머지는 지연 불러오기
- P6 글자 대비 기준(contrast) 지킴 — 막 위 글자 기준
- P7 공유 미리보기(OG): plane-sunset 을 1200×630 으로 잘라 대표 이미지 · 지금 opengraph-image 생성 방식과 맞춤
- P8 다크 모드 없음 (밝은 화면 하나)
- P9 사진은 사용자가 직접 만든 것 — 출처 표시 불필요

## 성공 기준
- 초안과 같은 배치 (초안 · 구현 캡처 나란히) · `checks.sh` (Full) PASS
