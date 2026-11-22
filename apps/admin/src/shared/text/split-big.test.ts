import { describe, expect, it } from "vitest";
import { splitNumber, splitTime } from "./split-big";

describe("숫자 칸 나누기", () => {
  it("숫자 · 나머지", () => {
    expect(splitNumber("536회")).toEqual({ big: "536", rest: "회" });
    expect(splitNumber("0 / 24 질문")).toEqual({ big: "0", rest: "/ 24 질문" });
    expect(splitNumber("측정 전")).toEqual({ big: "측정 전", rest: "" });
  });
  it("시각 · 나머지", () => {
    expect(splitTime("11-20 12:00 성공 · 공식 22개")).toEqual({ big: "11-20 12:00", rest: "성공 · 공식 22개" });
    expect(splitTime("12:00")).toEqual({ big: "12:00", rest: "" });
    expect(splitTime("기록 없음")).toEqual({ big: "기록 없음", rest: "" });
  });
});
