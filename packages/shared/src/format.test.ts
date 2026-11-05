import { describe, expect, it } from "vitest";
import { isoDaysBefore, kstMonthDay } from "./date";
import { monthDayText, numberText, signedPct, stripNumberText } from "./format";

describe("글자로 바꾸기 (작업 0136)", () => {
  it("숫자는 쉼표 · 소수 자릿수는 옵션대로", () => {
    expect(numberText(1234567)).toBe("1,234,567");
    expect(numberText(1234.567, { maximumFractionDigits: 2 })).toBe("1,234.57");
  });
  it("변화율은 오르면 + · 내리면 그대로 -", () => {
    expect(signedPct(0.8)).toBe("+0.8%");
    expect(signedPct(-1.94)).toBe("-1.9%");
    expect(signedPct(0)).toBe("0.0%");
  });
  it("날짜는 앞의 0 없이", () => {
    expect(monthDayText("2026-01-05")).toBe("1월 5일");
  });
  it("입력 글자의 쉼표 · 빈칸만 뺌", () => {
    expect(stripNumberText(" 12,345.6 ")).toBe("12345.6");
  });
  it("한국 날짜 · 며칠 전", () => {
    expect(kstMonthDay("2026-10-30T15:00:00.000Z")).toBe("10월 31일");
    expect(isoDaysBefore(30, new Date("2026-11-05T00:00:00Z"))).toBe("2026-10-06");
  });
});
