// 작업 0290 — 요일별 평균 막대 길이 = 그 요일 평균 ÷ 가장 비싼 요일 평균 (사용자가 정한 조건: 시안 57번 "다 수정")
//   값이 없는 요일은 0 · 한 요일만 있거나 모두 같으면 60 (지금 동작 그대로) · 길이는 100 을 넘지 않음 · 받지 못한 값은 만들지 않음
import type { AirfareCity } from "@hav/shared/airfare";
import { describe, expect, it } from "vitest";
import { cityView } from "./airfare-view";

const city = (days: { depart: string; price: number }[]): AirfareCity => ({ id: "t", city: "도쿄", airport: "NRT", fetchedOn: "2026-11-19", days: days.map((d) => ({ ...d, return: d.depart })) }) as unknown as AirfareCity;
// 2026-11-16 은 월요일 → 일주일(월~일)
const WEEK = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];

describe("cityView.weekBars — 막대 길이 (작업 0290)", () => {
  it("길이 = 평균 ÷ 가장 비싼 요일 평균 × 100 · 가장 비싼 요일은 100 · 가장 싼 요일도 0 에서 시작(25 로 올리지 않음)", () => {
    const prices = [300000, 400000, 250000, 350000, 450000, 500000, 600000];
    const v = cityView(city(WEEK.map((d, i) => ({ depart: d, price: prices[i] }))));
    const bars = v?.weekBars ?? [];
    expect(bars.map((b) => b.label)).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
    bars.forEach((b, i) => expect(b.percent).toBeCloseTo((100 * prices[i]) / 600000, 6));
    expect(Math.max(...bars.map((b) => b.percent))).toBe(100);
    expect(bars[2].percent, "가장 싼 요일(수) = 250000 ÷ 600000").toBeCloseTo(41.667, 2);
    expect(bars.filter((b) => b.min).map((b) => b.label), "가장 싼 요일 진한 색 강조는 그대로").toEqual(["수"]);
  });
  it("같은 요일이 여럿이면 그 요일의 평균으로", () => {
    const v = cityView(city([...WEEK, "2026-11-23"].map((d, i) => ({ depart: d, price: i === 7 ? 500000 : 300000 })))); // 월요일이 두 번: 평균 40만
    const bars = v?.weekBars ?? [];
    expect(bars[0].average).toBe(400000);
    expect(bars[0].percent).toBe(100);
    expect(bars[1].percent).toBeCloseTo(75, 6);
  });
  it("값이 없는 요일은 길이 0 · 평균 null(지어내지 않음)", () => {
    const v = cityView(city([{ depart: WEEK[0], price: 300000 }, { depart: WEEK[1], price: 600000 }]));
    const bars = v?.weekBars ?? [];
    expect(bars[0].percent).toBeCloseTo(50, 6);
    expect(bars[1].percent).toBe(100);
    for (const b of bars.slice(2)) { expect(b.average).toBeNull(); expect(b.percent).toBe(0); }
  });
  it("한 요일만 있거나 모두 같으면 60(지금 동작 그대로)", () => {
    expect(cityView(city([{ depart: WEEK[0], price: 300000 }]))?.weekBars[0].percent).toBe(60);
    const same = cityView(city(WEEK.map((d) => ({ depart: d, price: 400000 }))));
    for (const b of same?.weekBars ?? []) expect(b.percent).toBe(60);
  });
});
