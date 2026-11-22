import { describe, expect, it } from "vitest";
import { howStats } from "./how-stats";

describe("만드는 방식 숫자 칸", () => {
  it("못 센 칸은 빼고 · 숫자는 천 단위 쉼표", () => {
    const s = howStats({ tasks: 1312, protectedRules: null, hooks: 7 });
    expect(s.map((x) => x.k)).toEqual(["작업", "에이전트 자리", "훅"]);
    expect(s[0]?.v).toBe("1,312");
  });
});
