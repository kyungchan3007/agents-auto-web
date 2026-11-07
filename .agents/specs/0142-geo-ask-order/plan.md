# 계획

## 무엇을 · 왜
- 측정 페이지의 "질문별 결과" 표를 질문 목록(questions.ts) 순서대로 보여 준다
- 지금은 저장 키 문자열 순이라 g10 이 g2 앞에 온다 (2026-11-07 첫 측정에서 확인)

## 애매한 곳
- 정렬은 API 요약(answersSummary)에서 한다 (가정 · 화면은 받은 순서대로 그림)

## 파일 계획
- apps/api/src/features/geo/**
- .agents/specs/0142-geo-ask-order/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 운영 /geo 질문별 결과가 Tripfx … 직구 타이밍 순서

## 허점
- 작업 0141 테스트가 세 질문(g1 · g2 · g3)만 써서 두 자리 번호 정렬을 잡지 못했다
