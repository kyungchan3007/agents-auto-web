// 작업 0181 — /flights 의 가장 싼 달이 홈 맨 위(여행 타이밍)와 같은 말을 함 (사이트 안에서 엇갈리지 않음)
import { describe, expect, it } from "vitest";
import { flightsHeadline } from "../features/flights/flights-copy";
import { cheapMonth } from "../features/flights/travel-index";
import { travelTiming } from "../features/home/timing/travel-timing";

/** 2024-11 ~ 2026-10 (24개월) · 4월이 가장 싼 모양 */
const SHAPE = [101, 100, 98, 93, 96, 99, 104, 108, 103, 100, 102, 105];
const series24 = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 10 + i, 1));
  const m = d.getUTCMonth() + 1;
  return { period: `${d.getUTCFullYear()}-${String(m).padStart(2, "0")}`, value: SHAPE[m - 1] + (d.getUTCFullYear() - 2024) };
});

describe("/flights 싼 달 = 홈 싼 달", () => {
  it("24개월 자료 — 같은 달을 말함 (예전엔 /flights 만 '준비 중')", () => {
    const home = travelTiming(series24);
    expect(home.kind).toBe("ready");
    expect(cheapMonth(series24)).toBe(home.kind === "ready" ? home.cheapest : -1);
    expect(flightsHeadline(cheapMonth(series24), null)).toBe("항공료는 4월이 싼 편");
  });

  it("값이 있는 달이 모자랄 때만 둘 다 '준비 중'", () => {
    const one = [{ period: "2026-10", value: 100 }];
    expect(travelTiming(one).kind).toBe("preparing");
    expect(cheapMonth(one)).toBeNull();
    expect(flightsHeadline(null, null)).toBe("준비 중");
  });
});
