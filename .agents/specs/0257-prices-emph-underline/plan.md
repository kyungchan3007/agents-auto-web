# 계획 — 작업 0257 · 여행 물가 머리 숫자에 가는 밑줄 강조 + 그어지는 움직임 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 30 B안).

## 무엇을
- 여행 물가 머리 제목의 파랑 바탕 강조(노란 글자) 아래에 가는 노란 밑줄(글자 높이 82~90% · `--hav-sun` · 글자 폭 · 줄마다)
- 0.35초 뒤 0.6초에 걸쳐 왼→오 그어짐 — 0255 와 같은 값 · 방식(emph-sweep). 움직임 줄이기 · JS 없음이면 처음부터 그어짐
- 여행지를 고른 뒤 바뀌는 제목 숫자에도 같은 강조 · 다시 그을지는 builder 판단 · 깜빡임 없음

## 결정 (lead)
- **범위는 여행 물가 머리만.** emph.tsx 에 선택 값(예: `underline`)을 더해 prices-header 에서만 켠다. 다른 `bg="sea"` 사용처 · 여행 타이밍 머리는 그대로.
- 화면 부품 · 화면 파일만 → 디자인 PR(`design` 라벨).

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 표시 없는 테스트가 깨질 때만 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- packages/ui/src/components/text/emph.tsx
- packages/ui/src/tokens.css (필요하면)
- apps/web/src/features/travel-price/components/prices-header.tsx
- **/*.test.ts(x) · apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0257-prices-emph-underline/** · .agents/orchestration/TASKS.md
