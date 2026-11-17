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

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Quick)
- [ ] 아이콘 5개가 시안 A · 16px 탭에서 읽힘 · maskable 은 가운데 80% 안에 F
- [ ] Tripfx 검사 테스트 (먼저 FAIL 이면 걸린 곳을 고침 · 0 이면 그대로 통과)
- [ ] 브랜치 미리보기에서 탭 아이콘 · /icon.svg · /manifest 확인

## 허점
-
