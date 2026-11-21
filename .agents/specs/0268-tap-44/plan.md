# 계획 — 작업 0268 · 휴대폰에서 누르는 자리를 44px 로 (Quick · 평소 PR · 시안 42 A안)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 휴대폰 폭에서 단추 · 칩 · 따로 선 링크의 **눌리는 영역만** 44px 이상으로 넓힌다. 보이는 모양 · 크기 · 위치는 그대로, 아래 내용이 밀리지 않고, 넓힌 영역끼리 겹치지 않는다(맞닿음은 됨).
- 대상 목록은 handoff.md "대상" 절. claude-desktop 이 잰 값이라 builder 가 먼저 사실 대조(실제 크기 측정)한다.

## 애매한 곳
- 방법은 builder 가 정한다 (예: 보이지 않는 덧칸 `::before`/`::after` 로 영역만 넓힘). (작업서)
- `window-month`(24px) 는 그대로. /geo · /log 제외. 넓은 화면 모양 · 글자 · 모서리 · 색 바꾸지 않음. (작업서)
- 넓히면 겹칠 수밖에 없는 곳이 나오면 멈추고 lead → claude-desktop 에 알린다. (작업서)
- 공용 부품(packages/ui)을 고쳐 화면 여러 곳에 적용될 수 있어 평소 PR(design 라벨 없음)로 둔다. "누르는 자리 44px 이상"은 기능 테스트. (가정 · 작업서 "테스트" 절)

- 여행 타이밍 그래프 범례 탭 3개(flights-graph.tsx)는 390px 에서 두 줄 · 줄 사이 8px 라 넓히면 4px 겹침 → 처음엔 뺐다가(claude-desktop 15:40Z), 사용자가 "4px 늘려서 맞춤"으로 정함 → 휴대폰 폭에서만 줄 사이 8 → 12px · 눌리는 영역 44px · 탭 모양 · 크기 · 글자 · 넓은 화면 그대로 · 가로 간격은 겹치지 않으면 그대로. (확인됨: handoff-legend.md)

## 누가
- builder — 사실 대조(390px 실제 크기) → 구현 · 단계별 커밋 · 푸시 → lead 보고
- test — 390px 에서 대상들의 눌리는 영역 ≥ 44px · 겹치지 않음 · 보이는 크기 그대로 기능 테스트(e2e) · 깨진 테스트 확인 · gate
- lead — 작업표 · PR · CI gate · ALL PASS 면 develop 머지 · claude-desktop 에 PR 번호

## 파일 계획
- packages/ui/src/** (로고 · 메뉴 버튼 · 칩 · 단추 부품 · tokens.css · 공용 유틸 클래스)
- apps/web/src/shared/** (메뉴 · 머리)
- apps/web/src/app/globals.css
- apps/web/src/features/home/**
- apps/web/src/features/travel-price/** (여행 타이밍 · 여행 물가 · flights-graph.tsx 범례 탭)
- apps/web/src/features/currencies/**
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · .agents/e2e-map.json (test)
- .agents/specs/0268-tap-44/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 390px 에서 대상 단추 · 칩 · 링크 눌리는 영역 높이(폭 44 미만이면 폭도) ≥ 44px
- [ ] 넓힌 영역끼리 겹치지 않음 · 보이는 크기 · 위치 · 아래 내용 그대로
- [ ] 값을 고정한 @design 테스트가 깨지면 claude-desktop 에 알림

## 허점
-
