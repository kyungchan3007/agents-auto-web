# 계획 — 작업 0276 · '쌈 · 비쌈' 문구 바꾸기 (Quick · 평소 PR · 사용자 직접 지적)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 사용자가 정한 문구안 1 ~ 5 그대로: "가장 저렴한 달은 11월, 가장 비싼 달은 5월" · 말풍선 "가장 저렴한 달 / 가장 비싼 달" · 환율 판정 "낮음 · 중간 · 높음"(소개 "낮음 · 보통 · 높음 판정") · "한국보다 12% 비쌉니다" · "쌉니다" → "저렴합니다".
- 같은 규칙: 한 글자 "쌈 · 비쌈" 은 화면에서 모두 없앰(환율 "낮음 · 높음" · 항공료 · 물가 한 낱말 "저렴 · 보통 · 높음") · 창밖 꼬리표 · 물가 노선 양 끝 "← 물가 낮음 · 물가 높음 →" · travel.ts "% 저렴합니다 · % 비쌉니다" · 나란히 놓인 "가장 싼 달 · 날 · 요일 · 출발" → "가장 저렴한 …". 바꾼 목록은 PR 본문에.
- 바꾸지 않음(사용자 확정): "이번 주 가장 싸게 갈 수 있는 곳" · "언제 떠나면 쌀까" · "싼 편 · 비싼 편" · "한국보다 싼 곳 · 비싼 곳" · 메타 · 공유 이미지 · GEO 측정 질문.

## 애매한 곳
- packages/ui/src/lib/emphasis.ts 가 "쌉니다 · 싼" 낱말로 강조 색을 고름 → "저렴"이 싼 쪽으로 잡히게 함께. (작업서)
- 판정 이름이 docs/domain 에 있으면 함께 고침(보호 파일이면 멈추고 알림). (작업서)
- 화면 읽기용 글(aria) · 구조화 자료에 같은 문구가 있으면 함께. 메타 · 공유 이미지는 그대로(사용자 확정). (작업서)
- 길어진 문구로 줄이 바뀌거나 넘치는 곳 확인 — "가로로 넘치지 않는다 · 값이 바뀌어도 밀리지 않는다"는 기능 테스트. (작업서)
- (정함 · lead 04:34Z) 바꿀 파일 약 17개 → 두 PR 로 나눔: **0276** 홈 · 환율 판정 · 소개 · 창밖 꼬리표 · 강조(year-bars · destination-table · destination-row · signal-pin · criteria · window-months · emphasis.ts · docs/domain/signal.md · travel-price.md) / **0277** 여행 물가 · 항공료(price-route · lib/price-route · ruler-chart · shared travel.ts · airfare.ts · airfare-calendar · airfare-view · flights-page · flights-view · flights-copy). 0277 은 같은 작업서를 따른다.
- 파일이 10개를 넘으면 lead 가 나눈다. builder 가 사실 대조 뒤 바꿀 파일 목록을 먼저 보고 → lead 가 정함. (작업서)
- 문구 · 판정 이름(lib · shared · docs/domain)이 바뀌므로 평소 PR(design 라벨 없음). (verdict.md)

## 누가
- builder — 문구 위치 대조 · 바꿀 파일 목록 보고 → 구현 · 로컬 빌드로 넘침 확인 · 한 번에 푸시
- test — 옛 문구를 고정한 테스트를 새 문구로 · 바꾸지 않는 곳이 그대로인지 · 넘침 · 밀림 기능 e2e · 푸시 전 로컬(4399 점검)
- lead — PR · gate · ALL PASS 면 develop 머지

## 파일 계획
- apps/web/src/features/{home,travel-price,currencies,import-calc,about,intro}/**
- packages/ui/src/** (ruler-chart · emphasis.ts · 그래프 부품)
- packages/shared/src/domain/** (travel.ts 등)
- apps/web/src/app/** (읽기용 글 · 구조화 자료에 같은 문구가 있으면 · 메타 제외)
- docs/domain/** (판정 이름)
- apps/web/e2e/** · **/*.test.ts(x) (test)
- .agents/specs/0276-word-cheap/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 화면에 한 글자 "쌈 · 비쌈" 0 · "쌉니다" 0 (바꾸지 않는 곳 제외)
- [ ] 강조 색이 "저렴"에도 그대로 · 넘침 · 밀림 없음

## 허점
-
