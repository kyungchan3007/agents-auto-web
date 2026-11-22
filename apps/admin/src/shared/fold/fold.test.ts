import { describe, expect, it } from "vitest";
import { countIn, foldAllText, shownItems } from "./fold";

const items = [{ c: "a" }, { c: "b" }, { c: "a" }] as const;
const catOf = (x: (typeof items)[number]) => x.c;

describe("묶음 목록", () => {
  it("고른 묶음만 · 원래 번호 그대로", () => {
    expect(shownItems(items, catOf, "all").map((s) => s.i)).toEqual([0, 1, 2]);
    expect(shownItems(items, catOf, "a").map((s) => s.i)).toEqual([0, 2]);
  });
  it("개수 · 단추 글", () => {
    expect(countIn(items, catOf, "a")).toBe(2);
    expect(foldAllText(true)).toBe("모두 접기");
    expect(foldAllText(false)).toBe("모두 펼치기");
  });
});
