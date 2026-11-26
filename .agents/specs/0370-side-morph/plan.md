# 계획

## 무엇을 · 왜
- 사이드바 여는 모션 3안(면이 떠오르며): 늘어나는 상자의 outline(남색 네모 테두리)을 없애고 겉모습만 바꾼다. 열 때 옅은 남색 바탕(#eef0f9) → 45% 지점 떠오른 그림자(0 22px 48px rgba(22,36,110,.20)) · 바탕 #f6f7fc → 끝은 흰 바탕(bg-card) · 경계 그림자. 닫을 때는 반대.
- 늘어나는 움직임 · 크기 · 위치 · 곡선 cubic-bezier(.7,0,.25,1) · 열기 0.68초 / 닫기 0.56초 · 글 사라짐 · 머리 · 줄 차례 · 국기 날아가기(0366) · 닫은 뒤 튐 · 본문 밀어내기 · 시트 덮개는 그대로.
- 열린 뒤 경계: 넓은 화면 사이드바 왼쪽 그림자 -14px 0 36px rgba(22,36,110,.11) · 바텀 시트 위쪽 그림자 0 -14px 36px rgba(22,36,110,.12). 디자인 토큰으로 두고 움직임 끝 값과 같게 해서 툭 바뀌지 않게. 시작 요소가 없을 때(밀려 들어옴)와 움직임 줄이기에서도 그림자는 남음.
- 공통 부품이라 여행 물가 나라 사이드바 · 노선 카드 "자세히 보기" · 통화 상세 "다른 나라 통화 보기"가 함께 바뀐다. 1440 · 900(바텀 시트) · 375.
- 작업 종류 ②(모양 · 움직임): 새 테스트 없음. outline 값을 확인하던 테스트가 있으면 바뀐 겉모습에 맞게 고친다.
- 순서: builder 구현 → test 테스트 손보기 · 확인.

## 애매한 곳
- 900 폭은 바텀 시트라 위쪽 그림자 (확인됨: 작업서)

## 파일 계획
- packages/ui/src/lib/side-panel/side-panel-motion.ts
- packages/ui/src/components/layout/side-panel.tsx
- packages/ui/src/tokens.css
- .changeset/*.md (patch)
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0370-side-morph/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] develop 머지까지 · main 반영은 사용자가 말할 때
- [ ] 미리보기 주소는 그 커밋 빌드가 끝난 것을 확인한 뒤 회신

## 허점
- 첫 gate 실패(2dcb4e99): no-raw-color(모션 파일에 색 · 그림자 숫자 직접 씀 → 토큰으로) · redesign-foundation R9(공통 컴포넌트 그림자 금지 → side-panel.tsx 를 SHADOW_OK 예외에 추가 · 사용자 요청 "경계 구분" · 작업 0250 팝업 그림자와 같은 근거). 작업서에 쓴 그림자 값이 기존 그림자 금지 규칙과 부딪힌다는 것을 배정 전에 보지 못함.
