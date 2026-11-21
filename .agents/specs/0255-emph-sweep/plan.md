# 계획 — 작업 0255 · 머리 제목 밑줄 강조가 그어지는 움직임 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md).

## 무엇을
- `emph.tsx` 의 흰 바탕 강조(노란 띠): 화면이 뜨고 0.35초 뒤 왼쪽 → 오른쪽으로 0.6초(background-size 0% → 100% · cubic-bezier(.22,1,.36,1)). 끝난 모습은 지금과 같음. 한 번만 · 움직임 줄이기는 처음부터 그어짐 · 자바스크립트 없어도 띠가 보임
- 띠 모양(굵기 · 위치 64~90% · 색 · 글자 폭)은 그대로. 파랑 · 주홍 강조는 그대로

## 결정 (lead)
- 0254(페이드 업)와 묶지 않는다 — 한 파일 · 독립이라 먼저 머지될 수 있게. builder 는 0254 다음에.
- CSS 만으로(애니메이션 · `prefers-reduced-motion`) 처리 → 디자인 PR. 자바스크립트 없이도 끝 모습이 보이게(애니메이션이 못 돌면 100%).

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 띠 모양을 보는 테스트가 움직임 도중 값을 읽어 깨지면 끝난 뒤 값을 보게 · 보고
- lead — PR(`design` 라벨) · CI gate · 회신

## 파일 계획
- packages/ui/src/components/text/emph.tsx
- (필요하면) packages/ui/src/tokens.css 또는 같은 폴더의 css
- **/*.test.ts(x) · apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0255-emph-sweep/** · .agents/orchestration/TASKS.md
