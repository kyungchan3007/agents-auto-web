# 계획

## 무엇을 · 왜
- 리뷰어가 보는 README 를 지금 상태로 맞춘다. 절 순서 · 머리 · 2×2 화면 표 · 표 모양은 그대로 두고 내용과 이미지만 바꾼다.
- 화면 이미지 4장을 다시 찍는다(1440×900). 홈 · 통화(USD) · 직구 계산은 운영 flapfx.com, 넷째 칸은 작업실이 어드민으로 옮겨져 어드민 "만드는 방식" 화면(로컬 개발 서버 · 개발 표시 가림)으로 바꾼다.
- 낡은 사실을 고친다: flapfx.com/log · /geo 링크(지금 어드민으로 301 · 전용 링크로만 열림) · 에이전트 네 자리 → 다섯 자리(data) · 어드민 Worker · 네이버 등록 · GA4 · 인스타 유입 측정 · 개인 도메인(11-17) · 워크플로 13개.
- 아키텍처 · GEO 흐름 그림 원본(svg)을 고치고 png 를 2배로 다시 그린다.

## 애매한 곳
- 넷째 칸 화면: 운영 어드민은 토큰이 있어야 열려 로컬 개발 서버로 찍음 (가정)
- 링크 줄: 어드민 주소는 적되 링크로 걸지 않음 — 눌러도 막는 화면만 보이므로 (가정)

## 파일 계획
- README.md
- docs/images/screens/*.png (workroom.png → admin.png)
- docs/images/architecture.png · docs/images/src/architecture.svg
- docs/images/geo-flow.png · docs/images/src/geo-flow.svg
- .agents/specs/0331-readme-refresh/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] README 의 링크 · 숫자가 운영 · 저장소와 맞음

## 허점
- 화면이 바뀌어도 README 이미지는 그대로 남아 11-15 화면이 일주일 넘게 걸려 있었다. 메뉴 · 주소가 옮겨질 때(0302) README 링크도 함께 확인했어야 했다.
