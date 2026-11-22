// 어드민 Worker 진입점 (작업 0302 · 0312) — 검색 막음 · 프록시 · 방문 기록 없음
import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function setup() {
  const assets = vi.fn(async (_r: Request) => new Response("<html>page</html>", { status: 200 }));
  const api = vi.fn(async (_r: Request) => Response.json({ ok: true }));
  const env: Env = { ASSETS: { fetch: assets }, API: { fetch: api } };
  return { env, assets, api };
}

describe("어드민 Worker", () => {
  it("어드민 /geo 는 자산을 검색 막음 머리글과 함께 (봇 방문이어도 기록 기능 없음)", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://admin.flapfx.com/geo", { headers: { "user-agent": GOOGLEBOT } }), s.env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<html>page</html>");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("어드민 /bff/* 는 API 로 · 검색 막음 머리글", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://admin.flapfx.com/bff/activity"), s.env);
    expect(s.api).toHaveBeenCalledTimes(1);
    expect(new URL(s.api.mock.calls[0]![0].url).pathname).toBe("/activity");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("운영 자료 경로(/bff/fx/latest)는 어드민 BFF 에 없음 → 404", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://admin.flapfx.com/bff/fx/latest"), s.env);
    expect(res.status).toBe(404);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("쓰기 요청은 405", async () => {
    const s = setup();
    expect((await worker.fetch(new Request("https://admin.flapfx.com/bff/activity", { method: "POST" }), s.env)).status).toBe(405);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("어드민 robots.txt 는 전부 막음", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://admin.flapfx.com/robots.txt"), s.env);
    expect(await res.text()).toBe("User-agent: *\nDisallow: /\n");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("방문자 페이지는 flapfx.com 으로 301 · 자산은 부르지 않음", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://admin.flapfx.com/currencies/USD"), s.env);
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://flapfx.com/currencies/USD");
    expect(s.assets).not.toHaveBeenCalled();
  });
});
