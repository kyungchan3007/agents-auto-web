import { describe, expect, it } from "vitest";
import { type RateStore, collectDay } from "./collect";
import type { RateRow } from "../sources/rate";

const NOW = () => new Date("2026-10-28T03:00:00Z");

function memoryStore() {
  const runs: Record<number, Record<string, unknown>> = {};
  const saved: RateRow[] = [];
  const store: RateStore = {
    async startRun(source, startedAt) {
      const id = Object.keys(runs).length + 1;
      runs[id] = { source, startedAt };
      return id;
    },
    async finishRun(id, r) {
      Object.assign(runs[id], r);
    },
    async saveRates(rows) {
      saved.push(...rows);
      return rows.length;
    },
  };
  return { store, runs, saved };
}

const json = (body: unknown, status = 200) => new Response(body === "" ? "" : JSON.stringify(body), { status });

/** URL 로 출처를 나눠 답하는 가짜 fetch */
const fetcher =
  (exim: () => Response, frank: () => Response): typeof fetch =>
  async (u) =>
    String(u).includes("koreaexim") ? exim() : frank();

const EXIM_OK = [{ result: 1, cur_unit: "USD", ttb: "1,312.1", tts: "1,338.5", deal_bas_r: "1,325.3" }];
const FRANK_OK = [{ date: "2026-10-28", base: "KRW", quote: "USD", rate: 0.00075 }];

describe("collectDay", () => {
  it("수출입은행 성공 → 그대로 저장 · 예비는 부르지 않음", async () => {
    const { store, runs, saved } = memoryStore();
    let frankCalled = false;
    const r = await collectDay(store, "2026-10-28", {
      koreaeximKey: "k",
      now: NOW,
      fetcher: fetcher(() => json(EXIM_OK), () => { frankCalled = true; return json(FRANK_OK); }),
    });
    expect(r).toMatchObject({ status: "ok", source: "koreaexim", rows: 1 });
    expect(saved[0]).toMatchObject({ currency: "USD", baseRate: 1325.3, source: "koreaexim" });
    expect(frankCalled).toBe(false);
    expect(runs[1]).toMatchObject({ source: "koreaexim", status: "ok", rows: 1 });
  });

  it("데이터 없는 날 (비영업일) → empty · 예비로 채우지 않음 (FX-02)", async () => {
    const { store, saved } = memoryStore();
    const r = await collectDay(store, "2026-10-03", { koreaeximKey: "k", now: NOW, fetcher: fetcher(() => json(""), () => json(FRANK_OK)) });
    expect(r).toMatchObject({ status: "empty", source: "koreaexim", rows: 0 });
    expect(saved).toEqual([]);
  });

  it("키 없음 · 인증 오류 · 한도 마감 → Frankfurter 로 채우고 이유를 남김", async () => {
    for (const exim of [undefined, "bad"]) {
      const { store, runs, saved } = memoryStore();
      const r = await collectDay(store, "2026-10-28", {
        koreaeximKey: exim,
        now: NOW,
        fetcher: fetcher(() => json([{ result: 3 }]), () => json(FRANK_OK)),
      });
      expect(r).toMatchObject({ status: "ok", source: "koreaexim→frankfurter", rows: 1 });
      expect(saved[0].source).toBe("frankfurter");
      expect(String(runs[1].message)).toMatch(exim ? /result-3/ : /no-key/);
      expect(runs[1].source).toBe("koreaexim→frankfurter"); // 실행 기록에도 실제 출처 (로컬 수집에서 찾은 버그)
    }
  });

  it("예비는 주말을 채우지 않음 — 수출입은행처럼 영업일만 (실제 로컬 수집에서 일요일 141개가 들어온 것을 막음)", async () => {
    const { store, saved } = memoryStore();
    let frankCalled = false;
    const r = await collectDay(store, "2026-10-25", {
      now: NOW,
      fetcher: fetcher(() => json(""), () => { frankCalled = true; return json([{ ...FRANK_OK[0], date: "2026-10-25" }]); }),
    });
    expect(r).toMatchObject({ status: "empty", source: "koreaexim→frankfurter" });
    expect(saved).toEqual([]);
    expect(frankCalled).toBe(false);
  });

  it("예비가 다른 날짜(이전 영업일)를 주면 저장하지 않음 → empty", async () => {
    const { store, saved } = memoryStore();
    const r = await collectDay(store, "2026-10-27", {
      now: NOW,
      fetcher: fetcher(() => json(""), () => json([{ ...FRANK_OK[0], date: "2026-10-26" }])),
    });
    expect(r.status).toBe("empty");
    expect(saved).toEqual([]);
  });

  it("예비는 공식 출처가 주던 통화만 채움 — 목록이 하루만 160개로 늘지 않게 (작업 0098)", async () => {
    const { store, saved } = memoryStore();
    store.officialCurrencies = async () => ["USD"];
    const frank = [...FRANK_OK, { date: "2026-10-28", base: "KRW", quote: "XAU", rate: 0.0000001 }, { date: "2026-10-28", base: "KRW", quote: "ZAR", rate: 0.013 }];
    const r = await collectDay(store, "2026-10-28", { fetcher: fetcher(() => json({}, 500), () => json(frank)), now: NOW });
    expect(r.status).toBe("ok");
    expect(saved.map((x) => x.currency)).toEqual(["USD"]);
  });

  it("처음 수집(공식 출처 기록 없음)이면 예비를 거르지 않음", async () => {
    const { store, saved } = memoryStore();
    store.officialCurrencies = async () => [];
    const frank = [...FRANK_OK, { date: "2026-10-28", base: "KRW", quote: "ZAR", rate: 0.013 }];
    await collectDay(store, "2026-10-28", { fetcher: fetcher(() => json({}, 500), () => json(frank)), now: NOW });
    expect(saved.map((x) => x.currency).sort()).toEqual(["USD", "ZAR"]);
  });

  it("둘 다 실패 → error 로 기록 (숨기지 않음)", async () => {
    const { store, runs } = memoryStore();
    const r = await collectDay(store, "2026-10-28", { now: NOW, fetcher: fetcher(() => json("x", 500), () => json("x", 503)) });
    expect(r.status).toBe("error");
    expect(String(runs[1].message)).toMatch(/no-key.*HTTP 503/);
  });
});

describe("수출입은행 일시 오류 다시 시도 (작업 0156)", () => {
  const noWait = async () => {};

  it("525 뒤 성공 → 공식 값 저장 · 몇 번 실패했는지 남김 · 예비는 부르지 않음", async () => {
    const { store, runs, saved } = memoryStore();
    const answers = [json("", 525), json(EXIM_OK)];
    const waits: number[] = [];
    let frank = 0;
    const r = await collectDay(store, "2026-10-28", {
      koreaeximKey: "k",
      now: NOW,
      retryDelays: [30_000, 90_000],
      sleep: async (ms) => void waits.push(ms),
      fetcher: fetcher(() => answers.shift()!, () => (frank++, json(FRANK_OK))),
    });
    expect(r).toMatchObject({ status: "ok", source: "koreaexim", rows: 1, message: "koreaexim retried-1: 앞선 실패 http-525" });
    expect(waits).toEqual([30_000]);
    expect(frank).toBe(0);
    expect(saved[0].source).toBe("koreaexim");
    expect(runs[1].status).toBe("ok");
  });

  it("계속 525 → 정한 횟수만 다시 하고 예비로", async () => {
    const { store } = memoryStore();
    let exim = 0;
    const r = await collectDay(store, "2026-10-28", {
      koreaeximKey: "k",
      now: NOW,
      retryDelays: [1, 1],
      sleep: noWait,
      fetcher: fetcher(() => (exim++, json("", 525)), () => json(FRANK_OK)),
    });
    expect(exim).toBe(3);
    expect(r.source).toBe("koreaexim→frankfurter");
    expect(r.message).toBe("koreaexim http-525: HTTP 525 (다시 시도 2회 · http-525 · http-525)");
  });

  it("인증 오류 같은 일시 오류가 아닌 실패는 다시 하지 않음", async () => {
    const { store } = memoryStore();
    let exim = 0;
    await collectDay(store, "2026-10-28", {
      koreaeximKey: "k",
      now: NOW,
      retryDelays: [1, 1],
      sleep: noWait,
      fetcher: fetcher(() => (exim++, json([{ result: 3 }])), () => json(FRANK_OK)),
    });
    expect(exim).toBe(1);
  });

  it("간격을 주지 않으면 한 번만 (기존 동작)", async () => {
    const { store } = memoryStore();
    let exim = 0;
    await collectDay(store, "2026-10-28", { koreaeximKey: "k", now: NOW, fetcher: fetcher(() => (exim++, json("", 525)), () => json(FRANK_OK)) });
    expect(exim).toBe(1);
  });
});
