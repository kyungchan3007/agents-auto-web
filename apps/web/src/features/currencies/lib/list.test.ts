import { describe, expect, it } from "vitest";
import { type ListItem, pickedRegion, regionChips, visibleItems } from "./list";

const item = (currency: string, change: number | null = null): ListItem => ({ currency, signal: null, change });
const ITEMS = [item("USD", 2), item("JPY", -3), item("EUR", 1)];
const opts = { sort: "region" as const, favs: [] as string[], region: "all" as const, query: "" };

describe("통화 목록 계산 (작업 0125)", () => {
  it("즐겨찾기가 있을 때만 그 단추", () => {
    expect(regionChips(ITEMS, 0).map((c) => c.id)).not.toContain("fav");
    expect(regionChips(ITEMS, 2)[1]).toEqual({ id: "fav", label: "★ 즐겨찾기 2" });
  });
  it("즐겨찾기를 다 빼면 전체로", () => {
    expect(pickedRegion("fav", 0)).toBe("all");
    expect(pickedRegion("fav", 1)).toBe("fav");
  });
  it("기본 정렬은 즐겨찾기 먼저 · 찾기로 거름", () => {
    expect(visibleItems(ITEMS, { ...opts, favs: ["EUR"] })[0].currency).toBe("EUR");
    expect(visibleItems(ITEMS, { ...opts, query: "엔" }).map((i) => i.currency)).toEqual(["JPY"]);
    expect(visibleItems(ITEMS, { ...opts, region: "fav", favs: ["USD"] }).map((i) => i.currency)).toEqual(["USD"]);
  });
});
