import { describe, expect, it } from "vitest";
import { fitRows } from "./list-fit";

describe("fitRows — 줄 높이의 배수 (작업 0212)", () => {
  it("들어가는 줄 수만큼의 높이", () => {
    expect(fitRows(608, 71)).toBe(568); // 8줄
    expect(fitRows(640, 71)).toBe(639); // 9줄
    expect(fitRows(710, 71)).toBe(710); // 딱 10줄
  });
  it("한 줄도 안 들어가면 한 줄 · 줄 높이를 모르면 null", () => {
    expect(fitRows(30, 71)).toBe(71);
    expect(fitRows(600, 0)).toBeNull();
    expect(fitRows(Number.NaN, 71)).toBeNull();
  });
});
