import { describe, expect, it, vi } from "vitest";
import { type TrackDb, trackVisit } from "./track-visit";

const NOW = new Date("2026-11-05T15:30:00Z");

function setup(ua: string | null, opts: { path?: string; status?: number; fail?: boolean; referer?: string } = {}) {
  const run = vi.fn(async () => {
    if (opts.fail) throw new Error("no table");
  });
  const bind = vi.fn(() => ({ run }));
  const db: TrackDb = { prepare: () => ({ bind }) };
  const waits: Promise<unknown>[] = [];
  const headers: Record<string, string> = {};
  if (ua) headers["user-agent"] = ua;
  if (opts.referer) headers.referer = opts.referer;
  const res = new Response("ok", { status: opts.status ?? 200 });
  const ctx = { request: new Request(`https://tripfx.pages.dev${opts.path ?? "/"}`, { headers }), next: async () => res, env: { DB: db }, waitUntil: (p: Promise<unknown>) => waits.push(p) };
  return { ctx, res, bind, waits };
}

describe("GEO 방문 기록 (작업 0129)", () => {
  it("봇 방문은 한국 날짜로 한 줄 · 응답은 그대로", async () => {
    const t = setup("compatible; GPTBot/1.3", { path: "/about" });
    expect(await trackVisit(t.ctx, NOW)).toBe(t.res);
    expect(t.bind).toHaveBeenCalledWith("2026-11-06", "training", "GPTBot", "/about");
  });
  it("일반 방문은 저장하지 않음", async () => {
    const t = setup("Mozilla/5.0 Chrome");
    await trackVisit(t.ctx, NOW);
    expect(t.bind).not.toHaveBeenCalled();
  });
  it("표가 없어 저장이 실패해도 페이지는 정상", async () => {
    const t = setup("GPTBot", { fail: true });
    expect((await trackVisit(t.ctx, NOW)).status).toBe(200);
    await expect(Promise.all(t.waits)).resolves.toBeDefined();
  });
  it("실패한 응답 · D1 없음은 기록하지 않음", async () => {
    const a = setup("GPTBot", { status: 404 });
    await trackVisit(a.ctx, NOW);
    expect(a.bind).not.toHaveBeenCalled();
    const b = setup("GPTBot");
    expect((await trackVisit({ ...b.ctx, env: {} }, NOW)).status).toBe(200);
  });
});
