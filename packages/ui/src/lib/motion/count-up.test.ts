// 작업 0216 — 카운트업 값 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — packages/ui/src/lib/motion/count-up.ts
//   export const COUNT_UP_MS = 1000                                  // 약 1초
//   export function countUpStart(final: number, digits = 0): number  // 0 이 아니라 최종 값 근처(85%)에서 시작 · 소수 자리에 맞춰 반올림 · 최종 값이 0 이면 0
//   export function easeOut(t: number): number                       // 0..1 → 0..1 · 끝에서 느려짐 · 범위 밖은 자름
//   export function countUpValue(final: number, progress: number, digits = 0): number  // 시작 값 → 최종 값 · progress 0 = 시작 값 · 1 = 정확히 최종 값 · 소수 자리에 맞춰 반올림
//   export const COUNT_TO_MS = 600                                   // 값을 바꿀 때 이전 값 → 새 값 시간 (작업 0219 · 계산기 결과)
//   export function countTo(from: number, to: number, progress: number, digits = 0): number  // 이전 값 → 새 값 · progress 0 = from · 1 = 정확히 to · 끝에서 느려짐(easeOut) · 범위 밖은 자름 · 소수 자리 반올림
//   export function formatCount(value: number, digits = 0): string   // 쉼표 · 소수 자리 고정 (한국어 로캘) — 1338.8 · 1 → "1,338.8" · 912 · 0 → "912"
import { describe, expect, it } from "vitest";
import { COUNT_TO_MS, COUNT_UP_MS, countTo, countUpStart, countUpValue, easeOut, formatCount } from "./count-up";

describe("formatCount — 쉼표 · 소수 자리", () => {
  it("쉼표와 소수 자리를 고정", () => {
    expect(formatCount(1338.8, 1)).toBe("1,338.8");
    expect(formatCount(912, 0)).toBe("912");
    expect(formatCount(1234567, 0)).toBe("1,234,567");
    expect(formatCount(146.8, 1)).toBe("146.8");
    expect(formatCount(37, 1)).toBe("37.0");
  });
  it("자리 기본값은 정수 · 반올림", () => {
    expect(formatCount(1312.4)).toBe("1,312");
    expect(formatCount(1312.6)).toBe("1,313");
  });
  it("음수 · 0", () => {
    expect(formatCount(0, 1)).toBe("0.0");
    expect(formatCount(-4.1, 1)).toBe("-4.1");
  });
});

describe("countUpStart — 최종 값 근처에서 시작", () => {
  it("0 이 아니고 최종 값보다 작음 · 85% 근처", () => {
    const s = countUpStart(1000);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1000);
    expect(s).toBeCloseTo(850, 0);
  });
  it("소수 자리에 맞춰 반올림", () => {
    expect(countUpStart(1338.8, 1)).toBe(1138.0);
    expect(Number.isInteger(countUpStart(1338.8, 0))).toBe(true);
  });
  it("최종 값이 0 이면 0 · 음수는 최종 값 쪽(덜 음수)에서 시작하지 않고 같은 비율", () => {
    expect(countUpStart(0)).toBe(0);
    expect(Math.abs(countUpStart(-100))).toBeLessThan(100);
  });
});

describe("countUpValue — 진행 비율 → 값", () => {
  it("0 = 시작 값 · 1 = 정확히 최종 값", () => {
    expect(countUpValue(1338.8, 0, 1)).toBe(countUpStart(1338.8, 1));
    expect(countUpValue(1338.8, 1, 1)).toBe(1338.8);
    expect(countUpValue(912, 1)).toBe(912);
  });
  it("범위 밖 진행은 자름", () => {
    expect(countUpValue(500, -1)).toBe(countUpValue(500, 0));
    expect(countUpValue(500, 2)).toBe(500);
  });
  it("진행이 커질수록 값이 커짐(양수) · 최종 값을 넘지 않음", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const v = countUpValue(1338.8, p, 1);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(1338.8);
      prev = v;
    }
  });
  it("소수 자리 수를 지킴", () => {
    const v = countUpValue(146.8, 0.37, 1);
    expect(Math.round(v * 10) / 10).toBe(v);
  });
  it("최종 값이 0 이면 계속 0", () => {
    expect(countUpValue(0, 0.5)).toBe(0);
  });
});

describe("easeOut", () => {
  it("끝점 0 · 1 · 단조 증가 · 끝에서 느려짐", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(easeOut(0.9) - easeOut(0.8)).toBeLessThan(easeOut(0.1) - easeOut(0));
    expect(easeOut(-1)).toBe(0);
    expect(easeOut(3)).toBe(1);
  });
});

describe("시간", () => {
  it("약 1초", () => {
    expect(COUNT_UP_MS).toBeGreaterThanOrEqual(800);
    expect(COUNT_UP_MS).toBeLessThanOrEqual(1200);
  });
});

describe("countTo — 값을 바꿀 때 이전 값에서 새 값으로 (작업 0219)", () => {
  it("0 = 이전 값 · 1 = 정확히 새 값", () => {
    expect(countTo(133880, 267760, 0)).toBe(133880);
    expect(countTo(133880, 267760, 1)).toBe(267760);
    expect(countTo(100, 100, 0.4)).toBe(100);
  });
  it("올라갈 때 단조 증가 · 내려갈 때 단조 감소 · 사이 값", () => {
    let prev = 133880;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const v = countTo(133880, 267760, p);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(267760);
      prev = v;
    }
    let down = 267760;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const v = countTo(267760, 133880, p);
      expect(v).toBeLessThanOrEqual(down);
      expect(v).toBeGreaterThanOrEqual(133880);
      down = v;
    }
  });
  it("범위 밖 progress 는 자름 · 소수 자리에 맞춰 반올림", () => {
    expect(countTo(10, 20, -1)).toBe(10);
    expect(countTo(10, 20, 3)).toBe(20);
    const v = countTo(1, 2, 0.37, 1);
    expect(Math.round(v * 10) / 10).toBe(v);
  });
  it("시간 약 0.6초", () => {
    expect(COUNT_TO_MS).toBeGreaterThanOrEqual(400);
    expect(COUNT_TO_MS).toBeLessThanOrEqual(800);
  });
});
