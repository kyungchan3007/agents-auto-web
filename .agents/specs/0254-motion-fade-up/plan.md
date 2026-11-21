# 계획 — 작업 0254 · 스크롤할 때 제목 · 글 · 카드가 페이드 업으로 나타남 (Quick · 디자인 PR 목표)

요구 · 기준 원본: [handoff.md](handoff.md) (움직임 값 · 순서 · 대상 페이지 · 지킬 것 그대로).

## 무엇을
- 첫 화면 아래 구간이 화면에 들어올 때 한 번: 불투명도 0 → 1 · 아래 28px → 제자리 · 0.7초 · cubic-bezier(.22,1,.36,1) · 구간 안에서 라벨 → 큰 제목 → 설명 → 칩 · 단추 → 카드 · 표 · 그래프 순으로 0.09초씩 늦춤
- 대상: 홈 · 여행 타이밍 · 오늘 환율 · 통화(목록 · 상세) · 여행 물가 · 직구 계산 · 소개. /log · /geo · /design · 각 페이지 머리는 제외
- 더하기만 · 이미 들어오는 움직임이 있는 덩어리에는 겹쳐 넣지 않음 · 움직임 줄이기는 바로 · 자리 밀림 없음 · 물가 노선 스크롤 계산 안 어긋남 · 서버 첫 그림은 제자리(자바스크립트 없어도 보임)

## 결정 (lead)
- **루프 Quick.** 페이지가 여러 개라 파일이 10개를 넘을 수 있지만, 화면에만 더하는 변경이고 계약 · 경계가 바뀌지 않는다(작은 화면 수정은 Quick 이라는 사용자 운영 방침). 넘으면 이 줄을 근거로 둔다.
- **디자인 PR 목표:** `packages/ui/src/components/motion/**`(부품) · 각 기능의 `components/**` · `app/**` 화면 코드만 바꾼다. `hooks/` · `lib/` 를 바꾸게 되면 평소 PR 이 된다 — 보고에 적는다. 부품 안의 관찰 로직은 packages/ui 부품 안에 둔다(0252 pick-trip 과 같은 방식).
- **열린 PR 과 겹침:** #301(travel-price price-page · price-route · window-months · import-calc calc-form) · #302(pick-trip · airfare-calendar) · #303(home ticket · use-picked-destination) 의 파일은 되도록 건드리지 않는다(구간을 감싸는 상위 파일에서 처리). 꼭 필요하면 보고에 적고, 먼저 머지된 쪽 위로 lead 가 rebase 를 맡긴다.
- 머리 제목 밑줄 움직임(시안 28번)은 넣지 않는다.
- 한 커밋 = 한 단계(부품 → 페이지 묶음별).

## 누가
- builder — 부품 · 페이지 적용 · 단계별 커밋 · 푸시
- test — 표시 없는 e2e 가 "보인다"에서 움직임 중이라 깨지면 끝나기를 기다리게 · 로컬 확인 · 보고
- lead — PR(`design` 라벨 · 판정 확인 뒤) · CI gate · 회신

## 파일 계획
- packages/ui/src/components/motion/** (slide-in.tsx 늘리기 또는 새 부품)
- apps/web/src/features/{home,travel-price,fx,currencies,import-calc,about}/components/** (구간 감싸기 · 위 열린 PR 파일은 되도록 제외)
- apps/web/src/app/**/page.tsx (구간이 페이지 파일에 있으면)
- apps/web/e2e/** · **/*.test.ts(x) (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0254-motion-fade-up/** · .agents/orchestration/TASKS.md
