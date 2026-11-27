# 계획

## 무엇을 · 왜
- 홈: hero 캐러셀 맨 아래(알약 · ‹ › 아래)에 흐르는 환율 띠를 더함(52px · 모바일 44px · 바탕은 지금 장 바탕 · 위 1px 흰 15% 선 · 빼거나 옮기는 것 없음).
- 홈 밖 모든 페이지(통화 · 통화 상세 · 여행 물가 · 나라 물가 · 직구 계산 · 항공권 · 소개 · 404): 같은 띠를 화면 바닥 고정(position fixed · bottom 0 · safe-area) · 48px · 모바일 42px · 바탕 rgba(24,36,100,.36) + blur(16px) saturate(160%) + 위 1px rgba(255,255,255,.22) · 글자 흰색 + 아주 옅은 그림자 · 대비 4.5 미만이면 투명도 .36 → .42 안에서 조정하고 claude-desktop 에 알림 · 띠 높이만큼 페이지 아래 여백을 처음부터(바닥 출처 띠 · 마지막 내용 안 가림 · 붙을 때 위치 안 움직임) · 메뉴 · 시트 · 고르기 목록이 띠 위.
- 항목: 국기 · 통화 이름(홈 도착지 목록과 같은 이름) · 오늘 금액(도착지 목록과 같은 금액 규칙 · 같은 함수 공통) · 신호 점과 글(낮음 · 보통 · 높음 · 사이트 신호 규칙 · 어두운 면 토큰). 순서: 엔 · 달러 · 유로 · 바트 · 싱가포르 달러 · 파운드 · 홍콩 달러 · 호주 달러 · 위안 · 캐나다 달러 → 나머지 코드 순. 왼쪽 고정 라벨 '오늘 환율 · M.DD 기준'(모바일 '오늘 환율') · 날짜는 latest.date.
- 움직임: 같은 줄 두 번 이어 왼쪽으로 약 40px/초 · 마우스 · 초점이면 멈춤 · 밀면 그 자리 멈춤 · 움직임 줄이기 · JS 꺼짐 = 흐르지 않고 가로 스크롤 · 화면 읽기에는 한 목록만(복사본 aria-hidden) · 누르면 /currencies/{코드}.
- 자료: 새 API 없음 · 홈은 이미 받는 latest · signals · 다른 페이지는 각 페이지가 빌드 때 받는 값(없으면 latest · signals 를 그 페이지 page.tsx 에서 받음 · 응답 캐시로 D1 부담 없음) · 환율 없는 통화는 뺌 · 신호 없으면 금액만 · 하나도 없으면 띠 없음 · 지어내지 않음.

## 파일 계획
- builder: apps/web/src/features/ticker/** 또는 apps/web/src/shared/ticker/**(두 곳 이상에서 쓰므로 shared · rate-ticker.tsx 그리기 · use-rate-ticker.ts 상태 · ticker.ts 순서 · 금액 · 항목 · ticker.css) · 금액 글 공통화(home/common 의 함수를 shared 로) · apps/web/src/features/home/carousel/hero-carousel.tsx · home.tsx · 홈 밖 페이지에 바닥 띠를 붙일 곳(app/layout 또는 각 page · 공통 바닥 여백) · packages/ui/src/tokens.css(필요한 토큰만)
- test: ticker 단위(순서 · 금액 · 예외) · apps/web/e2e/rate-ticker.spec.ts(새로 · e2e-map) · resp-audit 가 띠 때문에 깨지지 않는지 · 시안과 같은 구도 캡처(1440 · 390)
- .agents/specs/0399-rate-ticker/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/src/app/layout.tsx: 홈 밖 모든 화면에 바닥 고정 띠를 붙이려고 layout 이 latest · signals 를 받아 FixedTicker 를 그림(홈 '/' 은 안 그림 · 서버 첫 그림부터).
- currencyListName 에 GBP '영국 파운드' 추가(시안 이름): 통화 상세 머리 국기 줄 · 통화 둘러보기 목록 · 다른 나라 통화 목록 부제에도 같이 바뀜(나라 물가 단위 글은 '파운드' 그대로).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지까지(main · 릴리스는 사용자가 말할 때) · 미리보기 주소(최신 커밋 빌드 확인 뒤)와 볼 경로를 claude-desktop 에

## 허점
- 바닥 띠 흰 글자 대비: 흰 본문 위 2.1~2.5(.36~.42) · 파란 머리 위 3.4~3.6 — 4.5 미달. 작업서 허용 최대 .42 적용 · 4.5 는 약 .65 이상이라 사용자의 '조금 더 밝게'와 반대 → 사용자 결정 대기(토큰 --hav-ticker-glass-bg 하나만 바꾸면 됨).
- resp-audit 전체는 이 작업에서 바꾼 spec 이 아니라 로컬 가드로 못 돌림 · develop PR CI 에도 e2e 없음 → 다음 main 전체 e2e 에서 확인.
