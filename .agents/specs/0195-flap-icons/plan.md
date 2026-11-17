# 계획

## 무엇을 · 왜
- 파비콘 · 앱 아이콘이 예전 검정 바탕 오로라 지구 그림 그대로다 (#222). 사용자가 시안 A(플랩 칸 F · 남색 바탕 · 안내판 칸 한 장에 노란 굵은 F · 가운데 이음선)를 골랐다.
- 시안 원본: 이 worktree 의 `.tmp/icons-0195/a.svg` · `a-maskable.svg`
- 사이트 이름으로 남은 Tripfx 를 저장소 전체에서 다시 검사하는 테스트를 넣는다 (지난 기록 · API 이름 tripfx-api 제외).

## 애매한 곳
- PNG 는 SVG 에서 그대로 굽는다 (180 · 192 · 512 · maskable 512) — 새 의존성(보호 파일 package-lock) 없이 이미 있는 도구(playwright 브라우저 캡처 등)로 (가정).
- Tripfx 검사 범위: apps · packages · docs · README 의 추적 파일 · 빼는 것 = `.agents/specs` · `apps/api/data` · 지난 기록을 보여 주는 화면 자료 · `tripfx-api`(Worker 이름 · 주소) · 그 이름을 쓰는 설정/테스트 (가정 · 빼는 목록은 테스트 안에 이유와 함께).

## 파일 계획
- apps/web/src/app/icon.svg · apps/web/src/app/apple-icon.png
- apps/web/public/icons/icon-192.png · icon-512.png · icon-maskable-512.png
- apps/web/src/app/manifest.ts (색 · 이름이 아이콘과 맞지 않으면)
- apps/web/src/shared/old-name.test.ts (Tripfx 잔존 검사)
- 검사에 걸린 사이트 이름 Tripfx 를 고치는 파일 (그때 계획 밖 변경 이유에 적음)
- .agents/specs/0195-flap-icons/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/api/src/features/geo/ask.ts — 옛 이름 검사에 걸린 주석 한 줄(옛 주소 tripfx.pages.dev 를 "옛 Pages 주소"로 풀어 씀) · 사이트 이름 잔존이라 고침

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick)
- [x] 아이콘 5개가 시안 A · 16px 탭에서 읽힘 · maskable 은 가운데 80% 안에 F
- [x] Tripfx 검사 테스트 (먼저 FAIL 이면 걸린 곳을 고침 · 0 이면 그대로 통과)
- [ ] 브랜치 미리보기에서 탭 아이콘 · /icon.svg · /manifest 확인

## 허점
- 검사 테스트에서 뺀 곳은 모두 지난 기록 · API 이름 tripfx-api · 보호 파일 · 날짜 붙은 결정 기록(옛 주소) — 이유는 old-name.test.ts 목록에 있음. docs/architecture.md · project-facts.md 는 0197(#229) 과 같은 줄이 겹쳐 고치지 않고 옛 주소 언급만 허용.
- apps/api/src/features/geo/gsc.ts 의 Search Console 속성 GSC_SITE 가 아직 옛 주소(tripfx.pages.dev) — 새 주소(flapfx.com) 속성 등록은 사람이 정할 일이라 바꾸지 않음(리드에게 보고).
- manifest 색(배경 · 테마 #EAF4F2)은 사이트 바탕과 같아 그대로 — 새 아이콘 남색과 어긋나지 않음(스플래시 바탕이 하늘 종이).
- PNG 는 캡처로 구워 SVG 와 같은 그림이지만 16px 탭 실제 모습은 미리보기에서 확인(리드).
