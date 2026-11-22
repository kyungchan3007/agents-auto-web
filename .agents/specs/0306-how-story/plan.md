# 계획 (Quick)

> 요청 원문: [request.md](request.md)

## 목표 (시안 Version 10 그대로 · 만드는 방식 /how)
- 숫자 아래 세 칸: 데이터 흐름 · 상태 관리 · 에이전트 최적화 (구조 세 줄 · 근거 링크)
- 검색 · 자동완성 칸: 찾는 범위 · 순위 다섯 단계 · 설계(서버 없이 계산 · WAI-ARIA 콤보박스 · 결과 없음 겹쳐 띄움 · 어드민 초성) + 직접 써 보는 예시 — 사이트의 실제 검색 함수(@hav/shared/currency-search)와 실제 통화 목록으로
- 맨 끝(궁금한 것 뒤) 시행착오 14개: 날짜순 · 종류로 골라 보기 · 펼치면 무슨 일 · 원인 · 바꾼 것 · 결과 · 근거 · 해결 중 표시 · 찾기 창에서 찾음
- "사람이 한 일" 소개 칸 · "사용자에게 영어로 답함" 항목은 넣지 않음(사용자)

## 작업 종류 (team.md test 절)
- 새 동작(예시 검색 · 골라 보기 · 펼치기) → 요구마다 기능 테스트: 단위(예시 검색 순위 글) · e2e(admin.spec)

## 파일 계획
- apps/web/src/features/how/** (lib/story.ts · lib/search-demo.ts(+test) · hooks/use-trials.ts · use-search-demo.ts · components/how-focus.tsx · how-search.tsx · how-trials.tsx · how-page.tsx · how.css)
- apps/web/e2e/admin.spec.ts
- .agents/specs/0306-how-story/**

## 계획 밖 변경 이유
