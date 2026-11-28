# 계획

## 무엇을 · 왜
- 홈 밖 화면 바닥 고정 환율 띠(.rt[data-variant="fixed"])를 사용자가 확정한 시안(Version 8 · .tmp/ticker-style/zoom-*.png)대로 다듬음: 더 밝게 · 경계 아주 옅게 · 글자 작게 · 신호 세 색 알약 · 금액 흰색.
- 홈 hero 띠(data-variant="hero")는 그대로.

## 바꿀 것 (작업서 그대로) — `.rt[data-variant="fixed"]` (홈 hero 띠는 그대로)
- 바탕: `rgba(24,36,100,.18)` · 뒤 흐림 유지 `blur(16px) saturate(160%)` (-webkit- 같이).
- 경계: 윗선 `1px solid rgba(22,36,110,.09)` · 그림자 `0 -6px 18px rgba(22,36,110,.06)` · 위 가장자리 흐려지게(mask) 없음.
- 글자 그림자(text-shadow) 없음.
- 높이: 넓은 화면 40px · 휴대폰 38px (+ safe-area). 아래 여백(spacer)도 같이.
- 글자:
  - "오늘 환율 · 날짜" 라벨: 테두리 · 바탕 없음(노란 점 + 글자만) · 12px · 남색 #16246E.
  - 통화 이름: 12.5px · 굵기 500 · 남색 #16246E.
  - 환율 금액: 13px · 굵기 700 · **흰색 #FFFFFF** (사용자 선택 · 흰 본문 위에서 대비가 낮음을 알고 고름).
  - 국기: 지금의 85% 크기.
- 신호(낮음 · 보통 · 높음) — 서로 다른 색 알약 · 12px · 굵기 700 · 안쪽 여백 1px 7px · 둥근 알약:
  - 낮음: 글자 #05502A · 바탕 #D7F0E0
  - 보통: 글자 #3F4350 · 바탕 #E6E8EF
  - 높음: 글자 #8A1A14 · 바탕 #FBE0DB
  - 점(i)도 글자색. 이 색은 띠 전용 토큰으로(사이트 신호 토큰은 그대로).
- 값은 토큰(tokens.css)으로 · 하드코딩 금지.

## 테스트 (test)
- 홈 밖 페이지: 띠 높이 40/38 · 윗선 · 신호 세 색이 서로 다름(낮음 · 보통 · 높음 글자색 · 바탕색 서로 다름) · 라벨 테두리 없음 · 글자 12px 이상(min-12 검사 통과).
- 홈 hero 띠는 바뀌지 않음.
- 반응형 점검(0398 e2e) · 겹침 · 가로 스크롤 그대로 통과.
- 글자 대비는 기록만(흰 금액은 사용자 선택).

## 파일 계획
- builder: apps/web/src/shared/ticker/ticker.css · packages/ui/src/tokens.css(--hav-ticker-* 띠 전용 토큰만) · 필요하면 apps/web/src/shared/ticker/rate-ticker.tsx(신호 알약 표시용 속성만)
- test: apps/web/e2e/rate-ticker.spec.ts(바닥 띠 검사 추가) · 필요하면 ticker 단위 테스트
- .agents/specs/0400-ticker-style/** · .agents/orchestration/TASKS.md

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지까지(main · 릴리스는 사용자가 말할 때) · 미리보기 주소(최신 빌드 확인 뒤)와 볼 경로를 claude-desktop 에

## 허점
