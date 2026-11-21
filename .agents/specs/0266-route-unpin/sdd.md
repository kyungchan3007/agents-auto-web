# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- `hooks/use-price-route.ts`: 스크롤 진행(routeFrame · 구간 높이 계산 · 스크롤 리스너)을 걷어 내고 "고른 정거장 번호" 상태 하나로. 단추가 번호를 바꾸면 기존 이동 움직임(비행기 · 카드 넘어가기 · usePlaneFlip 의 같은 값 제자리)을 그대로 쓴다.
- `components/price-route.tsx`: sticky · 높이(--route-* 로 만든 2.2장) 제거 · 단추 줄을 모든 폭에서 보이게(휴대폰은 가로 스크롤 · overflow-x-auto 를 줄 안에만) · 제목 · 설명 · aria-label · 카드 감싸는 칸의 아래 테두리 잘림 해결(아래 1px 여유) · 아래 구간 간격.
- `globals.css`: 쓰지 않게 된 `--route-*` 정리.
- `lib/price-route.ts`: 스크롤용 순수 함수(routeFrame 등)는 쓰는 곳이 없어지면 지운다 — 단위 테스트도 test 가 함께 정리.

## 대안 · 트레이드오프
- 스크롤 고정을 유지하고 길이만 줄이기 — 사용자가 시안 40 "고정을 푼 모습"을 골라 제외.

## 파일 계획
- apps/web/src/features/travel-price/components/price-route.tsx
- apps/web/src/features/travel-price/components/price-page.tsx (아래 구간 간격이 여기 있으면)
- apps/web/src/features/travel-price/hooks/use-price-route.ts
- apps/web/src/features/travel-price/lib/price-route.ts (스크롤용 함수 정리)
- apps/web/src/app/globals.css (--route-* 정리)
- apps/web/src/features/travel-price/**/*.test.ts(x) · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0266-route-unpin/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 열린 #316(0264)이 price-route.tsx 꼬리표 클래스 세 줄을 바꿈 → 먼저 머지되는 쪽 위로 다시 맞춤.
- 위치를 재는 e2e 가 페이드 업 뒤 흔들리는 허점(0260 trace) — 새 테스트는 최종 배치를 기다리게.

## 검증 계획
- 단위: 고른 번호 상태 · 같은 값 제자리 유지
- e2e: 스크롤해도 정거장 그대로 · 단추로 바뀜 · 처음 첫 정거장 · 휴대폰 단추 줄 · 가로 넘침 없음 · 제목 · aria-label · 간격 96/72 · 카드 아래 테두리 보임 · JS 없이 첫 카드
- CI gate(평소 PR)

## 계획과 달라진 점
