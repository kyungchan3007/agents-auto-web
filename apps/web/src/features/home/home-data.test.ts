import type { Fetched } from "@/shared/api";
import type { HomeData } from "./home-data";
import { HERO, homeView } from "./home-data";
import { describe, expect, it } from "vitest";

const fail = { ok: false as const, reason: "연결 실패" };
const usd = { date: "2026-11-05", currency: HERO, unit: 1, baseRate: 1300, ttb: null, tts: null, source: "koreaexim" };
const latest = { ok: true, data: { date: "2026-11-05", rates: [usd] } } as unknown as Fetched<never>;
const data = (over: Partial<HomeData>): HomeData => ({ latest: fail, signals: fail, levels: fail, heroHistory: fail, changes: fail, ...over });

describe("홈 자료 가공 (작업 0125)", () => {
  it("못 받으면 숫자를 만들지 않고 이유 (FX-02)", () => {
    const v = homeView(data({}));
    expect(v.hero).toBeUndefined();
    expect(v.problem).toBe("연결 실패");
    expect(v.year).toEqual([]);
    expect(v.heroHistoryProblem).toBe("연결 실패");
    expect(v.windowDays).toBe(90);
  });
  it("환율만 받아도 첫 화면 값은 있음 · 신호 실패는 이유로", () => {
    const v = homeView(data({ latest: latest as never }));
    expect(v.hero?.baseRate).toBe(1300);
    expect(v.problem).toBe("연결 실패");
    expect(v.stops.every((s) => s.signal === null && s.price === null)).toBe(true);
  });
});
