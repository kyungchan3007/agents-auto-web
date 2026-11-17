import { describe, expect, it } from "vitest";
import { INTRO_OFF_KEY, PICKED_STORAGE_KEY, PICK_EVENT, type PickedTrip, bandOf, countriesOf, parsePicked, readPicked, relativeText, serializePicked, TRAVEL_COUNTRIES, travelBands, writePicked } from "./travel";

const row = (country: string, relative: number, year = 2025) => ({ country, year, level: relative * 0.6, relative, source: "worldbank:test" });

describe("물가 묶음", () => {
  it("경계 — 0.9 미만 싼 편 · 1.1 초과 비싼 편 · 경계 값은 비슷", () => {
    expect([0.52, 0.9, 1, 1.1, 1.116].map(bandOf)).toEqual(["cheap", "similar", "similar", "similar", "pricey"]);
  });

  it("문장 — 퍼센트 반올림 · 0 은 거의 같음", () => {
    expect(relativeText(1.616)).toBe("62% 비쌈");
    expect(relativeText(0.521)).toBe("48% 쌈");
    expect(relativeText(1.004)).toBe("거의 같음");
  });
});

describe("여행지 나라 고르기", () => {
  const levels = { base: "KOR", rows: [row("KOR", 1), row("THA", 0.521), row("USA", 1.616), row("JPN", 1.05), row("ZZZ", 0.1), row("GUM", 1.3, 2021)] };

  it("표에 있는 나라만 · 싼 나라부터 · 기준 나라(한국)는 뺌", () => {
    const { bands } = travelBands(levels);
    expect(bands.map((b) => [b.id, b.rows.map((r) => r.country)])).toEqual([
      ["cheap", ["THA"]],
      ["similar", ["JPN"]],
      ["pricey", ["GUM", "USA"]],
    ]);
  });

  it("자료가 없는 나라는 지어내지 않고 missing 으로 (TRV-02)", () => {
    const { missing, bands } = travelBands(levels);
    expect(missing).toContain("TWN");
    expect(bands.flatMap((b) => b.rows).some((r) => r.country === "TWN")).toBe(false);
  });

  it("기준 연도가 섞이면 모두 알려 줌 (TRV-03) · 최신부터", () => {
    expect(travelBands(levels).years).toEqual([2025, 2021]);
  });

  it("빈 묶음은 빠짐", () => {
    expect(travelBands({ base: "KOR", rows: [row("THA", 0.5)] }).bands.map((b) => b.id)).toEqual(["cheap"]);
  });

  it("통화 → 나라 · 유로는 여러 나라", () => {
    expect(countriesOf("JPY")).toEqual(["JPN"]);
    expect(countriesOf("EUR").length).toBeGreaterThan(5);
    expect(Object.values(TRAVEL_COUNTRIES).every((c) => /^[A-Z]{2}$/.test(c.flag))).toBe(true);
  });
});

// 작업 0185 — 인트로에서 고른 여행지 저장 (홈 안내판 · 인트로가 함께 씀 → 기능 폴더끼리 직접 참조 못 해 @hav/shared/travel 에 둠) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — packages/shared/src/domain/travel.ts
//   export const PICKED_STORAGE_KEY = "flapfx:picked"            // localStorage 키 (브라우저 안에만 · 서버로 안 보냄)
//   export const PICK_EVENT = "flapfx:intro-pick"                 // 인트로가 끝날 때 window 로 보내는 이벤트 이름 (detail = PickedTrip)
//   export const INTRO_OFF_KEY = "flapfx:intro-off"               // 값 "1" 이면 인트로를 열지 않는 끄기 스위치 (e2e · 개발용 · 화면에 노출하지 않음)
//   export type PickedTrip = { v: 1; country: string /* ISO alpha-3 · TRAVEL_COUNTRIES 의 키 */; city: string /* 1~20자 */; budget: number /* 원 · 0 이상 정수 · 최대 1e10 */ }
//   export function parsePicked(raw: string | null | undefined): PickedTrip | null   // 잘못된 값은 무시(null) — JSON 아님 · v 가 1 아님 · 모르는 나라 · 빈/긴 도시 · 예산이 음수/소수/NaN/너무 큼/숫자 아님
//   export function serializePicked(p: PickedTrip): string                           // JSON.stringify
//   export function readPicked(storage: Pick<Storage, "getItem"> | null | undefined): PickedTrip | null   // 저장소가 없거나 던져도(비공개 창) null
//   export function writePicked(storage: Pick<Storage, "setItem"> | null | undefined, p: PickedTrip): boolean // 모르는 나라 등 잘못된 값이면 쓰지 않고 false · 저장소가 던져도 false · 성공 true

describe("고른 여행지 저장 (작업 0185)", () => {
  const OK: PickedTrip = { v: 1, country: "FRA", city: "파리", budget: 1_000_000 };
  const store = (initial: Record<string, string> = {}) => {
    const m = new Map(Object.entries(initial));
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
  };

  it("키 · 이벤트 이름 · 끄기 스위치 이름", () => {
    expect(PICKED_STORAGE_KEY).toBe("flapfx:picked");
    expect(PICK_EVENT).toBe("flapfx:intro-pick");
    expect(INTRO_OFF_KEY).toBe("flapfx:intro-off");
  });

  it("쓴 값을 그대로 읽음 (serialize → parse)", () => {
    expect(parsePicked(serializePicked(OK))).toEqual(OK);
    expect(parsePicked(serializePicked({ ...OK, budget: 0 }))).toEqual({ ...OK, budget: 0 });
  });

  it("잘못된 값은 무시 — null", () => {
    const bad = [
      null,
      undefined,
      "",
      "not json",
      "123",
      "null",
      JSON.stringify({ ...OK, v: 2 }),
      JSON.stringify({ ...OK, country: "ZZZ" }),
      JSON.stringify({ ...OK, country: 3 }),
      JSON.stringify({ ...OK, city: "" }),
      JSON.stringify({ ...OK, city: "가".repeat(21) }),
      JSON.stringify({ ...OK, city: 7 }),
      JSON.stringify({ ...OK, budget: -1 }),
      JSON.stringify({ ...OK, budget: 1.5 }),
      JSON.stringify({ ...OK, budget: 1e11 }),
      JSON.stringify({ ...OK, budget: "1000" }),
      JSON.stringify({ v: 1, country: "FRA", city: "파리" }),
    ];
    for (const raw of bad) expect(parsePicked(raw), String(raw)).toBeNull();
  });

  it("모르는 필드는 버리고 알려진 필드만 돌려줌", () => {
    expect(parsePicked(JSON.stringify({ ...OK, extra: "<script>" }))).toEqual(OK);
  });

  it("readPicked / writePicked — 저장소에 한 번에 한 값 · 덮어씀", () => {
    const s = store();
    expect(readPicked(s)).toBeNull();
    expect(writePicked(s, OK)).toBe(true);
    expect(readPicked(s)).toEqual(OK);
    expect(s.m.has(PICKED_STORAGE_KEY)).toBe(true);
    expect(writePicked(s, { ...OK, country: "JPN", city: "도쿄" })).toBe(true);
    expect(readPicked(s)?.country).toBe("JPN");
  });

  it("잘못된 값은 쓰지 않음 · 저장소가 없거나 던져도 죽지 않음", () => {
    const s = store();
    expect(writePicked(s, { ...OK, country: "ZZZ" })).toBe(false);
    expect(s.m.size).toBe(0);
    expect(writePicked(null, OK)).toBe(false);
    expect(readPicked(null)).toBeNull();
    const boom = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
    expect(readPicked(boom)).toBeNull();
    expect(writePicked(boom, OK)).toBe(false);
  });

  it("저장소에 망가진 글이 있어도 null (다시 인트로를 하면 덮어씀)", () => {
    expect(readPicked(store({ [PICKED_STORAGE_KEY]: "{oops" }))).toBeNull();
  });
});
