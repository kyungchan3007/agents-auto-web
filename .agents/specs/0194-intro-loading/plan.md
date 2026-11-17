# 계획

## 무엇을 · 왜
- 인트로 3D 를 부르는 동안 빈 화면에 "공항으로 가는 중…" 글자만 보여 플랩 정체성이 살지 않는다 (#221). 사용자가 시안 A(출발 안내판이 열림)를 골랐다.
- 참고 시안: 저장소 루트 `.tmp/loading-drafts/chosen-A-reference.html` (A 부분) · 작업서 `.tmp/lead-0194-chosen.md`

## A 흐름 (그대로)
1. 로딩: 하늘 종이 바탕 · `flapfx` 로고 · "환율 · 여행 타이밍" · 남색 안내판 두 줄 (1줄 "ICN → 탑승 준비 중" · 2줄 "체크인 확인 중" → "게이트 배정 중") · 노란 점 세 개 깜빡임 · 진행률 % 없음
2. 3D 준비 끝: 1줄이 "어디로 떠나시나요?" 로 넘어가고 2줄은 비움 → 안내판이 아래로 내려가며 흐려짐 → 바탕이 위 · 아래 두 장으로 나뉘어 열림(0.9초) → 터미널 입구(인트로 1단계 그대로)
- 글자판은 홈 안내판 넘김 방식(`packages/ui/src/lib/flap.ts`)을 재사용 (정해진 글자를 거쳐 맞춤 · 난수 없음)
- 움직임 줄이기: 넘김 · 열림 없이 로딩 → 첫 장면 페이드만
- 3D 를 못 불러와도(lite) 같은 로딩 → 열림 · 아주 짧게 로딩돼도 최소 한 번 글자가 맞춰진 뒤 열림 (번쩍임 방지)
- 건너뛰기는 로딩 중에도 동작

## 애매한 곳
- 최소 표시 시간: 첫 줄 글자가 다 맞춰질 때까지 (가정 · 시안 기준 약 1~1.5초)

## 파일 계획
- apps/web/src/features/intro/** (로딩 부품 · 훅 · 상태)
- packages/ui/src/lib/flap.ts · packages/ui/src/components/data/** (재사용에 필요한 작은 export 만)
- apps/web/e2e/intro*.spec.ts
- .agents/specs/0194-intro-loading/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- packages/ui/src/hooks/use-flap-rows.ts (새 파일) — 계획의 "재사용에 필요한 작은 export" 를 이루는 데 필요: `@hav/ui` 는 lib/* 를 내보내지 않고(ui package.json 은 보호 파일이라 exports 를 못 바꿈) hooks/* · components/* 만 내보냄 → 글자 넘김 훅을 hooks 에, 판을 components/data/flap-rows.tsx 에 두어 `@hav/ui/data/flap-rows` 로 씀
- packages/ui/src/lib/flap.test.ts — flap.ts 에 추가한 cellsAt(바뀐 칸만 넘어감)의 단위 테스트
- apps/web/src/shared/intro-loading.test.ts — 로딩 화면 구성 검사(옛 글자 제거 · 진행률 % 없음 · 난수 없음) · features/intro/** 밖의 shared 테스트 폴더

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick) + intro e2e (빌드 한 번)
- [x] e2e: 로딩 화면 보임 → 장면 준비 → 열림 → 1단계 · 로딩 중 건너뛰기 · 움직임 줄이기(페이드만) · lite
- [ ] 브랜치 미리보기에서 실제 GPU Chrome 으로 로딩 → 열림 확인

## 허점
- 실제 GPU 로 로딩 → 열림이 부드러운지는 로컬 Chrome 캡처로만 봄(이 컴퓨터는 GPU 있음) — 브랜치 미리보기 확인은 lead.
- 열림 시간(0.9초) · 최소 표시(1.3초)는 시안 기준 가정값 — 느린 망에서 3D 가 늦으면 로딩이 그만큼 길어지고 20초 안전장치 뒤에는 장면 없이 열림.
- 로딩 중 건너뛰기는 고른 값이 없어 저장 없이 바로 홈.
