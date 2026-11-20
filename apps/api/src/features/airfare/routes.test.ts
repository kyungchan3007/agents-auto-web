// 작업 0234 R9 — GET /airfare/calendar (읽기 전용 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/airfare/routes.ts 의 airfareRoutes 를 index.ts 에 .route("/airfare", airfareRoutes) 로 연결
//   GET /airfare/calendar → 200 AirfareCalendar (도시별 최근 묶음 · 자료 없으면 { fetchedOn: null, cities: [] }) · cached() 사용 · 쓰기 경로 없음 (POST 등은 404/405)
//   BFF 허용 목록(apps/web/src/bff/proxy.ts)에는 넣지 않음 — 빌드 때만 읽음
import { AirfareCalendar } from "@hav/shared/airfare";
import { describe, expect, it } from "vitest";
import type { Env } from "../../env";
import { app } from "../../index";

function dbWith(rows: unknown[]) {
  const stmt = (sql: string): unknown => {
    const results = /airfare_calendar/i.test(sql) ? rows : [];
    return {
      bind: () => stmt(sql),
      run: async () => ({ success: true, results: [], meta: {} }),
      all: async () => ({ success: true, results, meta: {} }),
      first: async () => null,
      raw: async () => results.map((r) => Object.values(r as object)),
    };
  };
  return { DB: { prepare: stmt } as unknown as D1Database } as unknown as Env;
}

describe("GET /airfare/calendar", () => {
  it("저장된 줄 → AirfareCalendar 모양 200", async () => {
    const res = await app.request("/airfare/calendar", {}, dbWith([{ airport: "NRT", fetched_on: "2026-11-23", depart: "2026-11-24", return_date: "2026-12-01", price: 310000 }]));
    expect(res.status).toBe(200);
    const body = AirfareCalendar.parse(await res.json());
    expect(body.cities[0]).toMatchObject({ airport: "NRT", city: "도쿄" });
    expect(body.cities[0].days).toEqual([{ depart: "2026-11-24", return: "2026-12-01", price: 310000 }]);
  });
  it("자료가 없으면 200 · { fetchedOn: null, cities: [] } (숫자를 만들지 않음)", async () => {
    const res = await app.request("/airfare/calendar", {}, dbWith([]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fetchedOn: null, cities: [] });
  });
  it("읽기 전용 — POST · PUT · DELETE 는 404/405", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) expect([404, 405], method).toContain((await app.request("/airfare/calendar", { method }, dbWith([]))).status);
  });
});
