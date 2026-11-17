// 작업 0201 — 여행지 검색 · 자주 가는 곳 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/shared/destination-search.ts (순수 함수 · 홈 시트와 여행 물가 시트가 같이 씀)
//   export type DestinationHit = { country: string /* ISO alpha-3 · TRAVEL_COUNTRIES 키 */; city: string; label: string /* "일본 도쿄" */ }
//   export function searchDestinations(query: string, limit?: number /* 기본 8 */): DestinationHit[]
//     - 도시 이름 · 나라 이름으로 찾음 (앞부분 일치 → 포함 순) · 나라 이름이 맞으면 그 나라 도시 모두(대표 도시 먼저)
//     - 빈 칸 · 공백 · 못 찾음 → [] · 같은 (나라, 도시) 는 한 번만 · TRAVEL_COUNTRIES 에 없는 나라는 뺌 (저장할 수 없음)
//   export const POPULAR_DESTINATIONS: DestinationHit[]   // 자주 가는 곳 칩 — 모두 저장할 수 있는 값
import { TRAVEL_CITIES, TRAVEL_COUNTRIES, parsePicked, serializePicked } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import { POPULAR_DESTINATIONS, searchDestinations } from "./destination-search";

describe("searchDestinations", () => {
  it("도시 이름으로 — 도쿄", () => {
    expect(searchDestinations("도쿄")[0]).toEqual({ country: "JPN", city: "도쿄", label: "일본 도쿄" });
  });
  it("앞부분 일치가 먼저 — '도' 는 도쿄가 맨 앞", () => {
    expect(searchDestinations("도")[0].city).toBe("도쿄");
  });
  it("나라 이름으로 — 일본은 그 나라 도시 모두 · 대표 도시(도쿄) 먼저", () => {
    const hits = searchDestinations("일본", 20);
    expect(hits.map((h) => h.city)).toEqual(TRAVEL_CITIES.JPN);
    expect(hits.every((h) => h.country === "JPN")).toBe(true);
  });
  it("두바이는 찾아지고 · 앞뒤 공백 무시", () => {
    expect(searchDestinations("  두바이 ")[0]).toMatchObject({ country: "ARE", city: "두바이" });
  });
  it("빈 칸 · 공백 · 못 찾는 글 → []", () => {
    expect(searchDestinations("")).toEqual([]);
    expect(searchDestinations("   ")).toEqual([]);
    expect(searchDestinations("zzzz없는곳")).toEqual([]);
  });
  it("limit — 기본 8 · 지정하면 그만큼 · 같은 (나라, 도시) 는 한 번", () => {
    expect(searchDestinations("시").length).toBeLessThanOrEqual(8);
    expect(searchDestinations("시", 3).length).toBeLessThanOrEqual(3);
    const keys = searchDestinations("시", 50).map((h) => `${h.country}/${h.city}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("찾은 값은 모두 저장할 수 있는 값 (PickedTrip 으로 읽힘)", () => {
    for (const h of [...searchDestinations("시", 50), ...searchDestinations("나", 50)]) {
      expect(Object.hasOwn(TRAVEL_COUNTRIES, h.country), h.country).toBe(true);
      expect(parsePicked(serializePicked({ v: 1, country: h.country, city: h.city, budget: 0 })), `${h.country} ${h.city}`).not.toBeNull();
    }
  });
});

describe("POPULAR_DESTINATIONS", () => {
  it("칩 6~10개 · 모두 저장할 수 있고 도시 목록에 있음 · 중복 없음", () => {
    expect(POPULAR_DESTINATIONS.length).toBeGreaterThanOrEqual(6);
    expect(POPULAR_DESTINATIONS.length).toBeLessThanOrEqual(10);
    for (const h of POPULAR_DESTINATIONS) {
      expect(TRAVEL_CITIES[h.country] ?? []).toContain(h.city);
      expect(h.label).toContain(h.city);
    }
    expect(new Set(POPULAR_DESTINATIONS.map((h) => `${h.country}/${h.city}`)).size).toBe(POPULAR_DESTINATIONS.length);
  });
  it("도쿄 · 방콕이 들어 있음", () => {
    const cities = POPULAR_DESTINATIONS.map((h) => h.city);
    expect(cities).toContain("도쿄");
    expect(cities).toContain("방콕");
  });
});
