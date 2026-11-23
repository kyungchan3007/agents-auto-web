# 계획

## 무엇을 · 왜
- 어드민 알리기 탭은 날짜 폴더 하나에 게시물 하나(문구.md · image.png)만 읽는다. 11-23 칸에 이미 사용자 게시물이 있어, 엔화 릴스 · 캐러셀을 함께 두려면 한 날짜 칸 안에 여러 게시물을 읽어야 한다
- 방식: 날짜 폴더 바로 아래 문구.md(지금 게시물)는 그대로 + 날짜 폴더 안 하위 폴더(영문 소문자 · 숫자 · 하이픈 이름)마다 문구.md · image.png 를 게시물 하나로 읽어 같은 날 칸에 함께 보임
  - docs/marketing/2026-11-23/yen-reel/ (릴스 · 그림은 표지) · docs/marketing/2026-11-23/yen-carousel/ (캐러셀 · 그림은 첫 장)
- 작업 종류 ③(읽는 규칙이 바뀜) — 단위 테스트를 새로 씀 · 어드민만 → 변경 기록 없음 · 머지 뒤 바로 main fast-forward

## 요구
1. 날짜 폴더의 문구.md(있으면)와 하위 폴더마다의 문구.md 를 각각 게시물로 읽음 · 문구.md 없는 하위 폴더 · 이름 규칙 밖 하위 폴더는 읽지 않음
2. 순서: 최근 날부터 · 같은 날 안에서는 날짜 폴더 바로 아래 게시물 먼저, 그다음 하위 폴더 이름순
3. 같은 날 게시물이 여러 개여도 카드 key 가 겹치지 않음(날짜 + 하위 폴더 이름)
4. 그림: 하위 게시물은 R2 `{날짜}-{하위 폴더}.jpg` → 저장소 raw `{날짜}/{하위 폴더}/image.png` (지금 날짜 폴더 게시물 규칙은 그대로)
5. 지금 있는 날짜 폴더 게시물은 모습 · 순서 그대로

## 애매한 곳
- 없음

## 파일 계획
- apps/admin/src/features/marketing/drafts/{drafts.ts,read-drafts.server.ts,draft-card.tsx} · apps/admin/src/features/marketing/marketing-page.tsx(key) (builder)
- apps/admin/src/features/marketing/drafts/drafts.test.ts (test)
- docs/marketing/2026-11-23/{yen-reel,yen-carousel}/** (geo 준비 · lead 가 옮김)
- .agents/specs/0327-marketing-multi-post/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 요구 1 ~ 4 단위 테스트

## 허점
- 
