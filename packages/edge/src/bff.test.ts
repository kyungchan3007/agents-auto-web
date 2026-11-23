import { describe, expect, it } from "vitest";
import { type ApiBinding, type BffRoute, handleBff } from "./bff";

// 예전 한 Worker 의 경로표 그대로 — 프록시 동작(허용 · 캐시 · 실패) 검사용 · 앱별 경로표는 apps/*/worker/bff-routes.test.ts
const ROUTES: BffRoute[] = [
  [/^\/activity$/, 3],
  [/^\/fx\/latest$/, 300],
  [/^\/fx\/[A-Za-z]{3}\/history$/, 300],
  [/^\/signal(\/[A-Za-z]{3})?$/, 300],
  [/^\/prices\/levels$/, 300],
  [/^\/indicators\/[a-z0-9-]+:[A-Za-z0-9-]+$/, 300],
  [/^\/tasks$/, 60],
  [/^\/geo$/, 300],
  [/^\/status$/, 60],
];
const bff = (r: Request, api: ApiBinding) => handleBff(r, api, ROUTES);

/** 받은 요청을 기록하는 가짜 API */
const fakeApi = (respond: (r: Request) => Response | Promise<Response> = () => Response.json({ ok: true })) => {
  const seen: Request[] = [];
  const api: ApiBinding = { fetch: async (r) => (seen.push(r), respond(r)) };
  return { api, seen };
};
const get = (path: string, init?: RequestInit) => new Request(`https://flapfx.com${path}`, init);

describe("BFF 허용 경로", () => {
  it("읽기 경로는 API 로 넘기고 쿼리도 그대로", async () => {
    const { api, seen } = fakeApi();
    const res = await bff(get("/bff/activity?after=3&limit=10"), api);
    expect(res.status).toBe(200);
    expect(new URL(seen[0].url).pathname + new URL(seen[0].url).search).toBe("/activity?after=3&limit=10");
    for (const p of ["/bff/fx/latest", "/bff/fx/usd/history", "/bff/signal", "/bff/signal/JPY", "/bff/prices/levels", "/bff/tasks"]) {
      expect((await bff(get(p), api)).status, p).toBe(200);
    }
  });

  it("관리 · 모르는 경로는 API 에 닿지도 않고 404", async () => {
    const { api, seen } = fakeApi();
    for (const p of ["/bff/fx/collect", "/bff/prices/collect", "/bff/health", "/bff/activity/1", "/bff/../fx/collect"]) {
      expect((await bff(get(p), api)).status, p).toBe(404);
    }
    expect(seen).toHaveLength(0);
  });

  it("쓰기(POST)는 405 — 작업 기록은 훅만 씀", async () => {
    const { api, seen } = fakeApi();
    expect((await bff(get("/bff/activity", { method: "POST", body: "{}" }), api)).status).toBe(405);
    expect(seen).toHaveLength(0);
  });

  it("쿠키 · 인증 머리글은 API 로 넘기지 않음", async () => {
    const { api, seen } = fakeApi();
    await bff(get("/bff/activity", { headers: { cookie: "a=b", authorization: "Bearer x" } }), api);
    expect(seen[0].headers.get("cookie")).toBeNull();
    expect(seen[0].headers.get("authorization")).toBeNull();
  });
});

describe("BFF 캐시 · 실패", () => {
  it("작업 기록 3초 · 환율 5분", async () => {
    const { api } = fakeApi();
    expect((await bff(get("/bff/activity"), api)).headers.get("cache-control")).toBe("public, max-age=3");
    expect((await bff(get("/bff/fx/latest"), api)).headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("API 실패 응답은 상태 그대로 · 캐시 안 함", async () => {
    const { api } = fakeApi(() => Response.json({ error: "x" }, { status: 503 }));
    const res = await bff(get("/bff/fx/latest"), api);
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("API 에 닿지 못하면 502", async () => {
    const { api } = fakeApi(() => Promise.reject(new Error("down")));
    expect((await bff(get("/bff/fx/latest"), api)).status).toBe(502);
  });
});

describe("과세환율 시계열 경로 (작업 0163)", () => {
  it("/bff/indicators/<series> 는 API 로 넘기고 쿼리도 그대로 · 5분 캐시", async () => {
    const { api, seen } = fakeApi();
    const res = await bff(get("/bff/indicators/kcs-import:USD?limit=26"), api);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(new URL(seen[0].url).pathname + new URL(seen[0].url).search).toBe("/indicators/kcs-import:USD?limit=26");
    expect((await bff(get("/bff/indicators/kosis-cpi:air-fare"), api)).status).toBe(200);
  });

  it("목록 · 모르는 모양 · 쓰기는 API 에 닿지도 않음", async () => {
    const { api, seen } = fakeApi();
    for (const p of ["/bff/indicators", "/bff/indicators/", "/bff/indicators/a:b/c", "/bff/indicators/collect", "/bff/indicators/../fx/collect"]) {
      expect((await bff(get(p), api)).status, p).toBe(404);
    }
    expect((await bff(get("/bff/indicators/kcs-import:USD", { method: "POST", body: "{}" }), api)).status).toBe(405);
    expect(seen).toHaveLength(0);
  });
});

// 작업 0326 — 어드민 BFF 는 API 에 어드민 열쇠(x-admin-key)를 붙임 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   handleBff(request, api, routes, options?: { apiKey?: string }) — 4번째 인자는 선택 · 주면 API 요청에 x-admin-key 머리글 · 안 주면(운영 사이트 Worker) 머리글 없음 · 지금 동작 그대로
describe("BFF 어드민 열쇠 (작업 0326)", () => {
  const KEY = "test-admin-api-key-0326";
  const headersText = (h: Headers) => {
    const out: string[] = [];
    h.forEach((v, k) => out.push(`${k}: ${v}`));
    return out.join("\n");
  };

  it("apiKey 를 주면 API 요청에 x-admin-key 가 붙음 · 경로 · 쿼리 · accept 는 그대로 · 쿠키는 넘기지 않음", async () => {
    const { api, seen } = fakeApi();
    const res = await handleBff(get("/bff/activity?after=3", { headers: { cookie: "__Host-admin=v.1.sig" } }), api, ROUTES, { apiKey: KEY });
    expect(res.status).toBe(200);
    const sent = seen[0]!;
    expect(sent.headers.get("x-admin-key")).toBe(KEY);
    expect(sent.headers.get("accept")).toBe("application/json");
    expect(sent.headers.get("cookie")).toBeNull();
    expect(new URL(sent.url).pathname + new URL(sent.url).search).toBe("/activity?after=3");
  });

  it("apiKey 를 안 주면(운영 사이트) 머리글이 없음 · 브라우저가 보낸 x-admin-key 도 넘기지 않음", async () => {
    const { api, seen } = fakeApi();
    await bff(get("/bff/activity", { headers: { "x-admin-key": "browser-guess" } }), api);
    expect(seen[0]!.headers.get("x-admin-key")).toBeNull();
    const again = fakeApi();
    await handleBff(get("/bff/activity", { headers: { "x-admin-key": "browser-guess" } }), again.api, ROUTES, {});
    expect(again.seen[0]!.headers.get("x-admin-key")).toBeNull();
  });

  it("apiKey 가 빈 글 · undefined 이면 머리글을 붙이지 않음 — 빈 값을 보내지 않음", async () => {
    for (const apiKey of [undefined, ""]) {
      const { api, seen } = fakeApi();
      await handleBff(get("/bff/activity"), api, ROUTES, { apiKey });
      expect(seen[0]!.headers.get("x-admin-key")).toBeNull();
    }
  });

  it("브라우저가 다른 x-admin-key 를 보내도 Worker 의 값만 씀", async () => {
    const { api, seen } = fakeApi();
    await handleBff(get("/bff/activity", { headers: { "x-admin-key": "browser-guess" } }), api, ROUTES, { apiKey: KEY });
    expect(seen[0]!.headers.get("x-admin-key")).toBe(KEY);
  });

  it("열쇠를 주어도 허용 경로 · 읽기 규칙은 그대로 — 쓰기 405 · 없는 경로 404 · API 를 부르지 않음 · 응답에 열쇠가 없음", async () => {
    const { api, seen } = fakeApi();
    expect((await handleBff(get("/bff/activity", { method: "POST" }), api, ROUTES, { apiKey: KEY })).status).toBe(405);
    const res = await handleBff(get("/bff/secret-path"), api, ROUTES, { apiKey: KEY });
    expect(res.status).toBe(404);
    expect(seen).toHaveLength(0);
    expect(headersText(res.headers) + (await res.text())).not.toContain(KEY);
    const ok = await handleBff(get("/bff/geo"), fakeApi().api, ROUTES, { apiKey: KEY });
    expect(headersText(ok.headers)).not.toContain(KEY);
  });
});
