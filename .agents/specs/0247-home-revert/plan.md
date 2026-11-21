# 계획 — 작업 0247 · 홈 첫 화면 두 단 되돌리기 (Quick · 0245 의 홈만)

요구 원본: [handoff.md](handoff.md).

## 무엇을
- 홈을 0245 이전(`3bd4a14`) 그대로: 가운데 큰 제목 아래 탑승권 카드 · 화면 높이별 분기 포함.
- 직구 휴대폰 머리(b8d6953) · 작은 글자판 이음선(7cfd8eb) · calc-title.spec.ts · calc-blue.test.ts 는 그대로.

## 결정 (lead)
- 방법: **파일 단위 되돌리기** — 아래 6개 파일을 `3bd4a14` 때 내용으로(`git checkout 3bd4a14 -- <파일>`). 3bd4a14 이후 이 6개 파일을 바꾼 커밋은 db07aa3 · 08c70b8 · 6b6d983 뿐이고, 글자판 이음선 커밋(7cfd8eb)은 홈 파일을 건드리지 않았다 → 유지할 부분이 섞이지 않는다.
- 새 테스트 없음. 되돌린 e2e 는 0245 이전에 통과하던 것.
- 0246(게이트)과 겹침 방지: 0246 의 test 에게 이 세 홈 spec 에는 @design 을 붙이지 말라고 알림(07:39Z).

## 누가 · 순서
1. builder — 화면 3 파일 되돌리기 · 커밋 하나
2. test — e2e 3 파일 되돌리기 · 커밋 하나 · e2e(home · home-redesign · home-fix-0217) 로컬 실행 · 1280 이 운영과 같은 가운데 정렬인지
3. lead — PR(base develop) · CI gate · 미리보기 주소 회신

## 파일 계획
- apps/web/src/features/home/components/hero-section.tsx
- apps/web/src/features/home/components/home.tsx
- apps/web/src/features/home/components/ticket.tsx
- apps/web/e2e/home-fix-0217.spec.ts
- apps/web/e2e/home-redesign.spec.ts
- apps/web/e2e/home.spec.ts
- .agents/orchestration/TASKS.md
