// 어드민 시각 문구 (작업 0312 — 작업실 곳곳에 있던 함수를 모아 검사)
import { describe, expect, it } from "vitest";
import { agoText, countdownText, kstDateTimeText, kstHourMinute, kstStamp } from "./time-text";

describe("어드민 시각 문구", () => {
  it("한국 시간 숫자 칸 · 문장 · 시:분", () => {
    expect(kstStamp("2026-11-14T17:07:00Z")).toBe("11-15 02:07");
    expect(kstStamp("2026-11-14T15:00:00Z")).toBe("11-15 00:00");
    expect(kstDateTimeText("2026-10-30T05:39:00Z")).toBe("10월 30일 14:39");
    expect(kstHourMinute("2026-10-30T03:00:00Z")).toBe("12:00");
  });
  it("몇 분 전", () => {
    expect(agoText(20_000)).toBe("방금");
    expect(agoText(12 * 60_000)).toBe("12분 전");
    expect(agoText(6 * 3_600_000)).toBe("6시간 전");
    expect(agoText(50 * 3_600_000)).toBe("2일 전");
  });
  it("남은 시간 m:ss", () => {
    expect(countdownText(245)).toBe("4:05");
    expect(countdownText(300)).toBe("5:00");
  });
});
