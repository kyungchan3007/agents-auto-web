import { describe, expect, it } from "vitest";
import { periodRows, showsSummary, summaryOf } from "./summary";

const rate = { date: "2026-11-04", baseRate: 90, unit: 1 };
const days = [
  { date: "2026-10-30", baseRate: 110 },
  { date: "2026-11-04", baseRate: 90 },
];

describe("요약 문장 (작업 0115)", () => {
  it("기준일 · 환율 · 평균 대비 · 판단 · 예측 아님", () => {
    const s = summaryOf("달러", "USD", rate, days, { signal: "cheap", percentile: 0.12, windowDays: 90 });
    expect(s).toContain("2026-11-04 기준 달러(USD) 환율은");
    expect(s).toContain("최근 1년 2일의 평균");
    expect(s).toContain("10.0% 낮습니다");
    expect(s).toContain("최근 90일 기준으로는 싼 편입니다");
    expect(s).toContain("예측이 아닙니다");
  });

  it("기록 · 신호가 없으면 그 문장을 만들지 않음 (FX-02)", () => {
    const s = summaryOf("달러", "USD", rate, [], null);
    expect(s).not.toContain("평균");
    expect(s).not.toContain("기준으로는");
  });

  it("비교군은 고정 — 절반쯤만", () => {
    expect(showsSummary("USD")).toBe(true);
    expect(showsSummary("JPY")).toBe(false);
    expect(showsSummary("XXX")).toBe(false);
  });
});

describe("기간별 표 (작업 0115)", () => {
  it("기록이 그 기간을 채우는 줄만 — 짧은 기록을 1년으로 보이지 않음", () => {
    const long = [
      { date: "2026-08-01", baseRate: 100 },
      { date: "2026-10-10", baseRate: 110 },
      { date: "2026-11-04", baseRate: 121 },
    ];
    expect(periodRows(long).map((r) => r.id)).toEqual(["1m", "3m"]);
    expect(periodRows(long)[0].pct).toBeCloseTo(10);
    expect(periodRows([])).toEqual([]);
  });
});
