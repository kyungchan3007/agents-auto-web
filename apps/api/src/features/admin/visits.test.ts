// 작업 0326 — 어드민 접속 기록: 토큰 이름별 처음 · 마지막 시각만 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것
//     packages/shared/src/contracts/admin-visits.ts — export const AdminVisits (zod) · package.json exports "./admin-visits"
//        AdminVisits = { visits: { name: string; firstAt: ISO 시각 글; lastAt: ISO 시각 글 }[] }                         (마지막 접속이 최근인 이름부터)
//     apps/api/src/features/admin/visits.ts
//        export async function recordVisit(db: D1Database, name: string, nowIso: string): Promise<boolean>
//           표 admin_visits(name, first_at, last_at) — 이름이 처음이면 first_at = last_at = 지금 · 있으면 last_at 만 지금으로(first_at 은 그대로) — 한 문장 upsert(ON CONFLICT(name) DO UPDATE SET last_at = excluded.last_at) · 값은 바인딩(?) — 글에 이름을 끼워 넣지 않음
//           owner · 모양이 틀린 이름(영문 소문자 · 숫자 · 하이픈 · 점 · 밑줄 64자 이하가 아님)은 쓰지 않고 false · 썼으면 true
//        export function adminVisitsReport(rows: { name: string; first_at: string; last_at: string }[]): AdminVisits       owner 행은 빼고 · 마지막 접속 최근 순 · 빈 입력은 { visits: [] }
//     apps/api/src/features/admin/routes.ts — POST /admin-visits {name} → 204(틀린 이름은 400 · owner 는 204 이지만 쓰지 않음) · GET /admin-visits → AdminVisits   (둘 다 x-admin-key 필요 — key.test.ts)
//   저장하는 것: 이름 · 처음 시각 · 마지막 시각 — IP · 기기 · 경로는 받지도 저장하지도 않음
import { AdminVisits } from "@hav/shared/admin-visits";
import { describe, expect, it } from "vitest";
import type { Env } from "../../env";
import { app } from "../../index";
import { adminVisitsReport, recordVisit } from "./visits";

type Write = { sql: string; binds: unknown[] };
/** 쓰기를 기록하는 가짜 D1 (run · all · first · batch 모두) */
function fakeDb(rows: Record<string, unknown>[] = []) {
  const writes: Write[] = [];
  const stmt = (sql: string, binds: unknown[] = []): Record<string, unknown> => ({
    bind: (...b: unknown[]) => stmt(sql, b),
    run: async () => (writes.push({ sql, binds }), { success: true, meta: { changes: 1 } }),
    all: async () => ({ results: rows, success: true }),
    first: async () => rows[0] ?? null,
    raw: async () => rows.map((r) => Object.values(r)),
  });
  const db = {
    prepare: (sql: string) => stmt(sql),
    batch: async (list: { run: () => Promise<unknown> }[]) => Promise.all(list.map((s) => s.run())),
  } as unknown as D1Database;
  return { db, writes };
}
const NOW = "2026-11-23T03:31:00.000Z";
const KEY = "test-admin-api-key-0326-0123456789";
const envWith = (db: D1Database) => ({ DB: db, ADMIN_API_KEY: KEY }) as unknown as Env;
const row = (name: string, first: string, last: string) => ({ name, first_at: first, last_at: last });

describe("recordVisit — 처음 시각은 두고 마지막 시각만 갱신 (작업 0326)", () => {
  it("한 문장 upsert — admin_visits(name, first_at, last_at) · 충돌하면 last_at 만 갱신 · first_at 은 건드리지 않음", async () => {
    const { db, writes } = fakeDb();
    expect(await recordVisit(db, "apply-acme-1124", NOW)).toBe(true);
    expect(writes).toHaveLength(1);
    const sql = writes[0]!.sql;
    expect(sql).toMatch(/INSERT INTO admin_visits\s*\(name, first_at, last_at\)/i);
    expect(sql).toMatch(/ON CONFLICT\s*\(name\)\s*DO UPDATE SET last_at\s*=\s*excluded\.last_at/i);
    expect(sql.split(/DO UPDATE/i)[1] ?? "", "갱신 부분에 first_at 이 없음").not.toMatch(/first_at/i);
    expect(sql).not.toMatch(/DELETE|DROP/i);
  });

  it("값은 바인딩 — 이름 · 시각이 바인딩에 있고 SQL 글에는 없음", async () => {
    const { db, writes } = fakeDb();
    await recordVisit(db, "apply-acme-1124", NOW);
    expect(writes[0]!.binds).toContain("apply-acme-1124");
    expect(writes[0]!.binds).toContain(NOW);
    expect(writes[0]!.sql).not.toContain("apply-acme-1124");
    expect(writes[0]!.sql).not.toContain(NOW);
  });

  it("owner 는 기록하지 않음 — 쓰지 않고 false", async () => {
    const { db, writes } = fakeDb();
    expect(await recordVisit(db, "owner", NOW)).toBe(false);
    expect(writes).toEqual([]);
  });

  it("모양이 틀린 이름은 쓰지 않음 — 빈 글 · 따옴표 · 공백 · 대문자 · 65자 · 한글 · 줄바꿈", async () => {
    const { db, writes } = fakeDb();
    for (const bad of ["", "x'); DROP TABLE admin_visits; --", "a b", "ACME", "a".repeat(65), "회사", "a\nb", "-x"]) expect(await recordVisit(db, bad, NOW), JSON.stringify(bad)).toBe(false);
    expect(writes).toEqual([]);
    expect(await recordVisit(db, "a".repeat(64), NOW)).toBe(true);
    expect(await recordVisit(db, "apply-acme.co_1124", NOW)).toBe(true);
  });
});

describe("adminVisitsReport (작업 0326)", () => {
  it("빈 입력 → 빈 목록 · 계약 모양", () => {
    const r = adminVisitsReport([]);
    expect(r).toEqual({ visits: [] });
    expect(AdminVisits.parse(r)).toBeTruthy();
  });

  it("마지막 접속이 최근인 이름부터 · 이름 · 처음 · 마지막만(camelCase)", () => {
    const r = adminVisitsReport([
      row("apply-a-1124", "2026-11-20T01:00:00.000Z", "2026-11-21T01:00:00.000Z"),
      row("apply-b-1124", "2026-11-22T01:00:00.000Z", "2026-11-23T01:00:00.000Z"),
      row("apply-c-1124", "2026-11-19T01:00:00.000Z", "2026-11-22T05:00:00.000Z"),
    ]);
    expect(AdminVisits.parse(r)).toBeTruthy();
    expect(r.visits.map((v) => v.name)).toEqual(["apply-b-1124", "apply-c-1124", "apply-a-1124"]);
    expect(r.visits[0]).toEqual({ name: "apply-b-1124", firstAt: "2026-11-22T01:00:00.000Z", lastAt: "2026-11-23T01:00:00.000Z" });
  });

  it("owner 행이 있어도 응답에 없음 — 리뷰어 기록과 섞이지 않음", () => {
    const r = adminVisitsReport([row("owner", "2026-11-20T01:00:00.000Z", "2026-11-23T01:00:00.000Z"), row("apply-a-1124", "2026-11-20T01:00:00.000Z", "2026-11-21T01:00:00.000Z")]);
    expect(r.visits.map((v) => v.name)).toEqual(["apply-a-1124"]);
    expect(JSON.stringify(r)).not.toContain("owner");
  });
});

describe("/admin-visits 경로 (작업 0326)", () => {
  const post = (db: D1Database, body: unknown, key: string | null = KEY) =>
    app.request("/admin-visits", { method: "POST", headers: { "content-type": "application/json", ...(key ? { "x-admin-key": key } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) }, envWith(db));

  it("POST {name} → 204 · 그 이름을 upsert 로 기록", async () => {
    const { db, writes } = fakeDb();
    const res = await post(db, { name: "apply-acme-1124" });
    expect(res.status).toBe(204);
    expect(writes).toHaveLength(1);
    expect(writes[0]!.binds).toContain("apply-acme-1124");
  });

  it("POST — 틀린 이름 · 본문 없음 · JSON 아님 · name 이 글이 아님 → 400 · 쓰지 않음", async () => {
    const { db, writes } = fakeDb();
    for (const body of [{ name: "x'); DROP" }, {}, "not json", { name: 5 }, { name: "" }, [], { other: "x" }]) expect((await post(db, body)).status, JSON.stringify(body)).toBe(400);
    expect(writes).toEqual([]);
  });

  it("POST owner → 204 이지만 쓰지 않음 (어드민 Worker 가 특별 처리하지 않아도 안전)", async () => {
    const { db, writes } = fakeDb();
    expect((await post(db, { name: "owner" })).status).toBe(204);
    expect(writes).toEqual([]);
  });

  it("POST 에 다른 칸(ip · userAgent · path)을 보내도 저장하지 않음 — 이름만", async () => {
    const { db, writes } = fakeDb();
    await post(db, { name: "apply-acme-1124", ip: "203.0.113.9", userAgent: "Mozilla", path: "/geo" });
    expect(JSON.stringify(writes)).not.toMatch(/203\.0\.113|Mozilla|\/geo/);
  });

  it("키 없이는 POST · GET 모두 401 · 쓰지 않음", async () => {
    const { db, writes } = fakeDb();
    expect((await post(db, { name: "apply-acme-1124" }, null)).status).toBe(401);
    expect((await app.request("/admin-visits", {}, envWith(db))).status).toBe(401);
    expect(writes).toEqual([]);
  });

  it("GET → AdminVisits 모양 · 마지막 접속 최근 순 · owner 제외", async () => {
    const { db } = fakeDb([row("apply-a-1124", "2026-11-20T01:00:00.000Z", "2026-11-21T01:00:00.000Z"), row("owner", "2026-11-20T01:00:00.000Z", "2026-11-23T01:00:00.000Z"), row("apply-b-1124", "2026-11-22T01:00:00.000Z", "2026-11-23T01:00:00.000Z")]);
    const res = await app.request("/admin-visits", { headers: { "x-admin-key": KEY } }, envWith(db));
    expect(res.status).toBe(200);
    const body = AdminVisits.parse(await res.json());
    expect(body.visits.map((v) => v.name)).toEqual(["apply-b-1124", "apply-a-1124"]);
  });

  it("GET 빈 D1 → { visits: [] }", async () => {
    const { db } = fakeDb([]);
    const res = await app.request("/admin-visits", { headers: { "x-admin-key": KEY } }, envWith(db));
    expect(await res.json()).toEqual({ visits: [] });
  });
});
