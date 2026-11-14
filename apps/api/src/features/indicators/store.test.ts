// 작업 0163 — 공용 시계열 저장 (indicator_points) · D1 가짜로 실제 SQL 을 확인 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/indicators/store.ts
//   export function d1IndicatorStore(d1: D1Database): IndicatorStore           // collect.ts 의 인터페이스 구현 · startRun/finishRun 은 db/runs.ts runLog 재사용
//     savePoints: 표 indicator_points 에 넣되 같은 (series, period) 는 덮어씀(on conflict do update) · 한 쿼리 바인딩 100개 한도라 줄을 나눠 넣음
//                 저장한 줄이 하나라도 있으면 clearApiCache 호출 (delete from api_cache) · 빈 목록이면 SQL 을 보내지 않음
//   export async function hasIndicatorPeriod(d1, series, period): Promise<boolean>   // d1.prepare(...).bind(series, period).first() — 한 줄만 읽음 (hasRates 와 같은 방식)
//   export async function recentPoints(d1, series, limit): Promise<{ period: string; value: number }[]>
//     d1.prepare("... where series = ? order by period desc limit ?").bind(series, limit).all() 로 최근 limit 개를 읽고, 돌려줄 때는 오래된 것부터(period 오름차순)
//   (d1IndicatorStore().hasPeriod 는 hasIndicatorPeriod 와 같은 동작)
//   표 모양: indicator_points(series text, period text, value real, source text, fetched_at text) · 기본 키 (series, period) — 마이그레이션 + schema.ts (보호 파일 · 사람 승인)
import { describe, expect, it } from "vitest";
import type { IndicatorPoint } from "./collect";
import { d1IndicatorStore, hasIndicatorPeriod, recentPoints } from "./store";

type Call = { sql: string; binds: unknown[] };

/** prepare → bind → run / all / first / raw 를 기록하는 가짜 D1 */
function fakeD1(opts: { first?: unknown; rows?: unknown[] } = {}) {
  const calls: Call[] = [];
  const stmt = (sql: string, binds: unknown[]) => {
    calls.push({ sql, binds });
    return {
      bind: (...b: unknown[]) => stmt(sql, b),
      run: async () => ({ success: true, results: [], meta: {} }),
      all: async () => ({ success: true, results: opts.rows ?? [], meta: {} }),
      first: async () => opts.first ?? null,
      raw: async () => [],
    };
  };
  const d1 = { prepare: (sql: string) => stmt(sql, []), batch: async () => [] } as unknown as D1Database;
  return { d1, calls };
}

const point = (series: string, period: string, value: number): IndicatorPoint => ({ series, period, value, source: "kcs", fetchedAt: "2026-11-18T03:00:00.000Z" });

describe("indicator_points 저장", () => {
  it("같은 (series, period) 는 덮어쓰는 insert · 값이 바인딩에 들어감", async () => {
    const { d1, calls } = fakeD1();
    const n = await d1IndicatorStore(d1).savePoints([point("kcs-import:USD", "2026-11-15", 1400.5)]);
    expect(n).toBe(1);
    const ins = calls.find((c) => /insert into "?indicator_points"?/i.test(c.sql));
    expect(ins, "insert 문이 있어야 함").toBeDefined();
    expect(ins?.sql).toMatch(/on conflict/i);
    expect(ins?.sql).toMatch(/do update/i);
    expect(ins?.binds).toEqual(expect.arrayContaining(["kcs-import:USD", "2026-11-15", 1400.5, "kcs"]));
  });

  it("줄이 많아도 한 쿼리 바인딩은 100개 이하 (D1 한도) · 줄은 하나도 빠지지 않음", async () => {
    const { d1, calls } = fakeD1();
    const rows = Array.from({ length: 60 }, (_, i) => point(`kcs-import:C${String(i).padStart(2, "0")}`, "2026-11-15", i + 1));
    expect(await d1IndicatorStore(d1).savePoints(rows)).toBe(60);
    const inserts = calls.filter((c) => /insert into "?indicator_points"?/i.test(c.sql));
    expect(inserts.length).toBeGreaterThan(1);
    for (const c of inserts) expect(c.binds.length).toBeLessThanOrEqual(100);
    const seen = new Set(inserts.flatMap((c) => c.binds).filter((b) => typeof b === "string" && b.startsWith("kcs-import:")));
    expect(seen.size).toBe(60);
  });

  it("저장하면 api_cache 를 비움 (새 자료가 바로 보이게)", async () => {
    const { d1, calls } = fakeD1();
    await d1IndicatorStore(d1).savePoints([point("kcs-import:USD", "2026-11-15", 1400.5)]);
    expect(calls.some((c) => /delete from api_cache/i.test(c.sql))).toBe(true);
  });

  it("빈 목록이면 SQL 을 보내지 않고 0 (캐시도 그대로)", async () => {
    const { d1, calls } = fakeD1();
    expect(await d1IndicatorStore(d1).savePoints([])).toBe(0);
    expect(calls).toEqual([]);
  });
});

describe("이미 받은 주 확인 · 읽기", () => {
  it("hasIndicatorPeriod: 행이 있으면 true · 없으면 false · series · period 를 바인딩", async () => {
    const yes = fakeD1({ first: { x: 1 } });
    expect(await hasIndicatorPeriod(yes.d1, "kcs-import:USD", "2026-11-15")).toBe(true);
    expect(yes.calls.at(-1)?.binds).toEqual(["kcs-import:USD", "2026-11-15"]);
    const no = fakeD1();
    expect(await hasIndicatorPeriod(no.d1, "kcs-import:USD", "2026-11-15")).toBe(false);
  });

  it("store.hasPeriod 도 같은 동작", async () => {
    expect(await d1IndicatorStore(fakeD1({ first: { x: 1 } }).d1).hasPeriod("kcs-import:USD", "2026-11-15")).toBe(true);
    expect(await d1IndicatorStore(fakeD1().d1).hasPeriod("kcs-import:USD", "2026-11-15")).toBe(false);
  });

  it("recentPoints: 최근 limit 개를 읽어 오래된 것부터 돌려줌 · series · limit 바인딩", async () => {
    const { d1, calls } = fakeD1({ rows: [{ period: "2026-11-15", value: 1400 }, { period: "2026-11-08", value: 1390 }, { period: "2026-11-01", value: 1380 }] }); // DB 는 최신순으로 줌
    const r = await recentPoints(d1, "kcs-import:USD", 3);
    expect(r).toEqual([
      { period: "2026-11-01", value: 1380 },
      { period: "2026-11-08", value: 1390 },
      { period: "2026-11-15", value: 1400 },
    ]);
    expect(calls.at(-1)?.binds).toEqual(["kcs-import:USD", 3]);
  });

  it("recentPoints: 자료가 없으면 빈 배열 (지어내지 않음)", async () => {
    expect(await recentPoints(fakeD1().d1, "kcs-import:XXX", 10)).toEqual([]);
  });
});
