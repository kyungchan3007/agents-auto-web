// 작업 0193 — 통화 상세 "이 통화 쓰는 나라 물가 보기" 가 그 통화를 쓰는 나라만 보여 줌 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 나라 판정은 공용 countriesOf(@hav/shared/travel) · 새 표 없음 · 물가 자료가 없는 나라는 noData 로 남김(지어내지 않음)
import { type PriceLevels } from "@hav/shared/prices";
import { travelBands } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import { currencyFilter, parseCurrencyParam } from "./currency-filter";

const rowOf = (country: string, relative: number) => ({ country, year: 2024, level: relative * 100, relative, source: "wb" });
// 유로 나라 중 핀란드(FIN)만 자료 없음 · 일본 · 미국 · 괌(USD · 자료 없음) · 마카오(통화 없음)
const LEVELS: PriceLevels = {
  base: "KOR",
  rows: ["JPN", "USA", "FRA", "DEU", "ITA", "ESP", "PRT", "NLD", "AUT", "GRC"].map((c, i) => rowOf(c, 0.6 + i * 0.1)),
};
const DATA = travelBands(LEVELS);
const filter = (raw: string | null) => currencyFilter(DATA.bands, DATA.missing, raw);
const isosOf = (r: ReturnType<typeof filter>) => (r.kind === "filtered" ? r.bands.flatMap((b) => b.rows.map((x) => x.country)).sort() : []);

describe("parseCurrencyParam", () => {
  it("영문 3글자만 대문자로 · 그 밖은 null", () => {
    expect(parseCurrencyParam("eur")).toBe("EUR");
    expect(parseCurrencyParam(" JPY ")).toBe("JPY");
    expect(parseCurrencyParam("")).toBeNull();
    expect(parseCurrencyParam(null)).toBeNull();
    expect(parseCurrencyParam("<b>")).toBeNull();
    expect(parseCurrencyParam("EURO")).toBeNull();
  });
});

describe("currencyFilter", () => {
  it("주소에 통화가 없으면 거르지 않음 (all)", () => {
    expect(filter(null).kind).toBe("all");
    expect(filter("").kind).toBe("all");
  });

  it("유로 — 유로 쓰는 나라만 (자료 있는 8곳) · 핀란드는 자료 없음으로 남음 · 일본 · 미국은 없음", () => {
    const r = filter("EUR");
    expect(r.kind).toBe("filtered");
    expect(isosOf(r)).toEqual(["AUT", "DEU", "ESP", "FRA", "GRC", "ITA", "NLD", "PRT"]);
    if (r.kind === "filtered") {
      expect(r.noData).toEqual(["FIN"]);
      expect(r.code).toBe("EUR");
      expect(r.notice).toBe("유로를 쓰는 나라 9곳");
    }
  });

  it("엔화 — 나라 하나 (일본) · 안내 '엔화를 쓰는 나라 1곳'", () => {
    const r = filter("jpy");
    expect(isosOf(r)).toEqual(["JPN"]);
    if (r.kind === "filtered") {
      expect(r.noData).toEqual([]);
      expect(r.notice).toBe("엔화를 쓰는 나라 1곳");
    }
  });

  it("달러 — 미국(자료 있음) · 괌(자료 없음)", () => {
    const r = filter("USD");
    expect(isosOf(r)).toEqual(["USA"]);
    if (r.kind === "filtered") {
      expect(r.noData).toEqual(["GUM"]);
      expect(r.notice).toBe("달러를 쓰는 나라 2곳");
    }
  });

  it("묶음 안에 걸러진 나라가 없으면 그 묶음은 뺌", () => {
    const r = filter("JPY");
    if (r.kind === "filtered") expect(r.bands.every((b) => b.rows.length > 0)).toBe(true);
  });

  it("쓰는 나라는 있지만 물가 자료가 모두 없으면 bands 가 비고 noData 만 (지어내지 않음)", () => {
    const empty = currencyFilter([], ["FIN"], "EUR");
    expect(empty.kind).toBe("filtered");
    if (empty.kind === "filtered") {
      expect(empty.bands).toEqual([]);
      expect(empty.noData).toContain("FIN");
    }
  });

  it("모르는 코드 · 쓰는 나라가 없는 코드(KRW · ZZZ) · 이상한 글자는 거르지 않고 안내 (unknown)", () => {
    for (const raw of ["ZZZ", "KRW", "<script>", "EURO"]) {
      const r = filter(raw);
      expect(r.kind, raw).toBe("unknown");
      if (r.kind === "unknown") expect(r.notice).toContain("전체");
    }
  });
});
