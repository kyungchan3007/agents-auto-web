# 계획

## 무엇을 · 왜
- Bing 이 /prices 제목을 "Title too short" 로 잡았다. 짧은 하위 페이지 제목 5곳을 30 ~ 60자로, /currencies 설명을 70 ~ 155자로 늘린다
- 작업 종류 ①(문구만) — 새 테스트 없음. 제목 · 설명을 고정해 둔 기존 테스트가 깨지면 test 가 고친다
- 운영 화면 문구가 바뀜 → .changeset 에 `"@hav/web": patch` 한 줄 (builder)

## 요구 (문구 기준)
1. 대상: /prices · /calc · /currencies · /about · /currencies/[코드] 제목 · /currencies 설명
2. 제목 길이 30 ~ 60자(공백 포함 · " · Flapfx" 포함). 통화 상세는 가장 짧은 통화 이름에서도 30자 이상
3. 그 페이지가 실제로 보여 주는 것만 적는다 — 화면 · 코드와 대조. 과장 · 예측("오를 · 내릴") · 자료 제공처 이름 넣지 않음
4. 형식은 지금처럼 "무엇 · 무엇 · Flapfx" 줄임 형식을 따른다 (긴 줄표 대신 " · ")
5. /currencies 설명 70 ~ 155자

## 애매한 곳
- 문구 자체는 builder 가 페이지를 읽고 쓰고, lead 가 PR 전 화면 · 코드와 대조해 본다 (가정)

## 파일 계획
- apps/web/src/app/{prices,calc,about}/page.tsx · apps/web/src/app/currencies/layout.tsx · apps/web/src/app/currencies/[code]/page.tsx (builder)
- .changeset/*.md (builder)
- 제목 · 설명을 고정한 기존 테스트 (test · 깨질 때만)
- .agents/specs/0319-seo-titles/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 머지 · main 반영 뒤 Bing Live URL 재검사는 사용자

## 허점
- 
