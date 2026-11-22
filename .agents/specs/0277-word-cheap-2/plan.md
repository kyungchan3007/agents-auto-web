# 계획 — 작업 0277 · '쌈 · 비쌈' 문구 바꾸기 (2/2) — 여행 물가 · 항공료 (Quick · 평소 PR)

## 무엇을 · 왜
- 0276(#329)에 이어 여행 물가 · 항공료 쪽 문구를 사용자가 정한 규칙대로:
  - 여행 물가 "한국보다 12% 비쌈" → "한국보다 12% 비쌉니다" · travel.ts "% 쌈 · % 비쌈" → "% 저렴합니다 · % 비쌉니다" · 물가 노선 양 끝 "← 쌈 · 비쌈 →" → "← 물가 낮음 · 물가 높음 →"
  - 항공료 "출발이 가장 쌉니다" · "63% 쌉니다" · "만 원 쌉니다" → "저렴합니다" · 한 낱말 "쌈 · 보통 · 비쌈" → "저렴 · 보통 · 높음" · 나란히 놓인 "가장 싼 달 · 날 · 요일 · 출발" → "가장 저렴한 …"
- 바꾸지 않음(사용자 확정): "언제 떠나면 쌀까" · "~월이 싼 편" · "싼 편 · 비싼 편" · "한국보다 싼 곳 · 비싼 곳" · 메타 · 공유 이미지 · GEO 측정 질문.

## 애매한 곳
- 강조 색(emphasis.ts '저렴')은 0276 에서 이미 추가. 판정 이름 문서는 0276 에서 맞춤 — airfare 쪽 docs/domain 에 같은 낱말이 있으면 함께. (작업서)
- 길어진 문구의 넘침 · 밀림은 기능 테스트. (작업서)
- shared/src/domain(travel.ts · airfare.ts) 문구가 바뀌므로 평소 PR. (verdict.md)

## 누가
- builder — 준비해 둔 변경 · 로컬 빌드 · 한 번에 푸시
- test — 옛 문구 고정 테스트를 새 문구로 · word-cheap.spec 을 여행 물가 · 항공료까지 넓힘(낱말 없음 · 바꾸지 않는 곳 그대로) · 새 spec 이면 연결표 + 하네스 테스트 로컬 · 4399 점검
- lead — PR · gate · 머지

## 파일 계획
- apps/web/src/features/travel-price/**
- packages/ui/src/components/data/ruler-chart.tsx
- packages/shared/src/domain/** (travel.ts · airfare.ts)
- docs/domain/** (항공료 쪽 같은 낱말이 있으면)
- apps/web/e2e/** · **/*.test.ts(x) · .agents/e2e-map.json (test)
- .agents/specs/0277-word-cheap-2/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 화면에 한 글자 "쌈 · 비쌈" 0 · "쌉니다" 0 (바꾸지 않는 곳 제외)

## 허점
- 0276: 새 e2e spec 을 연결표에 넣지 않아 하네스 테스트로 gate 1회 실패 → test 체크 목록에 '하네스 테스트 로컬' 추가.
