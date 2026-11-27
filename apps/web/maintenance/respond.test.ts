// 작업 0387 — 점검 화면 응답 만드는 순수 함수 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: apps/web/maintenance/respond.ts (순수 .ts · worker.ts 가 index.html 글을 넘겨 부름 · .html 가져오기가 없어 단위 테스트가 가능)
//   export function maintenanceResponse(html: string): Response
//     → 상태 503 · 헤더 Retry-After: 3600 · Cache-Control: no-store · content-type: text/html; charset=utf-8 · 본문은 받은 html 그대로
//   export function handle(request: Request, html: string): Response
//     → 요청 주소 · 방법과 상관없이(/ · /currencies/USD · /없는주소 · /robots.txt · POST 도) 같은 점검 응답. 요청을 읽어 바꾸지 않음
//   worker.ts 는 import html from "./index.html" 로 글을 묶고 export default { fetch: (request) => handle(request, html) } 만 함
import { describe, expect, it } from "vitest";
import { handle, maintenanceResponse } from "./respond";

const HTML = "<!doctype html><html lang=\"ko\"><head><title>점검 중</title></head><body><main><h1>점검 중입니다</h1></main></body></html>";

describe("maintenanceResponse — 점검 응답", () => {
  const res = maintenanceResponse(HTML);

  it("상태 503", () => {
    expect(res.status).toBe(503);
  });
  it("Retry-After 3600(1시간 뒤 다시 시도)", () => {
    expect(res.headers.get("retry-after")).toBe("3600");
  });
  it("Cache-Control no-store — 검색엔진 · 중간 서버가 점검 화면을 저장하지 않음", () => {
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it("content-type text/html; charset=utf-8", () => {
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });
  it("본문은 받은 점검 화면 HTML 그대로", async () => {
    expect(await res.text()).toBe(HTML);
  });
  it("부를 때마다 새 응답(본문을 한 번만 읽을 수 있어 같은 객체를 돌려주면 두 번째 요청이 깨짐)", async () => {
    const [a, b] = [maintenanceResponse(HTML), maintenanceResponse(HTML)];
    expect(a).not.toBe(b);
    expect(await a.text()).toBe(await b.text());
  });
});

describe("handle — 어떤 요청이든 점검 응답", () => {
  const paths = ["/", "/currencies/USD", "/prices/JPN", "/없는주소", "/robots.txt", "/sitemap.xml", "/_next/static/chunks/a.js", "/api/anything?x=1", "/geo"];
  for (const path of paths) {
    it(`GET ${path} → 503 · Retry-After 3600 · no-store · 점검 HTML`, async () => {
      const res = handle(new Request(`https://flapfx.com${path}`), HTML);
      expect(res.status).toBe(503);
      expect(res.headers.get("retry-after")).toBe("3600");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(await res.text()).toBe(HTML);
    });
  }

  it("www 주소 · POST · HEAD · 조건부 요청 헤더가 있어도 같은 503 (304 · 리다이렉트 없음)", async () => {
    for (const init of [{ method: "POST", body: "x" }, { method: "PUT", body: "x" }, { method: "DELETE" }, { headers: { "if-none-match": "abc", "if-modified-since": "Wed, 21 Oct 2026 07:28:00 GMT" } }]) {
      const res = handle(new Request("https://www.flapfx.com/", init as RequestInit), HTML);
      expect(res.status, JSON.stringify(init)).toBe(503);
      expect(res.headers.get("retry-after")).toBe("3600");
    }
    const head = handle(new Request("https://flapfx.com/", { method: "HEAD" }), HTML);
    expect(head.status).toBe(503);
    expect(head.headers.get("cache-control")).toBe("no-store");
  });

  it("/robots.txt 도 점검 화면(503) — 검색엔진은 503 을 일시 중단으로 보고 색인을 지우지 않음 · robots.txt 를 따로 열어 두지 않음", async () => {
    const res = handle(new Request("https://flapfx.com/robots.txt"), HTML);
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("text/html");
  });
});

describe("점검 화면 HTML 파일(index.html)", () => {
  it("외부 파일 없이 혼자 서는 한 장 — 바깥 주소(src · href · url() · @import)를 가져오지 않음", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const html = readFileSync(join(__dirname, "index.html"), "utf8");
    expect(html).not.toMatch(/<script[^>]+\bsrc=/i);
    expect(html).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
    expect(html).not.toMatch(/@import|url\(\s*["']?https?:/i);
    expect(html).not.toMatch(/<img[^>]+src=["']?https?:/i);
    expect(html).toMatch(/<meta[^>]+name=["']viewport["']/i);
    expect(html).toMatch(/<html[^>]+lang=["']ko["']/i);
  });
  it("이름 있는 제목 하나(h1) · 비밀값 · 토큰이 없음", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const html = readFileSync(join(__dirname, "index.html"), "utf8");
    expect((html.match(/<h1\b/gi) ?? []).length).toBe(1);
    expect(html).not.toMatch(/api[_-]?key|token|secret|password/i);
  });
});
