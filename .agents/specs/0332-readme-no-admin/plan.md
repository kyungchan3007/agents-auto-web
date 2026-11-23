# 계획

## 무엇을 · 왜
- README 화면 표 넷째 칸의 어드민 화면(작업 0331)을 운영 사이트 "여행 타이밍"(/flights) 화면으로 바꾼다. 어드민은 전용 링크로만 여는데 README 에 화면을 보여 주면 안 된다.
- 어드민 화면 이미지 파일을 저장소에서 지운다.

## 애매한 곳
- 넷째 칸 화면: 여행 타이밍과 여행 물가 중 여행 타이밍 (가정)

## 파일 계획
- README.md
- docs/images/screens/admin.png (삭제) · docs/images/screens/flights.png (새로)
- .agents/specs/0332-readme-no-admin/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] README 이미지가 모두 운영 사이트 화면

## 허점
- 0331 에서 토큰으로 막은 화면을 공개 README 에 실었다. 막아 둔 화면은 공개 문서에 싣지 않는다.
