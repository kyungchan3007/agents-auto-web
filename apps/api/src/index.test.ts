import { describe, expect, it, vi } from "vitest";
import type { Env } from "./env";
import { app } from "./index";

const envWith = (first: () => Promise<unknown>) =>
  ({ DB: { prepare: () => ({ first }) } }) as unknown as Env;

describe("GET /health", () => {
  it("DB 가 응답하면 200 · ok", async () => {
    const res = await app.request("/health", {}, envWith(async () => ({ ok: 1 })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, service: "tripfx-api", db: true });
  });

  it("DB 가 실패하면 503 · ok false (숨기지 않음)", async () => {
    const res = await app.request("/health", {}, envWith(async () => { throw new Error("down"); }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, db: false });
  });
});

describe("Cron 설정", () => {
  it("wrangler.jsonc 의 crons 와 코드의 CRON 이 같다 (한쪽만 바꾸면 예약 실행이 엉뚱한 수집을 함)", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { CRON } = await import("./index");
    const jsonc = readFileSync(fileURLToPath(new URL("../wrangler.jsonc", import.meta.url).href), "utf8");
    const crons = JSON.parse(/"crons":\s*(\[[^\]]*\])/.exec(jsonc)![1]);
    expect(crons.sort()).toEqual(Object.values(CRON).sort());
  });
});

describe("처리하지 못한 예외 (작업 0127)", () => {
  it("한 가지 JSON 모양 500 · 자세한 내용은 응답에 없고 로그에만", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broken = { DB: { prepare: () => { throw new Error("db authkey=SECRET down"); } } } as unknown as Env;
    const res = await app.request("/tasks", {}, broken);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: "서버 오류가 발생했습니다" });
    expect(text).not.toContain("SECRET");
    const line = String(err.mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({ level: "error", event: "request_failed", path: "/tasks" });
    expect(line).not.toContain("SECRET");
    err.mockRestore();
  });
});
