// 작업 0234 R9 · R10 — 항공권 출발일 달력 계약 AirfareCalendar (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — packages/shared/src/contracts/airfare.ts (+ package.json exports "./airfare")
//   export const AirfareCalendar = z.object({ fetchedOn: IsoDate | null, cities: Array<{ id, city, airport, fetchedOn: IsoDate, days: Array<{ depart: IsoDate, return: IsoDate, price: 양의 정수(KRW) }> }> })
//   받지 못한 도시는 목록에 없음(빈 값 · 숫자를 만들지 않음) · 구글 "싼 날"(low)은 계약에 없음 (모르는 키는 결과에서 빠짐)
import { describe, expect, it } from "vitest";
import { AirfareCalendar } from "./airfare";
import fixture from "../../../../apps/api/src/features/airfare/fixtures/calendar.json";

const city = (over: object = {}) => ({ id: "NRT", city: "도쿄", airport: "NRT", fetchedOn: "2026-11-19", days: [{ depart: "2026-11-20", return: "2026-11-27", price: 389700 }], ...over });

describe("AirfareCalendar 계약", () => {
  it("고정 자료(도시 4곳 · 42일)를 그대로 받음", () => {
    const r = AirfareCalendar.parse(fixture);
    expect(r.cities).toHaveLength(4);
    expect(r.cities.every((c) => c.days.length === 42)).toBe(true);
    expect(r.fetchedOn).toBe("2026-11-19");
  });

  it("자료가 없으면 fetchedOn null · 도시 0 이 올바른 모양 (숫자를 만들지 않음)", () => {
    expect(AirfareCalendar.parse({ fetchedOn: null, cities: [] })).toEqual({ fetchedOn: null, cities: [] });
  });

  it("날짜 형식 · 가격이 틀리면 실패 (달력에 없는 날 · 소수 · 0 · 음수 · 글자)", () => {
    for (const bad of [
      { days: [{ depart: "2026-02-30", return: "2026-03-07", price: 100000 }] },
      { days: [{ depart: "2026/11/20", return: "2026-11-27", price: 100000 }] },
      { days: [{ depart: "2026-11-20", return: "2026-11-27", price: 100000.5 }] },
      { days: [{ depart: "2026-11-20", return: "2026-11-27", price: 0 }] },
      { days: [{ depart: "2026-11-20", return: "2026-11-27", price: -5 }] },
      { days: [{ depart: "2026-11-20", return: "2026-11-27", price: "389700" }] },
      { fetchedOn: "어제" },
    ]) expect(AirfareCalendar.safeParse({ fetchedOn: "2026-11-19", cities: [city(bad)] }).success, JSON.stringify(bad)).toBe(false);
  });

  it("구글 '싼 날'(low)은 계약에 없음 — 들어와도 결과에서 빠짐", () => {
    const r = AirfareCalendar.parse({ fetchedOn: "2026-11-19", cities: [city({ days: [{ depart: "2026-11-20", return: "2026-11-27", price: 389700, low: true }] })] });
    expect(r.cities[0].days[0]).toEqual({ depart: "2026-11-20", return: "2026-11-27", price: 389700 });
  });

  it("필수 칸이 빠지면 실패 (city · airport · days)", () => {
    for (const k of ["id", "city", "airport", "fetchedOn", "days"]) {
      const c: Record<string, unknown> = city();
      delete c[k];
      expect(AirfareCalendar.safeParse({ fetchedOn: "2026-11-19", cities: [c] }).success, k).toBe(false);
    }
  });
});
