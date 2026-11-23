# 계획

## 무엇을 · 왜
- 작업 0317 에서 만든 상수 NAVER_SITE_VERIFICATION 에 사용자가 받은 content 값 `657e110e78edffb518950a04c8044bae5f063146` 을 넣는다 (공개되는 값 · 비밀 아님)
- 작업 종류 ①(값 하나) — 새 테스트 없음 · 운영 화면 모양 변화 없음 → 변경 기록 없음
- 머지 → main fast-forward → 배포 뒤 운영 HTML 에 `<meta name="naver-site-verification" content="657e110e78edffb518950a04c8044bae5f063146"/>` 가 나오는지 lead 가 확인

## 애매한 곳
- 없음

## 파일 계획
- apps/web/src/shared/site.ts (builder)
- .agents/specs/0320-naver-value/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 운영 HTML 에 네이버 meta 태그

## 허점
- 
