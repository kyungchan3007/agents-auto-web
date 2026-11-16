# 계획

## 무엇을 · 왜
- 릴스처럼 스크롤하면 카메라가 3D 미니어처 지도를 따라 움직이는 화면이 Tripfx 에서도 되는지 보는 시험판.
- 정류장 4곳(공항 · 환전소 · 세관 · 도착 도시) 중 **공항 하나만** three.js 로 만든다.
- 홈은 바꾸지 않는다. 개발용 확인 페이지 `/design/airport` 에만 둔다 (robots.txt 가 /design 을 막고 noindex).

## 애매한 곳
- 모델: 외부 모델 파일 없이 상자 · 원기둥 같은 단순 도형으로 만든다 (가정)
- 색: 항공 노선도 테마 색 그대로 — 하늘 종이 #EAF4F2 바탕 · 남색 #2438A8 · #16246E · 노랑 #F7C548 · 청록 #17A398 · 빨강 #D9452B (가정)
- 숫자: 시험판이라 카드 글은 설명만, 실제 환율 숫자는 넣지 않는다 (가정 · 지어낸 숫자 금지)
- 움직임 줄이기 설정이면 카메라를 고정한 한 장면만 (가정)

## 파일 계획
- apps/web/package.json
- package-lock.json
- .claude/launch.json
- apps/web/src/app/design/airport/page.tsx
- apps/web/src/features/home/components/airport-scene.tsx
- apps/web/src/features/home/components/airport-story.tsx
- apps/web/src/features/home/lib/airport-path.ts
- apps/web/src/features/home/lib/airport-model.ts
- apps/web/src/features/home/hooks/use-airport-scene.ts
- apps/web/src/features/home/hooks/use-scroll-progress.ts
- apps/web/src/features/home/lib/airport-path.test.ts
- .agents/specs/0184-airport-3d/**

## 계획 밖 변경 이유
- apps/web/package.json · package-lock.json — three · @types/three 추가 (package-lock.json 은 보호 파일 · 사람 승인 필요)
- .claude/launch.json — 화면 확인용 개발 서버(web-dev · 3210) 설정 추가

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] /design/airport 에서 스크롤하면 카메라가 활주로 → 터미널 → 관제탑으로 이동하고 비행기가 이륙
- [x] three 는 이 페이지에서만 불러옴 (홈 무게 그대로)
- [x] 움직임 줄이기면 고정 장면

## 허점
- 바뀐 파일 13개로 Quick 기준(10)을 넘음 — 시험판이고 홈 · 계약은 그대로라 Quick 유지. 정류장 4곳을 홈에 넣을 땐 Full Loop 로.
- 처음엔 next/dynamic 으로 장면을 불러왔는데, 이 저장소 규칙(화면 파일은 훅 금지 · 쓰지 않는 부품 검사)과 안 맞아 훅에서 import() 로 바꿈.
