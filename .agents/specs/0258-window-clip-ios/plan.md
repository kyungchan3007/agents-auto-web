# 계획 — 작업 0258 · 패치(버그): 아이폰에서 창밖 풍경이 창 모양으로 잘리지 않음 (Quick)

요구 · 기준 원본: [handoff.md](handoff.md).

## 무엇을
- /flights "창밖으로 보는 12달"의 `window-view` 가 사파리 계열(WebKit)에서 둥근 창 모양으로 자르지 못하는 버그를 고친다.
- 자르는 칸에 둥근 모양을 직접 지정(`clip-path: inset(0 round …)` 또는 `-webkit-mask-image`) 또는 자체 합성 층(`translateZ(0)`) — 재현 결과를 보고 택일. 모양 · 크기 · 움직임은 그대로.
- 같은 방식으로 자르는 다른 곳(둥근 칸 안의 캔버스 · 움직이는 층)도 함께 본다.

## 결정 (lead)
- builder(수정)와 test(WebKit 재현)를 나란히 진행한다. test 는 playwright webkit 으로 재현 · 확인할 수 있는지 먼저 보고, 되면 수정 전 · 뒤 캡처와 결과를 보고한다. 안 되면 그 사실을 PR 에 적는다(사용자가 아이폰으로 직접 확인).
- 화면 파일만 바꾸면 `design` 라벨(동작 변경 없음). PR 제목은 "작업 0258: 패치(버그) — …".

## 누가
- builder — 수정 한 커밋 · 푸시
- test — WebKit 재현 · 확인 · 깨진 테스트 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/travel-price/components/window-months.tsx
- (같은 방식으로 자르는 곳이 있으면) 해당 components 파일 · 보고에 적음
- apps/web/e2e/** (test)
- .agents/specs/0258-window-clip-ios/** · .agents/orchestration/TASKS.md
