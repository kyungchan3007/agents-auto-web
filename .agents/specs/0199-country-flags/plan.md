# 계획

## 무엇을 · 왜
- 홈 "도착지별 환전 타이밍" · 통화 목록 · 통화 상세 제목 · 여행 물가 나라 줄에 나라 국기를 보인다 (#234).
- 이모지 국기는 윈도우에서 "JP" 같은 글자로 보이므로 그림(SVG) 국기를 쓴다.
- 이미 있는 것을 다시 쓴다: `@hav/ui/data/flag`(Flag · 서버에서 SVG 로 그림 · `country-flag-icons` MIT, 이미 의존성) · `@hav/ui/data/currency-flag`(CurrencyFlag) · 나라 → 국기 코드는 `TRAVEL_COUNTRIES[].flag`, 통화 → 국기 코드는 `currencyFlag()`. 0170 새 디자인 때 화면에서 빠져 지금 쓰는 곳이 없다.

## 애매한 곳
- 새 의존성 · SVG 파일 복사 없음 — 이슈는 "필요한 나라만 저장소에 넣음"이라 했으나 같은 MIT 모음이 이미 의존성이고 서버에서 SVG 로 그려 HTML 에 들어가므로 브라우저가 묶음을 받지 않음 (가정 · 보호 파일 package-lock.json 안 바뀜)
- 여러 나라가 쓰는 통화: 유로는 EU 국기, 그 밖은 `currency.ts` 의 `flag` 값(달러 US 등)을 대표 국기로 (확인됨: 이슈 · 기존 표)
- 여행 물가 줄은 나라 국기(`TRAVEL_COUNTRIES[code].flag` · 마카오처럼 통화가 없어도 나라 국기는 있음)
- 크기: 글자 높이에 맞춤 (`h-4 w-6` 기본) · 국기는 장식이 아니므로 title 에 "일본 국기"처럼 이름 (가정)
- 라이선스 표기: README 의 사용한 자료 칸(또는 하단 출처)에 country-flag-icons (MIT) 한 줄 (가정)

## 파일 계획
- apps/web/src/features/home/**
- apps/web/src/features/currencies/**
- apps/web/src/features/travel-price/**
- packages/ui/src/components/data/flag.tsx
- packages/ui/src/components/data/currency-flag.tsx
- apps/web/e2e/**
- README.md
- .agents/specs/0199-country-flags/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick)
- [x] 네 곳(홈 도착지 · 통화 목록 · 통화 상세 제목 · 여행 물가 나라 줄)에 국기가 `<svg>` 로 그려짐 — 이모지 국기 글자 없음 (e2e)
- [x] 휴대폰 폭에서 줄바꿈 · 겹침 없음
- [x] 라이선스 한 줄
- [ ] 브랜치 미리보기 확인 (lead · 실제 Chrome)

## 허점
- 계획 밖 변경: 없음 (`DestinationRowData` 에 `currency` 한 칸 추가 → 같은 폴더 `destinations.test.ts` 기대값 수정). 새 의존성 · package-lock 변경 없음.
- 통화 상세는 큰 숫자 제목(h1) 옆이 아니라 바로 위 "엔화 · JPY" 줄 앞에 국기를 둠 (h1 은 글자 크기가 커서 국기가 어색함 · 가정).
- 기존 e2e(0193 유로)가 국기의 `<title>핀란드 국기</title>` 를 먼저 잡아 실패 → exact 글자 검사로 고침. 같은 방식으로 `getByText(나라이름)` 을 쓰는 검사가 앞으로 늘면 같은 문제가 생김.
- 마카오처럼 통화 없는 나라는 `TRAVEL_COUNTRIES[].flag` 로 국기 있음. 국기 코드를 모르면 회색 빈 칸.
- 휴대폰 겹침은 홈 · 여행 물가만 e2e 로 확인 (통화 목록 · 상세는 캡처 없음).
