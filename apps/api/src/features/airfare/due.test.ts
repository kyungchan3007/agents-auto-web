// 작업 0234 R9 — 이 회차에서 받을 도시 판단 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/airfare/due.ts   ※ 이름 · 모양은 이 테스트의 가정
//   export function isAirfareDay(today: string /* 한국 날짜 YYYY-MM-DD */): boolean       월 · 수 · 금이면 true
//   export function airfareDue(today: string, fetchedToday: string[] /* 오늘 이미 받은 공항 코드 */): string[]
//     월 · 수 · 금이 아니면 [] · 맞으면 AIRFARE_CITIES 의 공항 중 이미 받은 것을 뺀 나머지(순서 유지) — 재시도 회차가 다시 부르지 않게(한 달 104회 유지)
import { describe, expect, it } from "vitest";
import { airfareDue, isAirfareDay } from "./due";
import { AIRFARE_CITIES } from "./serpapi";

const ALL = AIRFARE_CITIES.map((c) => c.airport);

describe("월 · 수 · 금만 (R9)", () => {
  it("2026-11-16(월) ~ 11-22(일) 주: 월 수 금만 true", () => {
    const week = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];
    expect(week.map(isAirfareDay)).toEqual([true, false, true, false, true, false, false]);
  });
  it("달 · 해가 넘어가도 같은 규칙 (2026-12-30 수 · 2027-01-01 금 · 2027-01-02 토)", () => {
    expect([isAirfareDay("2026-12-30"), isAirfareDay("2027-01-01"), isAirfareDay("2027-01-02")]).toEqual([true, true, false]);
  });
  it("한 달(30일) 동안 받는 날은 12 ~ 13일 → 8곳 × 13 = 104 이하", () => {
    let n = 0;
    for (let d = 1; d <= 30; d++) if (isAirfareDay(`2026-11-${String(d).padStart(2, "0")}`)) n++;
    expect(n).toBeGreaterThanOrEqual(12);
    expect(n).toBeLessThanOrEqual(13);
    expect(n * AIRFARE_CITIES.length).toBeLessThanOrEqual(104);
  });
});

describe("airfareDue — 오늘 받을 공항 (R9)", () => {
  it("월 · 수 · 금이고 아직 안 받았으면 8곳 모두 · 순서 유지", () => {
    expect(airfareDue("2026-11-20", [])).toEqual(ALL);
  });
  it("화 · 목 · 토 · 일은 빈 목록", () => {
    for (const d of ["2026-11-17", "2026-11-19", "2026-11-21", "2026-11-22"]) expect(airfareDue(d, [])).toEqual([]);
  });
  it("그날 이미 받은 도시는 건너뜀 (재시도 회차가 다시 부르지 않음)", () => {
    expect(airfareDue("2026-11-20", ["NRT", "KIX", "BKK"])).toEqual(ALL.slice(3));
    expect(airfareDue("2026-11-20", ALL)).toEqual([]);
  });
  it("모르는 공항 코드가 와도 무시 (던지지 않음)", () => {
    expect(airfareDue("2026-11-20", ["XXX"])).toEqual(ALL);
  });
});
