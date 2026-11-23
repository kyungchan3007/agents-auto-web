# 계획

## 무엇을 · 왜
- 네이버 서치어드바이저 소유 확인 태그(`naver-site-verification`)를 넣을 자리를 만든다. 값은 shared/site.ts 상수 한 곳 · 비어 있으면 태그를 내지 않는다. 지금 값은 빈 문자열(사용자가 받아 알려 주면 넣음 · 지어내지 않음)
- 작업 종류 ③(동작 — 값 유무에 따라 태그가 나오고 안 나옴): 단위 테스트를 새로 쓴다
- 운영 화면 모양 변화 없음 → 변경 기록(.changeset) 없음

## 이미 있어 만들지 않는 것 (확인함 · 11-23)
- IndexNow: 키 파일 apps/web/public/a6932e161e92d438629d7ca38466be2c.txt (운영 https://flapfx.com/<키>.txt → 200) · 스크립트 apps/web/scripts/indexnow{,-lib}.ts · 매일 워크플로 .github/workflows/indexnow.yml(평일 · 최근 11-16 ~ 11-20 모두 "26개 주소 보냄 · HTTP 200") — 작업 0133 · 0144 · 0146
  - 작업서의 "한 번 돌려 결과 적기"는 기존 워크플로를 전체 주소(all)로 한 번 돌려 HTTP 코드를 적는다
- robots: 운영 robots.txt 는 모두 허용(/design 만 막음) · Yeti · bingbot 이름으로 / · /sitemap.xml 요청 모두 200

## 요구
1. 네이버 값이 비어 있으면 verification.other 에 `naver-site-verification` 키가 없다 (Bing `msvalidate.01` 은 그대로)
2. 네이버 값이 있으면 verification.other 에 `naver-site-verification: <값>` 이 더해진다
3. 값 조립은 순수 함수 하나(예: shared 의 verificationOther) — layout.tsx 는 그 결과만 씀(tsx 에 로직 없음)

## 애매한 곳
- 없음 (값은 사용자 회신 뒤 별도 한 줄 변경)

## 파일 계획
- apps/web/src/shared/site.ts (builder · 상수 NAVER_SITE_VERIFICATION)
- apps/web/src/shared/** 안 순수 함수 파일 1개 (builder)
- apps/web/src/app/layout.tsx (builder)
- 위 순수 함수 옆 *.test.ts (test)
- .agents/specs/0317-naver-verify/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 요구 1 · 2 단위 테스트
- [ ] 머지 · main 반영 뒤 IndexNow 워크플로 전체 주소로 한 번 · HTTP 코드 기록

## 허점
- 작업서가 이미 있는 IndexNow 를 새로 만들라고 적었다 — 작업 전 저장소에서 같은 기능을 찾아본다
