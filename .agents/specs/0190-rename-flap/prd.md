# PRD — 무엇을 · 왜

> 원문(request.md)을 옮긴 파생 문서. 요구 충족 판정 기준은 언제나 원문이다

## 문제
- 사이트 이름이 플랩 · 주소가 flapfx.com 으로 바뀌었고(#208 · #209 · #211), 옛 Pages(tripfx.pages.dev)는 지웠다.
- 그런데 화면 · 검색용 정보는 아직 "Tripfx" · `tripfx.pages.dev` 를 말한다 → 검색 엔진은 없는 주소를 원본으로 알고, 방문자는 옛 이름을 본다.
- 저장소에 옛 Pages 설정(맨 위 `wrangler.jsonc` · `functions/` · `public/_routes.json`)이 남아 있고, Worker 설정 이름(flapfx)이 실제 Worker(agents-auto-web)와 달라 배포마다 경고가 난다.

## 목표
- 방문자에게 보이는 이름: 페이지 제목 · 설명 · 공유 미리보기 · 아이콘 · 메뉴 로고 · 인트로 · 404 → **플랩** (로고 글자는 주소와 같은 `flapfx`)
- 기준 주소 `SITE_URL` = `https://flapfx.com` → canonical · sitemap · robots · og · IndexNow 가 새 주소
- 브라우저 저장 키 · 이벤트 `tripfx:*` → `flapfx:*` (확인됨: "같이 바꿔서") · 운영 확인 머리글 `Tripfx-Verify` → `Flapfx-Verify`
- AI 답변 측정에서 "우리 사이트" 판정 주소 → flapfx.com (+ www · Worker 미리보기 주소)
- 옛 Pages 설정 삭제 · Worker 설정 이름을 `agents-auto-web` 으로 · 사용자 지정 도메인을 설정에 명시
- 문서 · README · 워크플로 주석 · 반응형 점검 기본 주소를 새 이름 · 주소로

## 비목표
- API Worker(`tripfx-api`) 이름 · 주소 · `TRIPFX_API_URL` (사이트 밖 · 바꾸면 수집 · 바인딩 전부 영향)
- AI 측정 **질문 문구**(브랜드 질문 "Tripfx …") — #215 (질문 3판)에서
- Search Console 속성 주소(`GSC_SITE`) — 새 속성을 사람이 만든 뒤 #214 에서 (지금 바꾸면 매일 동기화가 실패)
- 지난 측정 결과 파일 · 지난 작업 문서 속 옛 이름 (기록이라 그대로)
- `docs/images/architecture.png` 다시 그리기 (원본 svg 제목만 바꿈)

## 애매한 곳
- 로고 글자: 한글 "플랩" 대신 주소와 같은 소문자 `flapfx` (가정: 지금 로고도 주소와 같은 소문자 `tripfx` 였음)
- 저장 키가 바뀌면 기존 방문자의 즐겨찾기 · 고른 여행지가 한 번 사라짐 (확인됨: 같이 바꿈)

## 완료 기준
- [ ] bash .agents/checks.sh PASS (보호 파일은 harness-approved 라벨로 승인)
- [ ] 저장소에서 `tripfx.pages.dev` 가 비목표(지난 기록 · GSC_SITE) 말고는 남지 않음
- [ ] Full 게이트(build · e2e) 통과
- [ ] 머지 뒤 flapfx.com 에서 제목 · canonical · sitemap · robots · og 가 새 이름 · 주소
