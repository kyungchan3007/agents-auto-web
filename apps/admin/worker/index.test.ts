// 어드민 Worker 진입점 (작업 0302 · 0312) — 검색 막음 · 프록시 · 방문 기록 없음
//   작업 0326: 입구(토큰 쿠키)가 모든 요청 앞에 있어 아래 시험은 로그인한 쿠키로 요청함 — 입구 시험은 gate/gate.test.ts
import { describe, expect, it, vi } from "vitest";
import { REVIEWER_NAME, cookieFor, gateEnv } from "./gate/test-kit";
import { OWNER_NAME } from "./gate/session";
import worker, { type Env } from "./index";

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

async function setup() {
  const assets = vi.fn(async (_r: Request) => new Response("<html>page</html>", { status: 200 }));
  const api = vi.fn(async (_r: Request) => Response.json({ ok: true }));
  const env: Env = { ASSETS: { fetch: assets }, API: { fetch: api }, ...(await gateEnv()) };
  const cookie = await cookieFor(REVIEWER_NAME);
  /** 로그인한 요청 — 쿠키를 붙여 Worker 를 부름 */
  const call = (url: string, init: RequestInit = {}) => worker.fetch(new Request(url, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), cookie } }), env);
  return { env, assets, api, call };
}

describe("어드민 Worker", () => {
  it("어드민 /geo 는 자산을 검색 막음 머리글과 함께 (봇 방문이어도 기록 기능 없음)", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/geo", { headers: { "user-agent": GOOGLEBOT } });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<html>page</html>");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("어드민 /bff/* 는 API 로 · 검색 막음 머리글", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/bff/activity");
    expect(s.api).toHaveBeenCalledTimes(1);
    expect(new URL(s.api.mock.calls[0]![0].url).pathname).toBe("/activity");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("운영 자료 경로(/bff/fx/latest)는 어드민 BFF 에 없음 → 404", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/bff/fx/latest");
    expect(res.status).toBe(404);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("접속 기록(/bff/admin-visits)은 리뷰어 토큰이면 404 · API 를 부르지 않음 (작업 0339)", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/bff/admin-visits");
    expect(res.status).toBe(404);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("접속 기록은 owner 토큰이면 API 로 (작업 0339)", async () => {
    const s = await setup();
    const cookie = await cookieFor(OWNER_NAME);
    const res = await worker.fetch(new Request("https://admin.flapfx.com/bff/admin-visits", { headers: { cookie } }), s.env);
    expect(res.status).toBe(200);
    expect(s.api).toHaveBeenCalledTimes(1);
    expect(new URL(s.api.mock.calls[0]![0].url).pathname).toBe("/admin-visits");
  });

  it("쓰기 요청은 405", async () => {
    const s = await setup();
    expect((await s.call("https://admin.flapfx.com/bff/activity", { method: "POST" })).status).toBe(405);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("어드민 robots.txt 는 전부 막음", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/robots.txt");
    expect(await res.text()).toBe("User-agent: *\nDisallow: /\n");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("방문자 페이지는 flapfx.com 으로 301 · 자산은 부르지 않음", async () => {
    const s = await setup();
    const res = await s.call("https://admin.flapfx.com/currencies/USD");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://flapfx.com/currencies/USD");
    expect(s.assets).not.toHaveBeenCalled();
  });
});
