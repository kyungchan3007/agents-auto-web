# 계획 — 작업 0218 새 디자인 여행 타이밍 (/flights · 시안 A + 머리 글자판)

## 무엇을 · 왜
- 사용자 결정: 여행 타이밍은 시안 A · 머리는 사진 대신 글자판 모션(시안 C/flights-hero-flap.html · C/shots/flights-hero-flap-1280.png · -390.png). 본문은 A/flights.html · A/shots/flights-*.png
- 메뉴 아래부터 흰 면(머리) → 아래 하늘색 바탕
- 머리 왼쪽: 지금 라벨 · 제목 "항공료 · 단체여행 모두 N월이 싼 편"(월에 노란 밑줄) · 지금 설명
- 머리 오른쪽: 글자판 세 줄 — "가장 싼 달 N월" / "국제항공료 146.8" / "단체여행비 139.2". 이름은 흰 글자(white 줄 또는 칸별) · 값은 노랑. 값은 실제 최신 지수 · 가장 싼 달은 지금 계산. 들어올 때 한 번 넘어감. 화면 읽기는 한 문장
- 탑승권 한 장: 왼쪽 그래프(지금 그래프 그대로 · 최고 · 최저 표시) · 절취선 · 오른쪽 숫자(국제항공료 · 해외단체여행비 최신 달 · 작년보다 % · 가장 싼 달 작은 글자판). 탑승권이 왼쪽 밖에서 미끄러져 들어옴(SlideIn · 약 0.7초) · 숫자 카운트업(지수 · %)
- 그 아래 한 줄 띠 세 칸: 최고(달 · 지수) · 최저(달 · 지수) · 원/달러 월평균
- "작년보다 +20.7%" 빨간 배지 → 빨간 점 + 글 (시안 A)
- 휴대폰: 머리 글자판은 제목 아래 · 탑승권은 그래프 위 · 숫자 아래로 쌓음

## 공통 규칙
- 0216 부품 사용(FlapBoard B 모양 · CountUp · useCountUp · SlideIn · Flag/CurrencyFlag) · 시안은 그대로 옮기지 않고 사이트 부품 · 토큰으로
- 숫자 · 그래프는 실제 자료(지금 페이지가 받는 값) · 자료 없으면 지금처럼 빈 값 · 오류 표시
- 사진은 쓰지 않음: 이 페이지의 사진 머리를 걷어 냄(사진 파일 · 부품 삭제는 0222)
- 시안 영문 라벨(대문자 작은 글씨) · 원래 없던 문장은 넣지 않음 — 필요하면 lead 에게 목록으로(사용자 확인)
- 제목 위 작은 라벨 유지 · 데스크톱 · 휴대폰 같은 시안
- 움직임: 화면에 들어올 때 한 번 · 움직임 줄이기면 최종 값 · 서버 첫 그림 = 최종 값

## 애매한 곳
- 글자판 아래 "가장 싼 달은 최근 2년 같은 달 평균 기준입니다" 는 지금 페이지에 같은 뜻의 글이 있으면 그 글을 씀 · 없으면 넣지 않고 lead 에게 (가정)
- 휴대폰에서 글자판 칸 수가 많아 넘치면 칸 크기를 줄임(가로 넘침 금지) (가정)

## 파일 계획
- apps/web/src/features/travel-price/components/flights-page.tsx · flights-graph.tsx · flights-graph.test.ts
- apps/web/src/features/travel-price/lib/** (가장 싼 달 · 최신 값 계산이 필요하면)
- apps/web/src/shared/*.test.ts (flights 소스 검사 갱신)
- apps/web/e2e/flights*.spec.ts · apps/web/e2e/** (flights 관련)
- .agents/orchestration/TASKS.md · .agents/specs/0218-redesign-flights/**

## 계획 밖 변경 이유
- apps/web/src/features/travel-price/components/mini-board.tsx · apps/web/src/shared/font-readability.test.ts — 작은 글자판(리뷰 수정) 새 파일 · 큰 글씨 허용 목록에 그 파일 추가
- packages/ui/src/components/data/flap-board.tsx · flap-board.test.ts — 줄 안에서 이름(흰 글자) · 값(노랑)을 나누려고 Row 에 whiteUntil 추가 · 375px 에서 칸이 줄어들 수 있게 min-w-0 shrink (0217 과 같은 줄을 같은 모양으로 고침 — 합칠 때 충돌 없게)
- apps/web/src/features/travel-price/lib/flights-view.ts · flights-view.test.ts — 새 파일(계획의 lib/** 안): 머리 글자판 · 최신 숫자 · 한 줄 띠 계산
- apps/web/src/features/travel-price/components/flights-graph.tsx — 그래프가 탑승권 왼쪽 칸에 들어가 좁아져 '최저' 이름표가 노란 점 테두리를 가려, 피할 칸을 2px 넓힘 (그래프 모양은 그대로)

- (그래프 2D · 시안 F) apps/web/src/features/travel-price/components/flights-graph.tsx — 그래프 그림을 공통 부품 LineChart(0216)로 교체: 선 셋(항공료 · 단체여행비 면 + 원/달러 점선 오른쪽 눈금) · 최고/최저 점 · 끝 큰 숫자 말풍선 · 순서 움직임. 배치(안내 글 · 범례 칩 · 탑승권 안 위치)는 그대로. 3D 비행기는 2D 결정으로 이 그래프에서 뺌(비행기 부품 파일 · 옛 flights-graph-view 계산 함수는 그대로 둠 — 옛 테스트가 있어 지우지 않음) / hooks/use-flights-graph.ts — 그래프 폭 재기를 공통 부품이 맡아 강조 선 상태만 남김 / 안내 글 UNIT_NOTE("선마다 단위가 달라 모양만 비교합니다")는 옛 테스트가 값을 고정해 그대로 둠 — 지금 그림은 지수 두 선이 같은 눈금이라 문장이 어긋남(test 가 값을 정하면 바꿈). 옛 소스 검사 flights-graph.test.ts 는 옛 그래프(비행기 · month-tick)를 전제해 새 그래프에 맞게 test 가 고쳐야 함

## 완료 기준
- [x] 1280 · 768 · 390 가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0
- [x] 글자판 값 = 실제 최신 지수 · 가장 싼 달 = 지금 계산 (단위 · e2e)
- [x] 탑승권 들어오기 · 카운트업: 움직임 줄이기면 처음부터 최종 · 끝나면 제자리 · 끝 값 = 실제 값
- [x] 자료 없을 때 지금처럼 "아직 받지 못했습니다"
- [x] bash .agents/checks.sh PASS · 빌드 한 번

## 허점
- (리뷰 수정) 넓은 화면 탑승권 그래프 칸 아래 빈칸: 오른쪽 숫자 칸 간격을 줄이고 "가장 싼 달" 글자판을 칸 높이 44px 의 작은 판(mini-board.tsx · 움직임 없음)으로 바꿔 두 칸 아래 끝 차이 50px(기준: 카드 안쪽 여백 32 + 40 = 72 이하). dev 서버에서 측정(카드 450px · 작은 판 60px) · 빌드 안 함.
- 웹킷(사파리) 확인 못 함(playwright webkit 없음).
- 글자판 아래 "가장 싼 달은 최근 2년 같은 달 평균 기준입니다" 문장은 넣지 않음 — 같은 뜻이 탑승권 오른쪽 "가장 싼 달 (최근 N년 평균)" · "같은 달 평균 기준" 으로 이미 있어서. 문장으로 넣으려면 사용자 확인 필요.
- 한 줄 띠의 최고 · 최저는 항공료 최근 36개월(그래프 범위와 같은 규칙)이고 그래프는 세 선 합친 범위라 드물게 한 달 차이가 날 수 있음.
- 탑승권 왼쪽 그래프가 오른쪽 숫자 칸보다 낮아 아래에 빈 자리가 남음(넓은 화면). 시안은 비슷한 높이.
- 시안의 영문 작은 라벨(FARE WATCH · DEPARTURES · FARE INDEX · BOARDING PASS · 24 MONTHS)은 넣지 않음.
- 이 브랜치는 0216 위라 0217 의 같은 파일 수정(photos.spec · photos.test · flap-board)과 가까운 줄에서 합칠 때 충돌이 날 수 있음.
- (사용자 지적 · 표 모양) 표 뒤 구간(flights-back)을 옅은 면(surface-2 #F2F5F9)으로 두고 가장자리 홈 색(NOTCH)도 같은 색으로 — 시안 C/flights-hero-flap.html .pass::before/after 의 방식(홈 색 = 그 자리 뒤 바탕색). 홈 가운데가 카드 가장자리 위에 있음을 e2e 로 검사. "가장 싼 달" 작은 글자판(MiniBoard)은 큰 판 틀(남색 바탕 · 안쪽 여백 · 둥근 틀)을 없애고 칸 셋만 단독으로(칸 남색 + 노랑 글자 · 높이 44px). 파일: flights-page.tsx · mini-board.tsx · shared/flights-redesign.test.ts(새) · e2e/flights-redesign.spec.ts
- (사용자 지적 2 · 절취선 동그라미) 탑승권 절취선 위 · 아래 끝 동그라미(홈 · NOTCH 두 개)를 없애고 점선(절취선)만 남김 — 표 뒤가 옅은 면이라 파인 홈이 아니라 따로 붙은 점처럼 보인다는 지적. 표 뒤 옅은 면(surface-2)과 작은 글자판은 그대로. 이전 지적(홈 색 = 뒤 구간 색)의 e2e · 소스 테스트를 "홈 없음 · 점선 있음"으로 바꿈. 홈(0217) 탑승권의 파인 홈은 그대로(lead). 다른 표(통화 상세 · 직구 꼬리표 · 여행 물가)에는 절취선 끝 동그라미가 없어 해당 없음. 파일: flights-page.tsx · shared/flights-redesign.test.ts · e2e/flights-redesign.spec.ts
