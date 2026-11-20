// 작업 0234 R9 · R10 · R11 — 항공권 달력 수집 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/airfare/collect.ts   ※ 이름 · 모양은 이 테스트의 가정
//   export type AirfareRow = { airport: string; fetchedOn: string; depart: string; returnDate: string; price: number; fetchedAt: string }
//   export interface AirfareStore {
//     startRun(source: string, startedAt: string): Promise<number>
//     finishRun(id, r: { source; status: "ok" | "empty" | "error"; rows: number; message: string | null; finishedAt: string }): Promise<void>
//     saveDays(rows: AirfareRow[]): Promise<number>               같은 (airport, fetchedOn, depart) 는 덮어씀
//     fetchedToday(fetchedOn: string): Promise<string[]>          그날 이미 받은 공항 코드
//   }
//   export type AirfareResult = { status: "ok" | "empty" | "error" | "skipped" | "already"; rows: number; message: string | null; cities: { airport: string; status: "ok" | "empty" | "error"; rows: number }[] }
//   export async function collectAirfare(store, opts: { key?: string; today: string /* 한국 날짜 */; fetcher?: typeof fetch; now?: () => Date }): Promise<AirfareResult>
//   규칙
//     - key 없음 → skipped · 호출 · 저장 · 실행 기록 없음
//     - 월 · 수 · 금이 아님 → skipped · 호출 없음 · 오늘 받을 도시가 없음(모두 받음) → already · 호출 없음
//     - 받을 도시만 차례로 호출(재시도 회차는 안 받은 도시만) · 도시 하나가 실패해도 다음 도시를 계속
//     - 도시 결과: 가격 있는 날이 하나라도 있으면 ok(저장) · 빈 결과면 empty(저장 없음 — 지어내지 않음) · HTTP · 형식 · 네트워크 오류는 error(저장 없음)
//     - 전체: 하나라도 ok 면 ok · 아니면 오류가 있으면 error · 아니면 empty · 절대 던지지 않음 · 저장 오류도 그 도시 error
//     - 실행 기록 source "serpapi" 한 번 시작 · 한 번 끝 · 인증키 값 · 전체 검색 주소를 message · 실행 기록 · 로그에 남기지 않음
import { afterEach, describe, expect, it, vi } from "vitest";
import { type AirfareRow, type AirfareStore, collectAirfare } from "./collect";
import raw from "./fixtures/serpapi-nrt.json";
import { AIRFARE_CITIES } from "./serpapi";

const KEY = "S3cr3t+Key/with==chars";
const MON = "2026-11-23"; // 월
const TUE = "2026-11-24"; // 화
const NOW = () => new Date("2026-11-23T03:00:00Z");

function memoryStore(already: string[] = [], opts: { failSave?: string } = {}) {
  const runs: Record<number, Record<string, unknown>> = {};
  const saved: AirfareRow[] = [];
  const store: AirfareStore = {
    async startRun(source, startedAt) {
      const id = Object.keys(runs).length + 1;
      runs[id] = { source, startedAt };
      return id;
    },
    async finishRun(id, r) {
      Object.assign(runs[id], r);
    },
    async saveDays(rows) {
      if (opts.failSave && rows[0]?.airport === opts.failSave) throw new Error(`D1 down ${KEY}`);
      saved.push(...rows);
      return rows.length;
    },
    async fetchedToday() {
      return already;
    },
  };
  return { store, runs, saved };
}

type Call = { url: URL };
function fakeFetch(handler: (u: URL, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetcher = (async (input: Parameters<typeof fetch>[0]) => {
    const url = new URL(String(input));
    calls.push({ url });
    return handler(url, calls.length);
  }) as typeof fetch;
  return { fetcher, calls };
}
const ok = (body: unknown = raw) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => vi.restoreAllMocks());

describe("건너뜀 (R9 · R11)", () => {
  it("키가 없으면 skipped · 호출 · 저장 · 실행 기록 없음", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.status).toBe("skipped");
    expect(f.calls).toHaveLength(0);
    expect(m.saved).toHaveLength(0);
    expect(Object.keys(m.runs)).toHaveLength(0);
  });
  it("월 · 수 · 금이 아니면(화) skipped · 호출 없음", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { key: KEY, today: TUE, fetcher: f.fetcher, now: NOW });
    expect(r.status).toBe("skipped");
    expect(f.calls).toHaveLength(0);
    expect(Object.keys(m.runs)).toHaveLength(0);
  });
  it("오늘 8곳 모두 받았으면 already · 호출 없음", async () => {
    const m = memoryStore(AIRFARE_CITIES.map((c) => c.airport));
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.status).toBe("already");
    expect(f.calls).toHaveLength(0);
  });
});

describe("받기 (R9)", () => {
  it("월요일: 8곳을 차례로 1회씩 호출 · 인천 출발 · 공항 하나씩 · 키 전달", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.status).toBe("ok");
    expect(f.calls.map((c) => c.url.searchParams.get("arrival_id"))).toEqual(AIRFARE_CITIES.map((c) => c.airport));
    for (const c of f.calls) {
      expect(c.url.searchParams.get("departure_id")).toBe("ICN");
      expect(c.url.searchParams.get("api_key")).toBe(KEY);
      expect(c.url.searchParams.get("outbound_date")).toBe(MON);
    }
    expect(r.cities).toHaveLength(8);
  });
  it("저장: 도시마다 가격 있는 날(40줄) · 받은 날 = 오늘 · 공항 코드", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.rows).toBe(8 * 40);
    expect(m.saved).toHaveLength(8 * 40);
    expect(m.saved[0]).toMatchObject({ airport: "NRT", fetchedOn: MON, depart: "2026-11-20", returnDate: "2026-11-27", price: 389700 });
    expect(m.saved.every((x) => x.fetchedAt === "2026-11-23T03:00:00.000Z")).toBe(true);
  });
  it("재시도 회차: 이미 받은 도시는 부르지 않음 (NRT · KIX 건너뜀 → 6번 호출)", async () => {
    const m = memoryStore(["NRT", "KIX"]);
    const f = fakeFetch(() => ok());
    await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(f.calls).toHaveLength(6);
    expect(f.calls.map((c) => c.url.searchParams.get("arrival_id"))).not.toContain("NRT");
  });
  it("실행 기록: source serpapi · 한 번 시작 · 한 번 끝 · 상태 ok · 줄 수", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok());
    await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(Object.keys(m.runs)).toHaveLength(1);
    expect(m.runs[1]).toMatchObject({ source: "serpapi", status: "ok", rows: 8 * 40 });
  });
});

describe("받지 못함 — 지어내지 않음 (R10)", () => {
  it("도시 하나가 HTTP 오류여도 다음 도시를 계속 · 그 도시는 저장 없음 · 전체 ok", async () => {
    const m = memoryStore();
    const f = fakeFetch((u) => (u.searchParams.get("arrival_id") === "BKK" ? new Response("boom", { status: 503 }) : ok()));
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(f.calls).toHaveLength(8);
    expect(r.status).toBe("ok");
    expect(r.cities.find((c) => c.airport === "BKK")).toMatchObject({ status: "error", rows: 0 });
    expect(m.saved.some((x) => x.airport === "BKK")).toBe(false);
    expect(m.saved.filter((x) => x.airport === "NRT")).toHaveLength(40);
  });
  it("빈 결과(prices [])는 empty · 저장 없음 · 숫자를 만들지 않음", async () => {
    const m = memoryStore();
    const f = fakeFetch((u) => (u.searchParams.get("arrival_id") === "DAD" ? ok({ prices: [] }) : ok()));
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.cities.find((c) => c.airport === "DAD")).toMatchObject({ status: "empty", rows: 0 });
    expect(m.saved.some((x) => x.airport === "DAD")).toBe(false);
  });
  it("모양이 다른 응답 · 네트워크 오류도 그 도시만 error", async () => {
    const m = memoryStore();
    const f = fakeFetch((u) => {
      const a = u.searchParams.get("arrival_id");
      if (a === "SIN") return ok({ nothing: true });
      if (a === "JFK") throw new TypeError("fetch failed");
      return ok();
    });
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.cities.find((c) => c.airport === "SIN")?.status).toBe("error");
    expect(r.cities.find((c) => c.airport === "JFK")?.status).toBe("error");
    expect(r.cities.filter((c) => c.status === "ok")).toHaveLength(6);
  });
  it("모두 실패하면 error · 던지지 않음 · 실행 기록 error · 저장 없음", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => new Response("down", { status: 500 }));
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.status).toBe("error");
    expect(r.rows).toBe(0);
    expect(m.saved).toHaveLength(0);
    expect(m.runs[1]).toMatchObject({ source: "serpapi", status: "error" });
  });
  it("모두 빈 결과면 empty", async () => {
    const m = memoryStore();
    const f = fakeFetch(() => ok({ prices: [] }));
    expect((await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW })).status).toBe("empty");
  });
  it("저장이 실패해도 던지지 않고 그 도시만 error · 다음 도시 계속", async () => {
    const m = memoryStore([], { failSave: "KIX" });
    const f = fakeFetch(() => ok());
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    expect(r.cities.find((c) => c.airport === "KIX")?.status).toBe("error");
    expect(m.saved.some((x) => x.airport === "CDG")).toBe(true);
  });
});

describe("키 값을 남기지 않음 (R11 · AGENTS 6)", () => {
  it("결과 · 실행 기록 · 로그 어디에도 키 값 · 검색 주소의 api_key 가 없음 (오류 글에 키가 섞여 와도)", async () => {
    const logs: string[] = [];
    for (const m of ["log", "warn", "error", "info"] as const) vi.spyOn(console, m).mockImplementation((...a) => void logs.push(a.map(String).join(" ")));
    const m = memoryStore([], { failSave: "KIX" });
    const f = fakeFetch((u) => {
      if (u.searchParams.get("arrival_id") === "BKK") throw new Error(`request to ${u.toString()} failed`);
      if (u.searchParams.get("arrival_id") === "CDG") return new Response(`bad key ${KEY}`, { status: 401 });
      return ok();
    });
    const r = await collectAirfare(m.store, { key: KEY, today: MON, fetcher: f.fetcher, now: NOW });
    const dump = JSON.stringify({ r, runs: m.runs, logs });
    for (const needle of [KEY, encodeURIComponent(KEY), "api_key=S3cr3t"]) expect(dump.includes(needle), needle).toBe(false);
  });
});
