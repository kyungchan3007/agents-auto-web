# 계획 — 작업 0233 · 패치(버그): 메뉴 "오늘 환율"이 환전 타이밍 구역으로 (Quick Loop)

## 무엇을 · 왜
- 메뉴 "오늘 환율"(`/#today`)이 홈 탑승권 카드(`id="today"`)로 가고, 구역 맨 위가 고정 메뉴 뒤에 숨는다. 사용자가 가리킨 자리는 라벨 "오늘 환율" · 제목 "도착지별 환전 타이밍" 구역(`id="destinations"`)이다.
- 결정 (lead · 가정): **`#today` 라는 이름을 "오늘 환율" 구역으로 옮긴다.** 링크 주소 `/#today` 는 그대로 둔다.
  - 이유: 메뉴 · 바깥에 퍼진 `/#today` 주소가 모두 맞는 자리로 가는 방법이 이것 하나다. 링크만 `/#destinations` 로 바꾸면 옛 주소가 계속 탑승권으로 간다.
  - 구역 이름이 화면 라벨("오늘 환율")과 같아진다.

## 바뀌는 것 (builder)
1. `destinations-section.tsx`: section `id="destinations"` → `id="today"` · 고정 메뉴 높이만큼 스크롤 여백 `scroll-mt-(--hav-nav-h)` 추가. `aria-labelledby="destinations-title"` 은 그대로.
2. `ticket.tsx`: section `id="today"` → `id="board"`. `today-title`(h2 id) · aria-labelledby 는 그대로(이름만 남는 것 · 동작 같음).
3. 요약 알약(작업 0228 · `use-destinations-pill.ts`): 주소가 `#today` 로 들어오면 **접지 않는다**(처음부터 펼친 카드 = state "final"). 접힌 채 도착하거나, 펼치면서 도착 위치가 밀리지 않게.
   - 같은 홈에서 메뉴를 다시 눌러 hash 만 바뀌는 경우(`hashchange`)에도 접힌 상태면 바로 펼친다.
4. 주석 갱신: `site-nav.tsx:3`("홈 바다 띠(id=today)로" → 환전 타이밍 구역) · `intro/lib/entry.ts` · `intro/hooks/use-intro-enabled.ts` 주석은 그대로 맞음(동작 변화 없음 — `/#today` 는 계속 "위치 링크로 들어옴").

## 바뀌는 것 (test · 먼저)
- 새 e2e: 세 경로(다른 페이지에서 메뉴 · 홈에서 메뉴 · 주소 `/#today` 로 바로) × 1280 · 390
  - 도착 뒤 "도착지별 환전 타이밍" 제목(`#destinations-title`)이 화면 안 · 고정 메뉴 아래(제목 top ≥ 메뉴 bottom)
  - 환전 타이밍 카드가 접힌 알약이 아니라 펼친 상태 · 0.3초 뒤와 2초 뒤 제목 위치 차이가 작음(밀리지 않음)
- 기존 선택자 바꾸기: 탑승권을 `#today` 로 찾던 곳 → `#board` · `#destinations` → `#today`
  - e2e: country-pick · intro · home · home-design · emphasis · light-only · flap-board
  - 단위: shared/home-redesign.test.ts · shared/home-flap-board.test.ts · redesign-foundation.test.ts(링크 `/#today` 는 그대로라 아마 그대로)
  - intro.spec "'오늘 환율'(/#today)로 오면 인트로 없이 그 위치" → 그 위치 = 환전 타이밍 구역
- 지금 코드에서 새 e2e 가 FAIL 하는지 먼저 확인 → "테스트 먼저" 커밋.

## 애매한 곳
- 탑승권 카드의 새 id 이름 `board` (가정 · lead)
- 탑승권 h2 id `today-title` 은 이름을 안 바꿈 (가정 · 바꿀 이유가 동작에 없음 · 테스트 손댈 곳만 늘어남)

## 파일 계획
- apps/web/src/features/home/components/destinations-section.tsx
- apps/web/src/features/home/components/ticket.tsx
- apps/web/src/features/home/hooks/use-destinations-pill.ts
- apps/web/src/features/home/components/destinations-pill.tsx (알약 쪽에서 상태를 받아야 하면)
- apps/web/src/shared/site-nav.tsx (주석)
- apps/web/src/shared/*.test.ts · apps/web/src/features/home/**/*.test.ts
- apps/web/e2e/**
- .agents/specs/0233-today-anchor/** · .agents/orchestration/TASKS.md

## 계속 맞아야 하는 것
- 인트로: `/#today` 로 들어오면 인트로를 띄우지 않음 (entry.ts 로직 그대로)
- 메뉴 링크 주소 `/#today` 그대로

## 순서
1. test — 테스트 먼저(FAIL 확인) · 커밋 · 푸시 → lead 보고
2. builder — 구현 · 커밋 · 푸시 → lead 보고
3. test — 단위 · e2e · 게이트(Quick) 판정(verdict.md 규칙) → lead 보고
4. lead — PR "작업 0233: 패치(버그) — 메뉴 오늘 환율이 환전 타이밍 구역으로 이동" · 담당자 kyungchan3007 · CI gate 확인

## 완료 기준
- [ ] bash .agents/checks.sh PASS (verdict.md "게이트 판정 규칙" — 로그 전체 ❌ 0개)
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS
- [ ] 세 경로 × 1280 · 390 에서 제목이 메뉴 바로 아래에 보임

## 허점
-
