# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 페이지 데이터 · 계산(lib/travel-timing · destinations · today-board · picked)은 그대로 두고 보이는 부품만 바꿉니다.
- 구간 순서: 첫 화면(파랑 · 제목 · 탑승권 카드에 TodayBoard) → 12달 막대(TravelTimingGraph 를 막대로) → 도착지별 환전 타이밍(DestinationsSection 을 A 목록으로) → 바닥 띠.
- 탑승권 카드의 "경계에 걸침"은 파랑 면 아래쪽 여백을 음수 여백으로 겹치지 말고, 파랑 면 배경을 카드 가운데 높이까지만 칠하는 방식(그라데이션 두 면 · 또는 절대 위치 배경)으로 — 높이가 변해도 겹침이 어긋나지 않게.
- 환전 목록 줄: 한 줄 부품(destination-row)을 고쳐 국기 · 막대 · 동그라미 · 금액. 동그라미 위치 = 지금 위치 × progress 가 아니라 "시작 위치 → 최종 위치" 를 progress 로 보간(시작 위치는 최종 값 85% 에 해당하는 막대 위치가 아니라 막대 왼쪽 끝 쪽 가까운 값 · CountUp 시작과 같은 비율).
- 사진 머리(PickedPhotoHeader) · PlaneRouteLazy 는 홈에서 import 를 뺍니다. 파일 삭제는 0222.

## 대안 · 트레이드오프
- 시안 HTML 의 CSS 를 그대로 붙이는 방법은 쓰지 않음(토큰 · 부품 일관성 · 0215 색 토큰 규칙).

## 파일 계획
- apps/web/src/features/home/**
- packages/ui/src/components/data/destination-row.tsx · destination-row.test.ts · signal-pin.tsx (필요하면)
- packages/ui/src/components/form/pick-trip.tsx (버튼 모양만 · 필요하면)
- apps/web/public/fonts/pretendard/** · apps/web/src/app/pretendard.css (900 굵기가 필요할 때만)
- apps/web/src/shared/*.test.ts (홈 소스 검사 갱신)
- apps/web/e2e/home*.spec.ts · apps/web/e2e/** (홈 관련)
- .agents/orchestration/TASKS.md · .agents/specs/0217-redesign-home/**

## 계획 밖 변경 이유
- (사용자 지적 · 파인 홈) apps/web/src/features/home/components/ticket.tsx — 홈을 가짜 요소(before · after)에서 진짜 요소로 · 카드 안쪽으로 자르는 틀 · 파랑 띠를 홈 아래 끝까지 / apps/web/src/shared/home-redesign.test.ts · apps/web/e2e/home-redesign.spec.ts — 새 검사
- packages/ui/src/components/form/trip-switcher.tsx · packages/ui/src/hooks/use-trip-switcher.ts — 새 파일(사용자 지적 · 카드 안 여행지 바꾸기)
- packages/ui/src/hooks/use-count-up.ts — 웹 쪽 화면이 ui 의 lib 를 직접 가져올 수 없어(package.json exports 가 보호 파일) 훅 파일에서 formatCount 를 같이 내보냄
- packages/ui/src/components/data/flap-board.tsx — 375px 에서 판이 탑승권 카드 밖으로 넘쳐, 칸이 줄어들 수 있게(min-w-0 shrink) 함
- apps/web/e2e/hero-photo.spec.ts — 삭제: 홈 머리 사진 덮개 · 노란 형광펜 표시줄 검사만 있었고 새 홈에는 둘 다 없음
- apps/web/e2e/country-photos.spec.ts · flap-board.spec.ts · home-design.spec.ts · home.spec.ts · photos.spec.ts · flags.spec.ts — 옛 홈(사진 · 선 그래프 · 비행기 · 옛 도착지 줄)을 전제한 기대를 새 홈에 맞게 고침
- apps/web/src/shared/{font-readability · home-band-trim · home-flap-board · home-redesign · intro-structure · number-emphasis · photos}.test.ts — 같은 이유로 소스 검사 고침 (hero-section 큰 제목 font-display 허용 · 사진 머리 없음 · picked-board 가 ticket 으로)
- apps/web/src/features/home/components/{travel-timing-section · picked-photo-header · picked-board}.tsx — 삭제: 새 홈이 쓰지 않아 "죽은 코드 없음" 검사(home-redesign.test H10)가 요구함 (사진 부품 PhotoHeader · three/ 코드는 그대로 · 삭제는 0222)

## 위험
- 기존 홈 e2e · 소스 검사가 사진 머리 · 3D 를 전제 — 새 결정에 맞게 고치고 이유를 여기 적음
- 인트로 끝 장면이 홈 머리 사진 자리를 찾음 → 자리가 없으면 인트로가 이상하게 끝날 수 있음(인트로 코드는 손대지 않음 · 기록만)

## 검증 계획
- 단위: 12달 막대 색 계산 · 동그라미 보간
- e2e: 1280 · 390 레이아웃 · 고르기 · 카운트업 · 움직임 줄이기 · 사진 요청 0 · 가로 넘침
- lead: 미리보기 1280 · 390 · 시안 캡처와 나란히 비교 · 사파리 눈으로 확인

## 계획과 달라진 점
- (사용자 지적 · 원문 "내여행지 고르기 말고 지금처럼 여행지 바꾸면 바로 확인하면 좋을거 같아") 카드의 "내 여행지 고르기" 버튼 · 시트 대신 카드 안에서 바로 바꿈: 자주 가는 곳 칩(국기 + 이름 · aria-pressed) + 같은 줄 검색 칸(combobox · listbox). 누르면 판 · 판정 줄 · 막대가 바로 바뀌고 새로고침해도 유지(같은 저장 값). 새 부품 TripSwitcher · 훅 use-trip-switcher (packages/ui). 여행 물가의 "다른 나라 보기"(시트)는 0220 에서 판단.
- 흰 바탕 결정(0216 의 세 커밋 cherry-pick): 흰 바탕 위 흰 판은 옅은 선(border-line)으로 구분 — 환전 목록 · 탑승권 카드에 테두리, 막대 홈은 surface-2.
- 도착지 줄: ui 의 DestinationRow 를 고치지 않고 홈 안에 새 목록(destination-table.tsx)을 만듦 — 줄 안에서 카운트업 훅(useCountUp)을 쓰는 client 부품이 필요하고, DestinationRow 는 /design 견본이 그대로 쓰고 있어서. ui 쪽 파일은 바꾸지 않음.
- 탑승권 카드: 위(제목 + 글자판) · 아래(판정 + 고르기)를 CSS grid 두 줄(subgrid)로 나누고 파랑 띠를 첫 줄 높이만큼만 깔아 경계가 절취선에 맞음. 시안의 절취선 양쪽 홈(파랑 동그라미)도 같은 방식.
- 예전 PickedBoard(client)를 Ticket 으로 합침: 서버가 지금 안내판 값(initial)을 계산해 넘기고, 고른 나라가 있으면 같은 카드 안에서 판이 그 나라로 바뀜.
- 12달 막대 높이는 가장 싼 달 20% ~ 가장 비싼 달 92% 선형 (시안 값과 같은 범위).
- /flights 링크는 prefetch 끔 — 켜 두면 /flights 의 머리 사진이 홈에서 미리 받아져 "홈 사진 요청 0" 이 깨짐.
- 900 굵기는 넣지 않음: 큰 제목 800 · 자간 -0.03em (시안은 900 · -0.055em). 글자 모양이 시안과 조금 다름.
- (사용자 지적 · 원문 "시안처럼 해줘 표디자인처럼" · 파인 홈) 표 가장자리 홈: 시안 B/home.html 의 .perf 는 표에 overflow:hidden 이 있어 홈 동그라미가 카드 안쪽 반원으로 잘리고, 파랑 면이 끝나는 곳이 홈 아래 끝(절취선 + 13px)이라 홈이 통째로 파랑 안에 있어 "파인 것"으로 보임. 이전 구현은 홈이 카드 밖으로 삐져나오고 파랑 면이 절취선에서 끝나 아래 반이 흰 바탕 위에 떠 보였음. 고침: 홈을 진짜 요소 둘(ticket-hole)로 · 틀(ticket-hole-clip · overflow-hidden)이 카드 폭에서 잘라 반원만 보임 · 홈 색 = 파랑 면 토큰 · 파랑 띠 아래에 -mb-[13px] 로 홈 아래 끝까지. lead 지시문의 "절취선 y = 파랑 면 아래 끝(≤1px)"은 시안 CSS 와 달라(시안은 파랑 면이 절취선보다 13px 아래) e2e 는 시안대로(홈 아래 끝 = 파랑 면 아래 끝 · 절취선 = 홈 가운데) 검사함. 여행지를 바꿔 카드 높이가 달라져도 같음(e2e).
