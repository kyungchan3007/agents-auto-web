# 계획 — 작업 0222 사진 지우기 (새 디자인 마지막 단계)

## 무엇을 · 왜
- 사용자 결정: 새 디자인은 사진을 쓰지 않으므로 사이트 사진과 사진 부품을 모두 지웁니다. 인트로 끝은 0223 에서 사진 없이 바뀌었고, 공유 미리보기 이미지는 0216 에서 사진 없는 1안이 되었습니다.
- 이 브랜치는 0223(0216 · 0217 · 0223 포함) 위에서 시작합니다. 먼저 남은 새 디자인 브랜치를 합쳐 모든 페이지가 사진을 걷어 낸 상태를 만듭니다.
  - 합칠 순서(merge 커밋): origin/task/0216-redesign-common(최신 — 공유 미리보기 1안 포함) → 0218 → 0219 → 0220 → 0221
  - 충돌(작업 보드 · photos.spec · photos.test · flap-board 등)은 양쪽 변경을 모두 살리는 쪽으로 풉니다. 푼 방법을 아래 "합치기 기록"에 파일마다 한 줄로 적습니다. 사용자가 PR 을 차례로 rebase 머지할 때 같은 충돌이 다시 나므로, lead 가 이 기록을 보고 각 PR 을 rebase 합니다.
  - 마지막에 rebase 머지하면 merge 커밋과 이미 들어간 커밋은 빠지고 0222 자신의 커밋만 남습니다.
- 지울 것
  - apps/web/public/images/photos/ 의 사진 전부(기본 5종 · country-* 전부 · 모든 크기)
  - apps/web/src/app/_assets/plane-sunset-og.jpg
  - PhotoHeader · PickedPhotoHeader(남아 있으면) · packages/ui lib/photo · 사진 관련 테스트(photos.test · country-photos 등) · 사진을 만드는 스크립트(apps/web/scripts/make-photos.mjs 등, 보호 파일이 아니면) — 안 쓰는 코드를 남기지 않음
  - 인트로가 더는 쓰지 않는 창문 · 창밖 사진 코드(scene.ts 의 zoomIn · 창문 카메라 등 0223 이 남긴 것)
- 바꿀 것
  - 소개(/about) 머리: 사진 머리 → 사진 없는 머리(시안 A 페이지 머리 모양: 메뉴 아래 흰 면 · 라벨 · 큰 제목 · 설명)
  - 문서: docs/design.md 등 사진 규칙(고른 나라 사진 · 기본 사진)을 "사진 없음(작업 0222 · 사용자 결정)"으로
  - 사진이 있어야 통과하던 검사는 "사진 요청 0 · 사진 파일 없음" 검사로 바꿈

## 애매한 곳
- 국기(SVG 부품)는 사진이 아니므로 그대로 (가정)
- 인트로 3D 장면이 쓰는 모델 · 텍스처(사진 아님)는 그대로 (가정)
- 사진을 만드는 스크립트가 package.json 스크립트에 걸려 있으면 그 줄만 지움 — package-lock 은 건드리지 않음 (가정)

## 파일 계획
- apps/web/public/images/photos/**
- apps/web/src/app/_assets/**
- apps/web/scripts/** (사진 스크립트)
- apps/web/package.json (사진 스크립트 줄이 있으면)
- packages/ui/src/components/layout/photo-header.tsx · packages/ui/src/lib/photo.ts · photo.test.ts · packages/ui/src/hooks/** (사진 관련)
- apps/web/src/features/about/** · apps/web/src/features/intro/** · apps/web/src/features/home/**
- apps/web/src/shared/*.test.ts · apps/web/e2e/**
- docs/design.md · docs/**
- packages/ui/src/three/** (인트로가 안 쓰는 창문 카메라 코드만)
- .agents/orchestration/TASKS.md · .agents/specs/0222-remove-photos/**
- 합치기(merge)로 들어오는 0216 · 0218~0221 의 파일은 이 작업의 변경이 아님 — 게이트가 범위 경고를 내면 "계획 밖 변경 이유"에 "합치기"로 적음

## 합치기 기록
(merge 커밋 순서: 0217 → 0216 → 0218 → 0219 → 0220 → 0221 → 0221 한 번 더. 사용자가 PR 을 차례로 rebase 머지할 때 lead 가 같은 충돌을 풀 때 쓰는 기록 — 파일마다 한 줄)
- 0217: 충돌 없음. 이 브랜치의 아래 0223 이 0217 의 앞선 시점 위라 0217 의 나중 커밋(카드 안 여행지 바꾸기 · 흰 판 선 · 0216 흰 바탕 중복 커밋)이 빠져 있어서 먼저 합침.
- 0216(최신): 충돌 없음.
- 0218: `.agents/orchestration/TASKS.md` — 0217 줄(PR 대기)과 0218 줄(PR 대기)을 한 줄씩 양쪽 상태 그대로 둠 / `apps/web/e2e/photos.spec.ts` — WITH_PHOTO 목록에서 홈 · /flights 항목을 둘 다 빼고 "사진 없음" 주석 둘 / `apps/web/src/shared/photos.test.ts` — 홈 · /flights 항목을 둘 다 뺌(주석) / `packages/ui/src/components/data/flap-board.tsx` — 0218 쪽(`whiteUntil` 로 줄 안 앞 칸을 흰 글자로 감싼 span) 채택.
- 0219: `TASKS.md` — 0217 · 0218 줄은 PR 대기 유지 + 0219 줄 PR 대기로.
- 0220: `TASKS.md` — 0220 줄 PR 대기 / `e2e/country-photos.spec.ts` — 0217 쪽(홈은 시트 없이 카드 안 칩으로 고르기) 채택 · 0220 쪽의 "홈 사진 그대로" 줄은 버림 / `e2e/photos.spec.ts` — 목록에서 /prices 도 뺌 · "/flights 사진 없음" 과 "/prices 사진 없음" 테스트 둘 다 유지 / `shared/font-readability.test.ts` — 허용 목록에 0223(window-transition) · 0220(prices-header) 두 줄 모두 둠 / `shared/pages-redesign.test.ts` — 파랑 면 예외를 converter.tsx(0219) · prices-header.tsx(0220) 둘 다 허용하는 한 식으로 합침 / `shared/photos.test.ts` — 홈 · /flights · /prices 항목을 모두 뺌(주석 셋).
- 0221: `TASKS.md` — 0221 줄 PR 대기 / `e2e/photos.spec.ts` — 목록에서 /calc 도 뺌 · "/calc 사진 없음" 테스트까지 넷 모두 유지 / `shared/photos.test.ts` — /calc 항목도 뺌(주석 넷).
- 0221 한 번 더(151e0db · 넓은 화면 제목 자리 세 줄 → 두 줄): 충돌 없음.
- 0221 사용자 결정(직구 계산 머리 파랑 · 38fadbc): `shared/number-emphasis.test.ts` — 직구 큰 문장은 0221 쪽(sea) · 여행 물가는 0220 쪽(sea) · 홈 줄은 0217 쪽 주석(0222 쪽에서 이미 정리됨) 채택 / `shared/pages-redesign.test.ts` — 파랑 면 예외를 converter.tsx(0219) · prices-header.tsx(0220) · calc-page.tsx(0221) 세 파일을 한 식에 모음.
- 표 모양 지적 수정(2026-11-18 · 0217 파인 홈 · 0218 표 뒤 옅은 면 + 작은 글자판 · 0220 제목 세 줄): 세 브랜치의 새 커밋을 local 브랜치로 merge — 충돌 없음(건드린 파일이 겹치지 않음: ticket.tsx · flights-page.tsx · mini-board.tsx · prices-header.tsx · 각 e2e · 소스 테스트 새 파일).
- 0220 예산 카드 시안 B 위치 · 크기(2026-11-18 · 0220 의 새 커밋): local 브랜치 merge — 충돌 없음(price-page.tsx · budget-planner.tsx · prices-title.test.ts · prices-redesign.spec.ts 는 0222 가 건드리지 않은 파일). 입력 칸 모양은 0221 의 옅은 공용 Field 가 0222 에 이미 합쳐져 있어 카드 안 칸도 같은 모양(높이만 64px).
- 2026-11-18 오후 지시 셋(0218 절취선 동그라미 없앰 · 0220 휴대폰 자 라벨 겹침 · 0221 직구 제목 한 줄 · 좁은 폭 카드 높이): local 브랜치 세 개 merge — 충돌 없음(건드린 파일 겹침 없음: flights-page.tsx · price-ruler.tsx · ruler.ts · calc-copy.ts · calc-page.tsx · calc-result.tsx · 각 e2e · 소스 테스트). 0221 의 calc-gap.spec.ts 폭 구간 최소 높이와 0222 의 no-photos 검사는 서로 안 겹침.
- 합친 뒤 고친 것(브랜치끼리 섞여서 생긴 것): `shared/calc-blue.test.ts`(0221) — "사진 없음" 줄이 PhotoHeader 글자를 담아 no-photos 검사에 걸림 → 영문 라벨 줄만 남기고 지움(이 브랜치에서만 고침 · 충돌 없음) / `e2e/photos.spec.ts` "휴대폰 — 사진 구간이 가로로 넘치지 않고…" — 0218 이 /prices 로 바꿨는데 0220 이 /prices 사진을 뺌 → /about 으로(2단계에서 이 검사도 지움) / `e2e/flights-redesign.spec.ts` 탑승권 칸 검사 — 들어오기 움직임 중 위치를 재면 흔들림 → 움직임 줄이기로 고정.
- 합친 뒤 e2e: 가짜 API 빌드로 582 통과 · 실패 19건은 모두 가짜 자료에 /geo · /log 자료와 핀란드 같은 나라가 없어서(변경과 무관 · 실제 자료 미리보기에서 확인).

## 계획 밖 변경 이유
- packages/ui/src/components/text/emph.tsx — 사진 막(group/photo · veil)을 알던 클래스 두 개 제거 (PhotoHeader 가 없어져 쓸 곳이 없음)
- packages/ui/src/lib/contrast.test.ts · apps/web/src/shared/{home-flap-board · redesign-foundation · number-emphasis · intro-window · intro-structure}.test.ts — 사진 막 · PhotoHeader 를 검사하던 줄 · 주석 정리
- apps/web/e2e/country-photos.spec.ts → country-pick.spec.ts 로 이름 변경 — 여행지 고르기 시트 · 칩 검사는 사진과 무관해 남기고 사진 줄만 지움 / e2e/flap-board.spec.ts 사진 구간 줄 정리
- apps/web/src/features/intro/lib/scene-types.ts · scene.ts · hooks/use-intro.ts — 안 쓰는 창문 카메라(zoomIn)와 옛 창문 설명 주석 삭제 (계획의 "인트로 남은 창문 코드 정리". 3D 장면의 다른 부분은 그대로)
- 합치기(0217 · 0216 · 0218~0221)로 들어온 파일은 이 작업의 변경이 아님

## 완료 기준
- [x] 0216(최신) · 0217 · 0218 · 0219 · 0220 · 0221 이 모두 합쳐짐 · 합치기 기록 작성
- [x] apps/web/public/images/photos · plane-sunset-og.jpg 없음 · 저장소 전체에서 /images/photos 를 부르는 코드 없음(인트로 포함)
- [x] 빌드 결과물: 모든 페이지 · 인트로 끝까지 /images/photos 요청 0 · 깨진 이미지 0 (e2e)
- [x] /about 사진 없는 머리 · 1280 · 390 가로 넘침 없음
- [x] bash .agents/checks.sh PASS · 빌드는 가짜 API 로(운영 D1 읽기 0) · 미리보기는 푸시 한 번
- [x] 작업 보드 0222 줄

## 허점
- 웹킷(사파리) 확인 못 함. e2e 는 `next dev` 가 이 환경에서 하이드레이션이 안 돼 못 쓰고 **가짜 API 로 만든 빌드**(운영 D1 읽기 0)로 돌림 — 전체 586 통과.
- 실패 18건: 17건은 가짜 자료 한계(/geo · /log 자료 · 핀란드 같은 유로 나라가 없음)로 변경과 무관. **1건은 0221 의 lead 커밋 151e0db 때문**: 넓은 화면(1280)에서 직구 계산 큰 문장이 기본 상태("면세 한도를 넘었습니다 · 관세율을 넣으면 세금을 계산합니다")일 때 3줄이 되는데 제목 자리를 2줄만 잡아 보내는 곳을 바꾸면 아래 구간(수입물가)이 약 62px 밀림 (calc-redesign.spec "보내는 곳을 바꿔도 … 크기 고정"). 0221 브랜치에서 고쳐야 함(3줄로 되돌리거나 문장을 줄임) — 이 브랜치에서는 고치지 않음.
- 사진을 지워서 사이트 파일이 약 5MB 줄어듦(빌드 결과물에 images 폴더 없음). 국기(SVG) · 인트로 3D 모델 · 텍스처는 사진이 아니라 그대로.
- 옛 작업 기록(.agents/specs/0175-user-photos · 0201-country-photos)은 이력이라 그대로 둠.
- `docs/design.md` 의 지구본 표(작업 0085) 줄은 옛 기록이라 그대로 둠(이미 "작업 0177 에서 없앰" 표시).

- 0217 홈 고칠 것 1~3 merge(task/0217-redesign-home bd1b48a): 충돌 없음. hero-section · ticket · destination-table · hooks/use-stagger-reveal.ts(새) · e2e/home-fix-0217.spec.ts(새)는 그대로, packages/ui use-count-up.ts 는 `enabled` 옵션만 더함(기본 켜짐 → 0219 · 0220 동작 그대로).
- 0217 lint 수정 merge(use-stagger-reveal.ts armed 를 useSyncExternalStore 로): 충돌 없음.
- 그래프 2D merge(0216 7a64c21 · 0217 34914c1 · 0218 af7e2ff · 0219 9b46a81 · 0220 d5f5a86 · 0221 b8f3578): 충돌은 테스트 파일 둘뿐 — apps/web/src/shared/font-readability.test.ts(허용 목록: 0217 hero-section · 0216 line-chart · 0220 ruler-chart 세 줄을 모두 남김) · apps/web/src/shared/redesign-foundation.test.ts(그림자 · 그라데이션 검사: 0222 쪽 주석(사진 머리 없음)을 남기고 0216 의 GRAPH_PARTS 허용 상수만 더함). 나머지 파일(LineChart · MonthBars · RulerChart · 각 화면)은 충돌 없음. packages/ui use-count-up.ts 는 이번엔 변경 없음.
