// 작업 0381 — 블랙프라이데이 hero 기간 판정 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(prd 1): 배포 즉시 ~ 2026-12-01 17:00 KST · 그 뒤 자동으로 기본 hero · 시작 · 끝 시각은 상수 한 곳 · 경계: 끝 1초 전은 블프 · 끝 시각부터 기본
//
// builder 가 만들 것 — apps/web/src/features/home/blackfriday/bf-period.ts
//   export const BF_END = "2026-12-01T17:00:00+09:00"            // 끝 시각 상수 한 곳 (ISO · 한국 시간대 표시 포함)
//   export function isBlackFriday(now: Date | number): boolean   // now 가 BF_END 보다 앞이면 true · 같거나 뒤면 false (시작 시각 없음 · 배포 즉시)
import { describe, expect, it } from "vitest";
import { BF_END, isBlackFriday } from "./bf-period";

const at = (iso: string) => new Date(iso);

describe("BF_END — 상수 한 곳", () => {
  it("2026-12-01 17:00 한국 시간 (= 08:00 UTC)", () => {
    expect(BF_END).toBe("2026-12-01T17:00:00+09:00");
    expect(new Date(BF_END).toISOString()).toBe("2026-12-01T08:00:00.000Z");
  });
});

describe("isBlackFriday — 경계", () => {
  it("끝 1초 전은 블랙프라이데이", () => {
    expect(isBlackFriday(at("2026-12-01T16:59:59+09:00"))).toBe(true);
    expect(isBlackFriday(at("2026-12-01T16:59:59.999+09:00"))).toBe(true);
  });

  it("끝 시각 정각부터 기본 hero", () => {
    expect(isBlackFriday(at("2026-12-01T17:00:00+09:00"))).toBe(false);
    expect(isBlackFriday(at("2026-12-01T17:00:01+09:00"))).toBe(false);
  });

  it("시간대가 달라도 같은 순간이면 같은 답 (UTC 08:00 = 한국 17:00)", () => {
    expect(isBlackFriday(at("2026-12-01T07:59:59Z"))).toBe(true);
    expect(isBlackFriday(at("2026-12-01T08:00:00Z"))).toBe(false);
  });

  it("숫자(밀리초)로 줘도 같음", () => {
    const end = new Date(BF_END).getTime();
    expect(isBlackFriday(end - 1000)).toBe(true);
    expect(isBlackFriday(end)).toBe(false);
  });

  it("끝난 뒤에는 계속 기본 — 다음 날 · 다음 해", () => {
    expect(isBlackFriday(at("2026-12-02T00:00:00+09:00"))).toBe(false);
    expect(isBlackFriday(at("2027-11-27T00:00:00+09:00"))).toBe(false);
  });
});

describe("isBlackFriday — 기간 안", () => {
  it("블랙프라이데이 당일 · 사이버먼데이(미국) · 12-01 새벽", () => {
    for (const iso of ["2026-11-27T00:00:00+09:00", "2026-11-30T12:00:00+09:00", "2026-12-01T00:00:00+09:00", "2026-12-01T09:00:00+09:00"]) {
      expect(isBlackFriday(at(iso)), iso).toBe(true);
    }
  });

  it("배포 즉시 — 시작 시각이 없어 지금(11-26 · 11-27 전)도 블랙프라이데이", () => {
    expect(isBlackFriday(at("2026-11-26T20:00:00+09:00"))).toBe(true);
  });
});
