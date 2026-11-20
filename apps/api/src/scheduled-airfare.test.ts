// 작업 0234 R9 — 기존 평일 12:00 KST 회차(fxDaily)에서 월 · 수 · 금에만 항공권 달력을 받음 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것 — apps/api/src/index.ts scheduled(): controller.cron === CRON.fxDaily 이고 한국 날짜가 월 · 수 · 금일 때
//   collectAirfare(d1AirfareStore(env.DB), { key: env.SERPAPI_KEY, today: kstDate() }) 를 환율 · 과세환율 · 월간 지표와 따로 부름 (던져도 나머지는 그대로 · 각각 catch · 로그만)
//   · 새 cron 문자열 없음(CRON 값 그대로 · wrangler.jsonc 안 바꿈) · 재시도 회차(fxRetry1 · fxRetry2)는 부르지 않음 · 매달 1일 회차도 부르지 않음
//   · "월 · 수 · 금" 판단은 due.ts isAirfareDay 로 하고, 그날 이미 받은 도시는 collectAirfare 안에서 건너뜀
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./features/prices/collect", async (orig) => ({ ...(await orig<object>()), collectPriceLevels: vi.fn() }));
vi.mock("./features/indicators/collect", async (orig) => ({ ...(await orig<object>()), collectEcos: vi.fn(), collectCustomsRates: vi.fn(), collectKosis: vi.fn() }));
vi.mock("./features/fx/collect/daily", async (orig) => ({ ...(await orig<object>()), dailyFx: vi.fn() }));
vi.mock("./features/airfare/collect", async (orig) => ({ ...(await orig<object>()), collectAirfare: vi.fn() }));

import worker, { CRON } from "./index";
import { collectAirfare } from "./features/airfare/collect";
import { dailyFx } from "./features/fx/collect/daily";
import { collectCustomsRates } from "./features/indicators/collect";

type Env = Parameters<NonNullable<typeof worker.scheduled>>[1];
const env = { DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }), first: async () => null, run: async () => ({}) }) }) } as unknown as D1Database, SERPAPI_KEY: "serp-key" } as unknown as Env;

// 03:00 UTC = 12:00 KST (같은 날짜)
const MON = "2026-11-23T03:00:00Z";
const TUE = "2026-11-24T03:00:00Z";
const WED = "2026-11-25T03:00:00Z";
const FRI = "2026-11-27T03:00:00Z";

async function fire(cron: string, at: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(at));
  const waited: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waited.push(p), passThroughException: () => undefined } as unknown as ExecutionContext;
  try {
    await worker.scheduled?.({ cron, scheduledTime: new Date(at).getTime(), noRetry: () => undefined, type: "scheduled" } as ScheduledController, env, ctx);
    await Promise.all(waited);
  } finally {
    vi.useRealTimers();
  }
}

beforeEach(() => {
  vi.mocked(collectAirfare).mockReset().mockResolvedValue({ status: "ok", rows: 320, message: null, cities: [] });
  vi.mocked(collectCustomsRates).mockReset().mockResolvedValue({ status: "ok", rows: 0, message: null });
  vi.mocked(dailyFx).mockReset().mockResolvedValue({ skipped: true } as never);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("평일 첫 회차(fxDaily) — 월 · 수 · 금에만", () => {
  it("월 · 수 · 금: 항공권 달력을 부름 · 키 · 한국 날짜 전달", async () => {
    for (const at of [MON, WED, FRI]) {
      vi.mocked(collectAirfare).mockClear();
      await fire(CRON.fxDaily, at);
      expect(collectAirfare, at).toHaveBeenCalledTimes(1);
      const opts = vi.mocked(collectAirfare).mock.calls[0][1];
      expect(opts.key).toBe("serp-key");
      expect(opts.today).toBe(at.slice(0, 10));
    }
  });
  it("화요일: 부르지 않음", async () => {
    await fire(CRON.fxDaily, TUE);
    expect(collectAirfare).not.toHaveBeenCalled();
  });
});

describe("다른 회차에서는 부르지 않음 (한 달 104회 유지)", () => {
  it("재시도 회차(fxRetry1 · fxRetry2) · 매달 1일 회차는 월요일이어도 안 부름", async () => {
    await fire(CRON.fxRetry1, MON);
    await fire(CRON.fxRetry2, MON);
    await fire(CRON.pricesMonthly, MON);
    expect(collectAirfare).not.toHaveBeenCalled();
  });
  it("새 cron 문자열을 만들지 않음 (CRON 은 네 개 그대로 · wrangler.jsonc 안 바꿈)", () => {
    expect(Object.keys(CRON).sort()).toEqual(["fxDaily", "fxRetry1", "fxRetry2", "pricesMonthly"]);
  });
});

describe("서로 영향 없음", () => {
  it("항공권 수집이 던져도(비동기 · 동기) 예약 실행은 끝까지 가고 다른 수집도 그대로 · 실패는 로그", async () => {
    vi.mocked(collectAirfare).mockRejectedValue(new Error("serp boom"));
    await expect(fire(CRON.fxDaily, MON)).resolves.toBeUndefined();
    expect(collectCustomsRates).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls.length + vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0);
    vi.mocked(collectAirfare).mockImplementation(() => {
      throw new Error("serp sync boom");
    });
    await expect(fire(CRON.fxDaily, MON)).resolves.toBeUndefined();
  });
  it("다른 수집(과세환율)이 던져도 항공권 수집은 그대로 부름", async () => {
    vi.mocked(collectCustomsRates).mockRejectedValue(new Error("kcs boom"));
    await expect(fire(CRON.fxDaily, MON)).resolves.toBeUndefined();
    expect(collectAirfare).toHaveBeenCalledTimes(1);
  });
});
