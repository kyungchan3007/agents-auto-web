// 작업 0163 — 예약 실행에서 과세환율 수집은 환율 수집과 따로 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것 — apps/api/src/index.ts scheduled(): 평일 12:00 회차(CRON.fxDaily)에서만, dailyFx 가 끝난 뒤
//   collectCustomsRates(d1IndicatorStore(env.DB), { key: env.KCS_KEY, today: kstDate() }) 를 따로 부름
//   · 어느 쪽이 던지거나 실패해도 다른 쪽에 영향 없음 (각각 catch · 로그만)
//   · 다시 하는 회차(fxRetry1 · fxRetry2)에서는 부르지 않음
//   · env.ts 에 KCS_KEY?: string 추가 · wrangler 는 그대로
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./features/fx/collect/daily", async (orig) => ({ ...(await orig<object>()), dailyFx: vi.fn() }));
vi.mock("./features/indicators/collect", async (orig) => ({ ...(await orig<object>()), collectCustomsRates: vi.fn() }));

import { CRON } from "./index";
import worker from "./index";
import { dailyFx } from "./features/fx/collect/daily";
import { collectCustomsRates } from "./features/indicators/collect";

const FX_OK = { skipped: false, date: "2026-11-18", status: "ok", source: "koreaexim", rows: 22, message: null, rebuild: "no-hook" };
const env = { DB: {} as D1Database, KOREAEXIM_KEY: "fx-key", KCS_KEY: "kcs-key" } as unknown as Env;
type Env = Parameters<NonNullable<typeof worker.scheduled>>[1];

async function fire(cron: string) {
  const waited: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waited.push(p), passThroughException: () => undefined } as unknown as ExecutionContext;
  await worker.scheduled?.({ cron, scheduledTime: Date.now(), noRetry: () => undefined, type: "scheduled" } as ScheduledController, env, ctx);
  await Promise.all(waited);
}

beforeEach(() => {
  vi.mocked(dailyFx).mockReset().mockResolvedValue(FX_OK as never);
  vi.mocked(collectCustomsRates).mockReset().mockResolvedValue({ status: "ok", rows: 22, message: null });
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("평일 12:00 회차 (fxDaily)", () => {
  it("환율 수집이 끝난 뒤 과세환율 수집을 부름 · 키 · 한국 날짜 전달", async () => {
    await fire(CRON.fxDaily);
    expect(dailyFx).toHaveBeenCalledTimes(1);
    expect(collectCustomsRates).toHaveBeenCalledTimes(1);
    const opts = vi.mocked(collectCustomsRates).mock.calls[0][1];
    expect(opts.key).toBe("kcs-key");
    expect(opts.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(vi.mocked(dailyFx).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(collectCustomsRates).mock.invocationCallOrder[0]);
  });

  it("과세환율 수집이 던져도(비동기) 환율 결과는 그대로 기록되고 예약 실행은 끝까지 감", async () => {
    vi.mocked(collectCustomsRates).mockRejectedValue(new Error("kcs boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    const lines = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes('"fx_scheduled"') && l.includes('"status":"ok"'))).toBe(true);
    expect(vi.mocked(console.error).mock.calls.length + vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0); // 실패는 로그로 남김
  });

  it("과세환율 수집이 던져도(동기) 마찬가지", async () => {
    vi.mocked(collectCustomsRates).mockImplementation(() => {
      throw new Error("kcs sync boom");
    });
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    const lines = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes('"fx_scheduled"'))).toBe(true);
  });

  it("반대로 환율 수집이 던져도 과세환율 수집은 돎 (서로 영향 없음)", async () => {
    vi.mocked(dailyFx).mockRejectedValue(new Error("fx boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectCustomsRates).toHaveBeenCalledTimes(1);
  });
});

describe("다시 하는 회차 · 매달 회차", () => {
  it("fxRetry1 · fxRetry2 는 과세환율을 부르지 않음 (주 1회 · 이미 받은 주는 건너뛰는 읽기도 늘리지 않음)", async () => {
    for (const cron of [CRON.fxRetry1, CRON.fxRetry2]) await fire(cron);
    expect(dailyFx).toHaveBeenCalledTimes(2);
    expect(collectCustomsRates).not.toHaveBeenCalled();
  });
});
