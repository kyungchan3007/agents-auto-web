// 작업 0234 R9 · R10 — 항공권 달력 저장 (airfare_calendar) · D1 가짜로 실제 SQL 을 확인 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/airfare/store.ts   ※ 이름 · 모양은 이 테스트의 가정
//   export function d1AirfareStore(d1: D1Database): AirfareStore      collect.ts 의 인터페이스 구현 · startRun/finishRun 은 db/runs.ts runLog 재사용
//     saveDays: 표 airfare_calendar 에 넣되 같은 (airport, fetched_on, depart) 는 덮어씀(on conflict do update) · 한 쿼리 바인딩 100개 한도라 줄을 나눠 넣음 · 저장한 줄이 있으면 clearApiCache (delete from api_cache) · 빈 목록이면 SQL 을 보내지 않음
//     fetchedToday(fetchedOn): select distinct airport from airfare_calendar where fetched_on = ? → 공항 코드 배열
//   export async function readAirfareCalendar(d1: D1Database): Promise<AirfareCalendar>
//     도시별 가장 최근 묶음(fetched_on)만 읽음 · 줄은 depart 오름차순 · 받은 적 없는 도시는 목록에 없음 · 자료가 하나도 없으면 { fetchedOn: null, cities: [] } · 전체 fetchedOn = 도시 fetchedOn 중 가장 늦은 날
//     도시 이름 · id 는 serpapi.ts 의 AIRFARE_CITIES 로 붙임 · 모르는 공항 코드 줄은 버림
//   표 모양: airfare_calendar(airport text, fetched_on text, depart text, return_date text, price integer, fetched_at text) · 기본 키 (airport, fetched_on, depart) — 마이그레이션 0011 + schema.ts (보호 파일)
import { AirfareCalendar } from "@hav/shared/airfare";
import { describe, expect, it } from "vitest";
import type { AirfareRow } from "./collect";
import { d1AirfareStore, readAirfareCalendar } from "./store";

type Call = { sql: string; binds: unknown[] };
function fakeD1(opts: { rows?: unknown[] } = {}) {
  const calls: Call[] = [];
  const stmt = (sql: string, binds: unknown[]): unknown => {
    calls.push({ sql, binds });
    return {
      bind: (...b: unknown[]) => stmt(sql, b),
      run: async () => ({ success: true, results: [], meta: {} }),
      all: async () => ({ success: true, results: opts.rows ?? [], meta: {} }),
      first: async () => null,
      raw: async () => (opts.rows ?? []).map((r) => Object.values(r as object)),
    };
  };
  return { d1: { prepare: (sql: string) => stmt(sql, []), batch: async () => [] } as unknown as D1Database, calls };
}
const row = (airport: string, depart: string, price: number): AirfareRow => ({ airport, fetchedOn: "2026-11-23", depart, returnDate: "2026-11-30", price, fetchedAt: "2026-11-23T03:00:00.000Z" });

describe("airfare_calendar 저장 (R9)", () => {
  it("같은 (airport, fetched_on, depart) 는 덮어쓰는 insert · 값이 바인딩에 들어감", async () => {
    const { d1, calls } = fakeD1();
    expect(await d1AirfareStore(d1).saveDays([row("NRT", "2026-11-24", 389700)])).toBe(1);
    const ins = calls.findLast((c) => /insert into "?airfare_calendar"?/i.test(c.sql) && c.binds.length > 0);
    expect(ins, "insert 문이 있어야 함").toBeDefined();
    expect(ins?.sql).toMatch(/on conflict/i);
    expect(ins?.sql).toMatch(/do update/i);
    expect(ins?.binds).toEqual(expect.arrayContaining(["NRT", "2026-11-23", "2026-11-24", "2026-11-30", 389700]));
  });
  it("줄이 많아도 한 쿼리 바인딩은 100개 이하 · 줄은 하나도 빠지지 않음 (336줄)", async () => {
    const { d1, calls } = fakeD1();
    const rows = Array.from({ length: 336 }, (_, i) => row(i < 168 ? "NRT" : "KIX", `2027-${String(1 + Math.floor(i / 28) % 12).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}#${i}`, 100000 + i));
    expect(await d1AirfareStore(d1).saveDays(rows)).toBe(336);
    const inserts = calls.filter((c) => /insert into "?airfare_calendar"?/i.test(c.sql) && c.binds.length > 0);
    expect(inserts.length).toBeGreaterThan(1);
    for (const c of inserts) expect(c.binds.length).toBeLessThanOrEqual(100);
    expect(inserts.reduce((n, c) => n + c.binds.length, 0) / 6).toBe(336);
  });
  it("저장하면 api_cache 를 비움 · 빈 목록이면 SQL 도 보내지 않음", async () => {
    const a = fakeD1();
    await d1AirfareStore(a.d1).saveDays([row("NRT", "2026-11-24", 389700)]);
    expect(a.calls.some((c) => /delete from api_cache/i.test(c.sql))).toBe(true);
    const b = fakeD1();
    expect(await d1AirfareStore(b.d1).saveDays([])).toBe(0);
    expect(b.calls).toEqual([]);
  });
  it("fetchedToday: 그날 받은 공항 코드 · fetched_on 을 바인딩", async () => {
    const { d1, calls } = fakeD1({ rows: [{ airport: "NRT" }, { airport: "KIX" }] });
    expect(await d1AirfareStore(d1).fetchedToday("2026-11-23")).toEqual(["NRT", "KIX"]);
    const q = calls.findLast((c) => /airfare_calendar/i.test(c.sql) && c.binds.length > 0);
    expect(q?.binds).toEqual(["2026-11-23"]);
  });
});

describe("readAirfareCalendar — 도시별 가장 최근 묶음 (R9 · R10)", () => {
  const r = (airport: string, fetched_on: string, depart: string, price: number) => ({ airport, fetched_on, depart, return_date: new Date(Date.parse(`${depart}T00:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10), price });
  it("계약 모양으로 돌려줌 · 도시 이름 · 줄은 depart 오름차순 · 도시마다 자기 묶음 날짜", async () => {
    const { d1 } = fakeD1({ rows: [r("NRT", "2026-11-23", "2026-11-25", 300000), r("NRT", "2026-11-23", "2026-11-24", 310000), r("KIX", "2026-11-21", "2026-11-24", 250000)] });
    const cal = await readAirfareCalendar(d1);
    expect(AirfareCalendar.safeParse(cal).success).toBe(true);
    const nrt = cal.cities.find((c) => c.airport === "NRT");
    expect(nrt).toMatchObject({ city: "도쿄", fetchedOn: "2026-11-23" });
    expect(nrt?.days.map((d) => d.depart)).toEqual(["2026-11-24", "2026-11-25"]);
    expect(cal.cities.find((c) => c.airport === "KIX")?.fetchedOn).toBe("2026-11-21");
    expect(cal.fetchedOn).toBe("2026-11-23");
  });
  it("받은 적 없는 도시는 목록에 없음 · 모르는 공항 줄은 버림 (숫자를 만들지 않음)", async () => {
    const { d1 } = fakeD1({ rows: [r("NRT", "2026-11-23", "2026-11-24", 310000), r("ZZZ", "2026-11-23", "2026-11-24", 1)] });
    const cal = await readAirfareCalendar(d1);
    expect(cal.cities.map((c) => c.airport)).toEqual(["NRT"]);
  });
  it("자료가 하나도 없으면 { fetchedOn: null, cities: [] }", async () => {
    expect(await readAirfareCalendar(fakeD1().d1)).toEqual({ fetchedOn: null, cities: [] });
  });
  it("읽기 SQL 은 도시별 최신 묶음만 — 전체 묶음을 읽지 않음 (D1 읽기 한도)", async () => {
    const { d1, calls } = fakeD1();
    await readAirfareCalendar(d1);
    const q = calls.find((c) => /airfare_calendar/i.test(c.sql));
    expect(q?.sql).toMatch(/max\(\s*"?fetched_on"?\s*\)|order by\s+"?fetched_on"?\s+desc/i);
  });
});
