// 작업 0165 — 매달 1일 회차: ECOS 수집은 다른 월간 수집과 따로 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것 — apps/api/src/index.ts scheduled(): controller.cron === CRON.pricesMonthly 일 때
//   collectPriceLevels(...) 와 collectEcos(d1IndicatorStore(env.DB), { key: env.ECOS_KEY }) 를 서로 따로 부름
//   · 어느 쪽이 던지거나 실패해도 다른 쪽은 그대로 (각각 catch · 로그만) · env.ts 에 ECOS_KEY?: string · wrangler 는 그대로
//   · 평일 회차(fxDaily · fxRetry)에서는 ECOS 를 부르지 않음
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./features/prices/collect", async (orig) => ({ ...(await orig<object>()), collectPriceLevels: vi.fn() }));
vi.mock("./features/indicators/collect", async (orig) => ({ ...(await orig<object>()), collectEcos: vi.fn(), collectCustomsRates: vi.fn() }));
vi.mock("./features/fx/collect/daily", async (orig) => ({ ...(await orig<object>()), dailyFx: vi.fn() }));

import { CRON } from "./index";
import worker from "./index";
import { dailyFx } from "./features/fx/collect/daily";
import { collectCustomsRates, collectEcos } from "./features/indicators/collect";
import { collectPriceLevels } from "./features/prices/collect";

type Env = Parameters<NonNullable<typeof worker.scheduled>>[1];
const env = { DB: {} as D1Database, ECOS_KEY: "ecos-key" } as unknown as Env;

async function fire(cron: string) {
  const waited: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waited.push(p), passThroughException: () => undefined } as unknown as ExecutionContext;
  await worker.scheduled?.({ cron, scheduledTime: Date.now(), noRetry: () => undefined, type: "scheduled" } as ScheduledController, env, ctx);
  await Promise.all(waited);
}

beforeEach(() => {
  vi.mocked(collectPriceLevels).mockReset().mockResolvedValue({ status: "ok" } as never);
  vi.mocked(collectEcos).mockReset().mockResolvedValue({ status: "ok", rows: 48, message: null });
  vi.mocked(collectCustomsRates).mockReset().mockResolvedValue({ status: "ok", rows: 0, message: null });
  vi.mocked(dailyFx).mockReset().mockResolvedValue({ skipped: true } as never);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("매달 1일 회차 (pricesMonthly)", () => {
  it("세계은행 물가와 ECOS 를 둘 다 부름 · ECOS 에 키 전달", async () => {
    await fire(CRON.pricesMonthly);
    expect(collectPriceLevels).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
    expect(vi.mocked(collectEcos).mock.calls[0][1].key).toBe("ecos-key");
  });

  it("ECOS 가 던져도(비동기) 세계은행 물가 수집은 그대로 · 예약 실행은 끝까지 감 · 실패는 로그", async () => {
    vi.mocked(collectEcos).mockRejectedValue(new Error("ecos boom"));
    await expect(fire(CRON.pricesMonthly)).resolves.toBeUndefined();
    expect(collectPriceLevels).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls.length + vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0);
  });

  it("ECOS 가 던져도(동기) 마찬가지", async () => {
    vi.mocked(collectEcos).mockImplementation(() => {
      throw new Error("ecos sync boom");
    });
    await expect(fire(CRON.pricesMonthly)).resolves.toBeUndefined();
    expect(collectPriceLevels).toHaveBeenCalledTimes(1);
  });

  it("반대로 세계은행 수집이 던져도 ECOS 는 돎", async () => {
    vi.mocked(collectPriceLevels).mockRejectedValue(new Error("worldbank boom"));
    await expect(fire(CRON.pricesMonthly)).resolves.toBeUndefined();
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });
});

describe("평일 회차", () => {
  it("ECOS 는 평일 회차에서 부르지 않음 (월간 자료)", async () => {
    for (const cron of [CRON.fxDaily, CRON.fxRetry1, CRON.fxRetry2]) await fire(cron);
    expect(collectEcos).not.toHaveBeenCalled();
    expect(collectPriceLevels).not.toHaveBeenCalled();
  });
});
