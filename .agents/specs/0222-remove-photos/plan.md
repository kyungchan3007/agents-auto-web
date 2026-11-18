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

## 계획 밖 변경 이유

## 완료 기준
- [ ] 0216(최신) · 0218 · 0219 · 0220 · 0221 이 모두 합쳐짐 · 합치기 기록 작성
- [ ] apps/web/public/images/photos · plane-sunset-og.jpg 없음 · 저장소 전체에서 /images/photos 를 부르는 코드 없음(인트로 포함)
- [ ] 빌드 결과물: 모든 페이지 · 인트로 끝까지 /images/photos 요청 0 · 깨진 이미지 0 (e2e)
- [ ] /about 사진 없는 머리 · 1280 · 390 가로 넘침 없음
- [ ] bash .agents/checks.sh PASS · 빌드는 가짜 API 로(운영 D1 읽기 0) · 미리보기는 푸시 한 번
- [ ] 작업 보드 0222 줄

## 허점
-
