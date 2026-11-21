# 작업서 — 읽기 전용 꼬리표를 네모 모양으로 (여행 타이밍 두 곳) (2026-11-21 밤 · claude-desktop → lead)

2차의 공-4(알약 모양 남용) 항목입니다. 디자인 PR · Quick. 이 파일의 "사용자 원문"을 request.md 에 그대로 고정합니다.

## 사용자 원문 (2026-11-21)
- (시안 35 · 36번을 보고) "35번은 그대로 두고 36번은 A안으로"

## 사용자가 본 시안
https://claude.ai/artifact/WcTnixQGpd3WyBw2GsXJw1 의 36번 A안. 그림: `.tmp/unslop-1121/mock/out10/img/pill-win2-now.jpg` · `pill-af2-now.jpg`(지금) · `pill-win2-a.jpg` · `pill-af2-a.jpg`(만들 모습).

## 규칙
- **알약 모양은 누를 수 있는 것에만** 씁니다(메뉴 · 도시 칩 · 범례 단추 · "다시 보기" 등 — 이번에 바꾸지 않음).
- **읽기만 하는 꼬리표는 모서리 6px 네모**로 둡니다.

## 이번에 바꾸는 곳 (사용자가 시안에서 본 두 곳만)
1. 여행 타이밍 창밖 카드의 꼬리표 `data-testid="window-tag"` ("11월 가장 쌈" 등) — `apps/web/src/features/travel-price/components/window-months.tsx` · `rounded-pill` → 모서리 6px. 색 · 크기 · 글 · 높이는 그대로.
2. 출발일 달력 탑승권의 꼬리표 `data-testid="airfare-tag"` ("가장 싼 출발" · "고른 출발" 등) — `airfare-calendar.css` 의 `.af-pass .tag` · 모서리 6px. 색 · 크기 · 글은 그대로.

## 이번에 바꾸지 않는 곳 (사용자에게 따로 물어볼 것 — 건드리지 않음)
- 판정 핀(`packages/ui/src/components/data/signal-pin.tsx`) · 직구 "면세 한도 안" 도장(`stamp.tsx`) · 물가 노선의 "한국 100 기준" 표시와 정거장 카드 판정 배지 · 노선 위 다음 정거장 이름표 · 물가 자의 한국 표시 · 그래프 안 최고 · 최저 이름표.
- 그래프 꾸밈(시안 35번)은 사용자가 그대로 두기로 했습니다.

## 끝나면
- PR 은 develop 으로. gate 가 통과하면 claude-desktop 에게 PR 번호만 알려 주십시오. 머지는 사용자가 "머지해"라고 한 뒤에 합니다.
