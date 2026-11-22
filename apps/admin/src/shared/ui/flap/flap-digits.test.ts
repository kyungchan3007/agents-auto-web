import { describe, expect, it } from "vitest";
import { cellStyle, spinDigit, stopTick } from "./flap-digits";

describe("안내판 숫자", () => {
  it("멈출 때 최종 값", () => {
    const stop = stopTick(1, 0);
    expect(stop).toBe(8);
    expect(spinDigit("7", stop, stop)).toBe("7");
    expect(spinDigit("7", stop, stop - 1)).toBe("8");
  });
  it("칸 너비", () => {
    expect(cellStyle(" ")).toEqual({ width: "0.35em" });
    expect(cellStyle("3")).toEqual({ minWidth: "0.6em" });
    expect(cellStyle("회")).toEqual({ minWidth: undefined });
  });
});
