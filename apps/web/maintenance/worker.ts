// 사이트 점검 화면 Worker (작업 0387) — 사이트 빌드 · 데이터 · D1 · API 와 따로 서서 사이트가 어떻게 깨져도 뜸 · 운영에 켜고 끄는 법은 docs/maintenance.md
//   모든 요청(/robots.txt 포함)에 index.html 을 503 으로 돌려줌 · 사이트 wrangler.jsonc 는 쓰지 않음(켜기 스크립트가 인자만으로 배포)
import html from "./index.html";
import { handle } from "./respond";

const worker = {
  fetch: (request: Request): Response => handle(request, html),
};

export default worker;
