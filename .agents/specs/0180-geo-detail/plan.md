# 계획

## 무엇을 · 왜
- /geo 가 디자인 변경(작업 0170 · b677c8a "/geo 를 Figma 07 시안과 같게 — 시안에 없는 표 · 설명 뺌") 뒤 측정 수치 카드 4개만 남아, 예전의 자세한 기록(AI 답변 인용 · 질문별 결과 · 날마다 기록 · Search Console · 봇 방문 · 측정의 한계)이 사라졌다 (사용자: "엄청 간소화된 느낌 · 프롬프트가 안 나온다").
- 지금 화면(큰 제목 → 수치 카드 4개 → 읽는 법)은 그대로 두고, 그 아래에 "자세한 기록" 을 새 디자인(흰 카드 · 공통 토큰 · 밝은 화면만)으로 되살린다. 예전 내용: `git show 4a9d8b2^:apps/web/src/features/geo/components/geo-report.tsx` · `geo-page.tsx`.
- 자료는 지금 API 응답 그대로(계약 변경 없음) · 값이 없으면 빈 상태 글자 · 지어내지 않음.
- 담당: geo 한 명이 테스트까지 (features/geo 는 geo 범위 · Quick Loop).

## 애매한 곳
- 표가 375 에서 넘칠 수 있음 → 가로 스크롤 감싸기 또는 카드형 (담당 판단 · 페이지 가로 넘침은 없어야 함).
- 질문 24개 목록이 길다 → details 펼치기.

## 파일 계획
- .agents/specs/0180-geo-detail/**
- .agents/orchestration/TASKS.md
- apps/web/src/features/geo/**
- apps/web/src/app/geo/**
- apps/web/src/shared/**
- packages/ui/src/components/**
- apps/web/e2e/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] 단위 테스트: 각 기록 구간 · 빈 상태 글자 · 0170 의 "시안에 없는 표 없음" 기대를 이번 결정으로 고침
- [ ] LOOP=quick bash .agents/checks.sh PASS
- [ ] 미리보기 375 · 1440 에서 기록이 보이고 가로 넘침 없음 (lead)

## 허점
- 시안 맞춤(0170) 때 "시안에 없는 내용은 뺀다" 로 사용자가 보던 정보까지 지움 — 시안에 없는 기존 정보는 지우기 전에 사용자 확인이 필요했다.
