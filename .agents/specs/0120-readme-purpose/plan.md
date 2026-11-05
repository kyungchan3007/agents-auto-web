# 계획

## 무엇을 · 왜
- README 를 처음 보는 사람 기준으로 줄임 · 취지 · 역할 · 스크린샷 · 방문 통계 · 패치 흐름 추가 · 틀린 문장("페이지를 열어도 D1 을 읽지 않음") 수정
- 소개 페이지 "누가 만드나요" 를 같은 뜻으로
- 홈 환율이 소수 둘째 자리면 1280px 에서 "원" 이 다음 줄로 떨어지던 것 고침 (스크린샷에서 발견)
- 측정 문서의 "재서" 를 "측정해" 로

## 애매한 곳
- 취지 문장은 "증명" 대신 "확인" — 아직 측정값이 없어 결과가 정해진 것처럼 읽히지 않게 (가정 · 사용자에게 알림)

## 파일 계획
- README.md · docs/images/**
- apps/web/src/features/about/about-page.tsx
- apps/web/src/features/home/home.tsx
- docs/geo-measurement.md
- .agents/specs/0120-readme-purpose/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 운영에서 소개 문구 · 홈 한 줄 확인

## 허점
- 환율 소수 자릿수가 바뀌면 줄바꿈이 달라지는데 반응형 점검은 가로 넘침만 봄
