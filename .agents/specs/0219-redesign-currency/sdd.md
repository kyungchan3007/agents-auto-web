# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 자료 받기 · 계산(currency-detail 의 데이터 · converter 계산 · period-chart 자료)은 그대로, 보이는 틀만 바꿉니다.
- 배치: 넓은 화면 2열(왼쪽 머리 · 경로 카드 / 오른쪽 탑승권 계산기 · 따라오기(sticky)) → 아래 가로 전체 1년 흐름 → 다른 통화 목록. 휴대폰 1열(머리 → 계산기 → 경로 → 그래프 → 목록)
- 검색 + 칩은 머리 위(라벨 줄 근처) — 기존 currency-search 를 재사용 · 칩은 Flag 부품
- 그래프 그리기: SVG path 의 stroke-dasharray/offset 를 화면에 들어올 때 한 번(움직임 줄이기면 없음 · 서버 첫 그림은 다 그려진 상태)
- 계산기 결과 글자판: FlapBoard 한 줄 · 값이 바뀌면 다시 넘어가지 않고 바로 바뀜(처음 한 번 규칙)

## 대안 · 트레이드오프
- 검색을 새로 만드는 대신 기존 부품 재사용(접근성 검사 이미 있음)

## 파일 계획
- apps/web/src/features/currencies/**
- apps/web/src/app/currencies/** (페이지 틀이 바뀌면)
- packages/ui/src/components/data/year-chart.tsx (그리기 움직임이 필요하면)
- apps/web/src/shared/*.test.ts (currencies 소스 검사 갱신)
- apps/web/e2e/currenc*.spec.ts · apps/web/e2e/** (통화 상세 관련)
- .agents/orchestration/TASKS.md · .agents/specs/0219-redesign-currency/**

## 계획 밖 변경 이유
- packages/ui/src/hooks/use-count-up.ts — 웹 쪽 화면이 ui 의 lib 를 직접 가져올 수 없어(package.json exports 가 보호 파일) 훅 파일에서 formatCount 를 같이 내보냄 (0217 과 같은 줄)
- packages/ui/src/components/data/year-chart.tsx — 계획 안(그리기 움직임 · 높은 그래프): draw · tall 속성 추가 · 선에 data-testid="year-line"
- apps/web/src/shared/pages-redesign.test.ts — "통화 화면에 data-surface elevated 없음" 검사에 계산 탑승권(converter.tsx)을 예외로 둠 (바다 띠가 아니라 탑승권 안 한 칸)
- apps/web/e2e/{detail-design · pages · features · a11y}.spec.ts — 옛 통화 상세(왼쪽 목록 · 통계 카드 3개 · 노란 결과칸)를 전제한 기대를 새 모양에 맞게 고침

## 위험
- 통화 페이지가 많아(정적 생성) 빌드 시간 · D1 읽기 — 받는 자료를 늘리지 않음(새 API 호출 금지)
- 계산기 sticky 가 휴대폰에서 겹침 — 휴대폰은 sticky 끔

## 검증 계획
- 단위: 경로 점 위치 · 칩 목록
- e2e: 검색 키보드 · 링크 · 계산 · 움직임 줄이기 · 가로 넘침 · 사진 요청 0
- lead: 미리보기 USD · JPY · 자료 적은 통화 하나 · 1280 · 390 · 사파리

## 계획과 달라진 점
- 계산기 결과 금액: 글자판(FlapBoard · 처음 한 번 넘어간 뒤 값이 바뀌면 바로 바뀜)으로 보이고, 금액 카운트업은 하지 않음 — 글자판의 처음 넘어가는 움직임이 그 자리를 대신함 (글자판 + 카운트업을 겹치면 글자가 이중으로 움직임). prd 의 "결과 금액 카운트업" 은 미적용 — 사용자 확인 필요.
- 오늘 위치 비행기 점은 가만히 둠 (최저 · 최고 숫자만 카운트업).
- 그래프 그리기: 선 길이를 화면 픽셀로 재서 dasharray · dashoffset 를 웹 애니메이션(el.animate)으로 — 끝나면 효과가 사라져 서버 첫 그림과 같은 상태 (기간을 바꿔도 다시 안 그림)
- 검색 · 칩 · 아래 목록은 페이지가 아니라 둘러보기 틀(browse-layout)에 둠 — /currencies 와 /currencies/CODE 가 같은 틀을 쓰고 통화를 바꿔도 남아서
- 국기 칩 줄 이름표(aria-label "자주 보는 통화")는 화면 읽기용 새 글 — 사용자 확인 목록
