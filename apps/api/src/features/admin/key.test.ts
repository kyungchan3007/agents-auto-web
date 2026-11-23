// 작업 0326 — API 어드민용 경로는 어드민 Worker 를 거친 요청만 답함 (x-admin-key) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것
//     apps/api/src/env.ts — Env 에 `ADMIN_API_KEY?: string` (비밀값 · 두 Worker 가 같은 값 · 없으면 어드민용 경로는 닫힘)
//     apps/api/src/features/admin/key.ts — export const requireAdminKey: MiddlewareHandler<{ Bindings: Env }>
//        x-admin-key 머리글이 ADMIN_API_KEY 와 같을 때만 다음으로 · 그 밖(머리글 없음 · 틀림 · ADMIN_API_KEY 없음 · 빈 값)은 401 JSON {error} · 길이 일정 비교(apps/api/src/admin.ts 의 sameToken 처럼)
//     apps/api/src/index.ts — 어드민 전용 경로에 requireAdminKey: GET /activity · /geo · /ga4 · /ig · /status · /admin-visits(GET · POST) — 운영 BFF 가 쓰지 않는 것 (/tasks 는 공개 유지 — 공개 저장소 PR 제목 자료 · sync-tasks.yml 이 부름 · sdd 결정)
//        운영 사이트 경로(/fx · /signal · /prices · /indicators · /airfare · /health)는 키 없이 그대로 · POST /activity 는 지금처럼 ACTIVITY_TOKEN(에이전트 훅) — x-admin-key 가 필요 없음
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { Env } from "../../env";
import { app } from "../../index";
import { requireAdminKey } from "./key";

const KEY = "test-admin-api-key-0326-0123456789";
const broken = () => { throw new Error("db down"); };
const envWith = (extra: Record<string, unknown> = {}) => ({ DB: { prepare: broken }, ADMIN_API_KEY: KEY, ACTIVITY_TOKEN: "act-token-0326", ...extra }) as unknown as Env;
const get = (path: string, headers: Record<string, string> = {}, env: Env = envWith()) => app.request(path, { headers }, env);

describe("requireAdminKey — 미들웨어 (작업 0326)", () => {
  const mini = new Hono<{ Bindings: Env }>().use("/*", requireAdminKey).get("/x", (c) => c.text("통과"));
  const run = (headers: Record<string, string>, env: Env) => mini.request("/x", { headers }, env);

  it("맞는 키 → 통과", async () => {
    const res = await run({ "x-admin-key": KEY }, envWith());
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("통과");
  });

  it("머리글 없음 · 틀린 키 · 거의 같은 키 · 빈 값 → 401 JSON({error}) · 통과하지 않음", async () => {
    for (const headers of [{}, { "x-admin-key": "wrong" }, { "x-admin-key": `${KEY}x` }, { "x-admin-key": KEY.slice(0, -1) }, { "x-admin-key": "" }, { "x-admin-key": KEY.toUpperCase() }] as Record<string, string>[]) {
      const res = await run(headers, envWith());
      expect(res.status, JSON.stringify(headers)).toBe(401);
      expect(res.headers.get("content-type")).toMatch(/json/);
      expect(await res.json()).toHaveProperty("error");
    }
  });

  it("ADMIN_API_KEY 가 없으면(미등록 · 빈 값) 어떤 머리글이어도 막음 — 닫힌 쪽 (undefined 와 같은 'undefined' 글 · 빈 글 포함)", async () => {
    for (const env of [envWith({ ADMIN_API_KEY: undefined }), envWith({ ADMIN_API_KEY: "" })]) {
      for (const headers of [{}, { "x-admin-key": "" }, { "x-admin-key": "undefined" }, { "x-admin-key": KEY }] as Record<string, string>[]) {
        expect((await run(headers, env)).status, JSON.stringify(headers)).toBe(401);
      }
    }
  });

  it("키 글을 응답에 되비치지 않음", async () => {
    const res = await run({ "x-admin-key": "SECRET-GUESS-0326" }, envWith());
    expect(JSON.stringify(await res.json())).not.toMatch(/SECRET-GUESS-0326|test-admin-api-key/);
  });
});

describe("어드민 전용 경로 — 키 없이는 닫힘 (작업 0326)", () => {
  const ADMIN_ONLY = ["/activity", "/geo", "/ga4", "/ig", "/status", "/admin-visits"];

  for (const path of ADMIN_ONLY) {
    it(`GET ${path}: 키 없음 · 틀림 · 키 미등록 → 401(핸들러에 닿지 않음) · 맞는 키 → 통과(401 아님)`, async () => {
      expect((await get(path)).status, "키 없음").toBe(401);
      expect((await get(path, { "x-admin-key": "wrong" })).status, "틀린 키").toBe(401);
      expect((await get(path, { "x-admin-key": KEY }, envWith({ ADMIN_API_KEY: undefined }))).status, "키 미등록").toBe(401);
      expect((await get(path, { "x-admin-key": KEY })).status, "맞는 키").not.toBe(401);
    });
  }

  it("POST /admin-visits 도 키가 있어야 함 — 키 없음 → 401", async () => {
    const res = await app.request("/admin-visits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "apply-acme-1124" }) }, envWith());
    expect(res.status).toBe(401);
  });
});

describe("운영 사이트 경로는 그대로 — 키 없이 (작업 0326)", () => {
  for (const path of ["/health", "/tasks", "/fx/latest", "/signal", "/prices/levels", "/indicators/ecos:import", "/airfare/calendar"]) {
    it(`GET ${path}: x-admin-key 없이 401 이 아님 (운영 BFF 가 그대로 부름)`, async () => {
      expect((await get(path)).status).not.toBe(401);
    });
  }

  it("POST /activity 는 지금처럼 ACTIVITY_TOKEN — x-admin-key 없이도 토큰이 맞으면 핸들러까지(본문 검사 400) · 토큰이 없으면 401", async () => {
    const withToken = await app.request("/activity", { method: "POST", headers: { authorization: "Bearer act-token-0326", "content-type": "application/json" }, body: "{}" }, envWith());
    expect(withToken.status, "토큰 맞음 → 본문 검사에서 400").toBe(400);
    const noToken = await app.request("/activity", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }, envWith());
    expect(noToken.status, "토큰 없음").toBe(401);
  });
});
