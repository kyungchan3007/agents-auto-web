// 작업 0171 — 평일 첫 회차(fxDaily)에서 월간 지표(KOSIS · ECOS)가 비었거나 오래됐으면 채우기 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 기존 scheduled*.test.ts 와 같은 방식 (모듈을 가짜로 바꿔 호출 여부 · 순서 · 실패 분리를 봄)
//
// builder 가 할 것 — apps/api/src/index.ts scheduled(): 평일 첫 회차(CRON.fxDaily)에서 환율(dailyFx) · 과세환율(collectCustomsRates) 뒤에
//   각 자료마다 최신 1행만 읽어(recentPoints(env.DB, series, 1) — features/indicators/store.ts) due 면 수집:
//     KOSIS: recentPoints(env.DB, "kosis-cpi:air-fare", 1) → monthlyDue(latest?.period ?? null, kstDate(), KOSIS_PUBLISH_DAY) 면 collectKosis(store, { key: env.KOSIS_KEY })
//     ECOS : recentPoints(env.DB, "ecos-import-price:krw", 1) → monthlyDue(…, ECOS_PUBLISH_DAY) 면 collectEcos(store, { key: env.ECOS_KEY })
//   - due 가 아니면 수집 함수를 부르지 않음 · 자료마다 읽기는 1번(limit 1)
//   - 다시 하는 회차(fxRetry1 · fxRetry2)에서는 읽지도 부르지 않음 · 매달 1일 회차(pricesMonthly)는 그대로(여기서 새로 읽지 않음)
//   - 환율 · 과세환율 · KOSIS · ECOS 가 서로 따로 — 어느 하나가 던져도(동기 · 비동기 · 읽기 실패) 나머지는 그대로 돎 · 실패는 로그
//   - 키가 없어도 부름(수집 함수가 알아서 건너뜀)
//   - monthlyDue 는 features/indicators/due.ts (due.test.ts 에 규칙)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./features/fx/collect/daily", async (orig) => ({ ...(await orig<object>()), dailyFx: vi.fn() }));
vi.mock("./features/prices/collect", async (orig) => ({ ...(await orig<object>()), collectPriceLevels: vi.fn() }));
vi.mock("./features/indicators/collect", async (orig) => ({ ...(await orig<object>()), collectCustomsRates: vi.fn(), collectKosis: vi.fn(), collectEcos: vi.fn() }));
vi.mock("./features/indicators/store", async (orig) => ({ ...(await orig<object>()), recentPoints: vi.fn() }));

import { CRON } from "./index";
import worker from "./index";
import { dailyFx } from "./features/fx/collect/daily";
import { collectCustomsRates, collectEcos, collectKosis } from "./features/indicators/collect";
import { recentPoints } from "./features/indicators/store";
import { collectPriceLevels } from "./features/prices/collect";

type Env = Parameters<NonNullable<typeof worker.scheduled>>[1];
const env = { DB: {} as D1Database, KOSIS_KEY: "kosis-key", ECOS_KEY: "ecos-key", KCS_KEY: "kcs-key" } as unknown as Env;

const AIR = "kosis-cpi:air-fare";
const ECOS = "ecos-import-price:krw";
const FX_OK = { skipped: false, date: "2026-11-18", status: "ok", source: "koreaexim", rows: 22, message: null, rebuild: "no-hook" };
const OK = { status: "ok", rows: 24, message: null } as const;

/** 시리즈마다 최신 달을 정함 — null 이면 빈 자료 */
function latestIs(map: Record<string, string | null>) {
  vi.mocked(recentPoints).mockImplementation(async (_d1, series) => {
    const period = map[series];
    return period ? [{ period, value: 100 }] : [];
  });
}

async function fire(cron: string) {
  const waited: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waited.push(p), passThroughException: () => undefined } as unknown as ExecutionContext;
  await worker.scheduled?.({ cron, scheduledTime: Date.now(), noRetry: () => undefined, type: "scheduled" } as ScheduledController, env, ctx);
  await Promise.all(waited);
}

const logged = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T03:00:00Z")); // 수요일 12:00 KST · KOSIS(5일) · ECOS(17일) 모두 발표일 지남 → 기대 달 2026-10
  vi.mocked(dailyFx).mockReset().mockResolvedValue(FX_OK as never);
  vi.mocked(collectPriceLevels).mockReset().mockResolvedValue({ status: "ok" } as never);
  vi.mocked(collectCustomsRates).mockReset().mockResolvedValue(OK);
  vi.mocked(collectKosis).mockReset().mockResolvedValue(OK);
  vi.mocked(collectEcos).mockReset().mockResolvedValue(OK);
  vi.mocked(recentPoints).mockReset();
  latestIs({ [AIR]: null, [ECOS]: null });
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.useRealTimers());

describe("평일 첫 회차 — due 인 자료만 채움", () => {
  it("둘 다 비었으면 둘 다 수집 · 키 전달 · 자료마다 최신 1행만 읽음", async () => {
    await fire(CRON.fxDaily);
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
    expect(vi.mocked(collectKosis).mock.calls[0][1].key).toBe("kosis-key");
    expect(vi.mocked(collectEcos).mock.calls[0][1].key).toBe("ecos-key");
    const reads = vi.mocked(recentPoints).mock.calls.map((c) => [c[1], c[2]]);
    expect(reads).toHaveLength(2);
    expect(reads).toEqual(expect.arrayContaining([[AIR, 1], [ECOS, 1]]));
  });

  it("발표된 달(2026-10)까지 이미 있으면 부르지 않음", async () => {
    latestIs({ [AIR]: "2026-10", [ECOS]: "2026-10" });
    await fire(CRON.fxDaily);
    expect(collectKosis).not.toHaveBeenCalled();
    expect(collectEcos).not.toHaveBeenCalled();
    expect(vi.mocked(recentPoints)).toHaveBeenCalledTimes(2); // 읽기는 했지만 수집은 안 함
  });

  it("지난 달 자료(2026-09)만 있으면 둘 다 채움", async () => {
    latestIs({ [AIR]: "2026-09", [ECOS]: "2026-09" });
    await fire(CRON.fxDaily);
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });

  it("한쪽만 due 면 그쪽만 — ECOS 는 최신인데 KOSIS 는 비었음", async () => {
    latestIs({ [AIR]: null, [ECOS]: "2026-10" });
    await fire(CRON.fxDaily);
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).not.toHaveBeenCalled();
  });

  it("발표일이 자료마다 다름 — 11-10 에는 KOSIS(5일 지남)만 due · ECOS(17일 전)는 2026-09 면 충분", async () => {
    vi.setSystemTime(new Date("2026-11-10T03:00:00Z"));
    latestIs({ [AIR]: "2026-09", [ECOS]: "2026-09" });
    await fire(CRON.fxDaily);
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).not.toHaveBeenCalled();
  });

  it("키가 없어도 부름 (수집 함수가 알아서 건너뜀)", async () => {
    const waited: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void waited.push(p), passThroughException: () => undefined } as unknown as ExecutionContext;
    const noKeys = { DB: {} as D1Database } as unknown as Env;
    await worker.scheduled?.({ cron: CRON.fxDaily, scheduledTime: Date.now(), noRetry: () => undefined, type: "scheduled" } as ScheduledController, noKeys, ctx);
    await Promise.all(waited);
    expect(vi.mocked(collectKosis).mock.calls[0]?.[1].key).toBeUndefined();
    expect(vi.mocked(collectEcos).mock.calls[0]?.[1].key).toBeUndefined();
  });

  it("환율 · 과세환율 뒤에 채움 (순서)", async () => {
    await fire(CRON.fxDaily);
    const order = (f: unknown) => vi.mocked(f as typeof collectKosis).mock.invocationCallOrder[0];
    expect(order(dailyFx)).toBeLessThan(order(collectCustomsRates));
    expect(order(collectCustomsRates)).toBeLessThan(order(collectKosis));
    expect(order(collectCustomsRates)).toBeLessThan(order(collectEcos));
  });
});

describe("다른 회차에서는 하지 않음", () => {
  it("다시 하는 회차(13:30 · 15:00)에서는 읽지도 부르지도 않음", async () => {
    for (const cron of [CRON.fxRetry1, CRON.fxRetry2]) await fire(cron);
    expect(recentPoints).not.toHaveBeenCalled();
    expect(collectKosis).not.toHaveBeenCalled();
    expect(collectEcos).not.toHaveBeenCalled();
  });

  it("매달 1일 회차는 그대로 — 거기서 새로 읽지 않고 KOSIS · ECOS 는 항상 한 번씩", async () => {
    await fire(CRON.pricesMonthly);
    expect(recentPoints).not.toHaveBeenCalled();
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });
});

describe("서로 따로 — 하나가 실패해도 나머지는 그대로", () => {
  it("KOSIS 수집이 던져도(비동기) ECOS · 환율 결과 · 과세환율은 그대로 · 실패는 로그", async () => {
    vi.mocked(collectKosis).mockRejectedValue(new Error("kosis boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectEcos).toHaveBeenCalledTimes(1);
    expect(collectCustomsRates).toHaveBeenCalledTimes(1);
    expect(logged(vi.mocked(console.log) as never).some((l) => l.includes('"fx_scheduled"'))).toBe(true);
    expect(vi.mocked(console.error).mock.calls.length + vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0);
  });

  it("KOSIS 수집이 던져도(동기) 마찬가지", async () => {
    vi.mocked(collectKosis).mockImplementation(() => {
      throw new Error("kosis sync boom");
    });
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });

  it("ECOS 수집이 던져도 KOSIS 는 돎", async () => {
    vi.mocked(collectEcos).mockRejectedValue(new Error("ecos boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectKosis).toHaveBeenCalledTimes(1);
  });

  it("최신 달 읽기가 실패해도(KOSIS 쪽) ECOS 는 판단 · 수집", async () => {
    vi.mocked(recentPoints).mockImplementation(async (_d1, series) => {
      if (series === AIR) throw new Error("D1 read fail");
      return [];
    });
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectEcos).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls.length + vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0);
  });

  it("환율이 던져도 과세환율 · KOSIS · ECOS 는 돎", async () => {
    vi.mocked(dailyFx).mockRejectedValue(new Error("fx boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectCustomsRates).toHaveBeenCalledTimes(1);
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });

  it("과세환율이 던져도 KOSIS · ECOS 는 돎 · 반대로 월간 수집이 던져도 과세환율은 이미 돈 뒤", async () => {
    vi.mocked(collectCustomsRates).mockRejectedValue(new Error("kcs boom"));
    await expect(fire(CRON.fxDaily)).resolves.toBeUndefined();
    expect(collectKosis).toHaveBeenCalledTimes(1);
    expect(collectEcos).toHaveBeenCalledTimes(1);
  });
});
