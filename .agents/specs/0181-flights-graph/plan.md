# 계획

## 무엇을 · 왜
- 홈 맨 위 여행 타이밍 · /flights 의 선 그래프(`flights-graph.tsx`)에 숫자가 없고, 세 선(국제항공료 · 해외단체여행비 · 원/달러 월평균)이 같은 굵기라 구분이 어렵다 (사용자: "가격이 없네 · 줄만 그어 놓은 것 같고 · 곡선 3개 구분이 잘 안 돼").
- 국제항공료를 주인공 선으로(굵기 3 · 나머지 굵기 2 · 옅게), 최저 · 최고 · 최근 값 라벨(통화 그래프 0175 와 같은 방식), 선 끝 이름 + 최근 값, 범례 눌러 강조(button · aria-pressed), 값과 무관한 가로 눈금선 제거 + "선마다 단위가 달라 모양만 비교합니다" 안내, 가로축 6개월 간격 눈금.
- 지수 기준 연도는 수집 코드 · 원자료에서 확인한 것만 쓰고, 모르면 "지수" 만 (지어내지 않음).
- 3D 비행기 · 노란 점 · 색 · 밝은 화면만은 그대로. 값이 없는 선은 그리지 않고 라벨도 없음.
- 담당: builder 한 명이 테스트까지 (Quick).

## 애매한 곳
- 휴대폰 375 에서 끝 라벨 공간이 없으면 끝 라벨 대신 범례 칩에 최근 값 (요청대로).
- 라벨 겹침 밀어내기는 0175 의 `placeExtremeLabels` 를 쓸 수 있으면 다시 씀.

## 파일 계획
- .agents/specs/0181-flights-graph/**
- .agents/orchestration/TASKS.md
- apps/web/src/features/travel-price/**
- apps/web/src/features/home/**
- apps/web/src/lib/**
- apps/web/src/shared/**
- packages/ui/src/components/**
- packages/ui/src/lib/**
- apps/web/e2e/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] 단위 테스트: 최저 · 최고 · 최근 라벨 값 = 데이터 · 없는 선은 라벨 없음 · 범례 강조 상태 · 눈금 간격
- [ ] LOOP=quick bash .agents/checks.sh PASS
- [ ] 미리보기 홈 · /flights 375 · 1440 에서 라벨이 잘리거나 겹치지 않음 (lead)

## 허점
- 0170 시안 맞춤 때 그래프를 "모양만" 보여 주도록 단순화하면서 숫자가 빠졌다 — 그래프에는 최소한 최저 · 최고 · 최근 값이 있어야 읽힌다.
