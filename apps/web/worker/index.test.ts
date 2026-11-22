// 사이트 Worker 진입점 (작업 0189) — 경로 나눔 · 방문 기록 · 자산 넘김
import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function setup() {
  const assets = vi.fn(async (_r: Request) => new Response("<html>page</html>", { status: 200 }));
  const api = vi.fn(async (_r: Request) => Response.json({ ok: true }));
  const run = vi.fn(async () => undefined);
  const bind = vi.fn(() => ({ run }));
  const env: Env = { ASSETS: { fetch: assets }, API: { fetch: api }, DB: { prepare: () => ({ bind }) } };
  const waits: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) };
  return { env, ctx, assets, api, bind, waits };
}

describe("사이트 Worker (작업 0189)", () => {
  it("/bff/* 는 API 로 넘기고 정적 자산은 부르지 않음", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://flapfx.com/bff/fx/latest"), s.env, s.ctx);
    expect(res.status).toBe(200);
    expect(s.api).toHaveBeenCalledTimes(1);
    expect(new URL(s.api.mock.calls[0]![0].url).pathname).toBe("/fx/latest");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("/bff 아래 쓰기 요청은 405 (프록시 규칙 그대로)", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://flapfx.com/bff/activity", { method: "POST" }), s.env, s.ctx);
    expect(res.status).toBe(405);
    expect(s.api).not.toHaveBeenCalled();
  });

  it("/bffx 처럼 /bff 로 시작만 하는 주소는 프록시가 아님", async () => {
    const s = setup();
    await worker.fetch(new Request("https://flapfx.com/bffx"), s.env, s.ctx);
    expect(s.api).not.toHaveBeenCalled();
    expect(s.assets).toHaveBeenCalledTimes(1);
  });

  it("페이지는 정적 자산을 그대로 돌려주고 검색 봇 방문은 뒤에서 기록", async () => {
    const s = setup();
    const req = new Request("https://flapfx.com/currencies/USD", { headers: { "user-agent": GOOGLEBOT } });
    const res = await worker.fetch(req, s.env, s.ctx);
    expect(await res.text()).toBe("<html>page</html>");
    expect(s.assets).toHaveBeenCalledWith(req);
    expect(s.bind).toHaveBeenCalledTimes(1);
    expect(s.waits).toHaveLength(1);
  });

  it("flapfx.com/log 는 어드민 주소로 301 · 자산 · 기록 없음 (작업 0302)", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://flapfx.com/log"), s.env, s.ctx);
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://admin.flapfx.com/log");
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("미리보기 주소의 /log 는 지금처럼 자산 (작업 0302)", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://develop-agents-auto-web.developfff.workers.dev/log"), s.env, s.ctx);
    expect(res.status).toBe(200);
    expect(s.assets).toHaveBeenCalledTimes(1);
  });

  it("일반 방문은 기록하지 않음 · DB 가 없어도 페이지는 나옴", async () => {
    const s = setup();
    const res = await worker.fetch(new Request("https://flapfx.com/"), { ...s.env, DB: undefined }, s.ctx);
    expect(res.status).toBe(200);
    expect(s.bind).not.toHaveBeenCalled();
  });
});
