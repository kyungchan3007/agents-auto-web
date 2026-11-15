// 작업 0171 — 월간 지표가 "채울 때인지" 판단하는 순수 함수 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/indicators/due.ts
//   export const KOSIS_PUBLISH_DAY = 5      // KOSIS: 11-03 에 10월 자료 확인 · 여유 두 날 (0164 plan)
//   export const ECOS_PUBLISH_DAY = 17      // ECOS: 다음 달 15일경 발표 · 여유 두 날 (0165 plan)
//   export function monthlyDue(latest: string | null, today: string /* 한국 날짜 YYYY-MM-DD */, publishDay: number): boolean
//     - 기대하는 최신 달 = today 의 일(日)이 publishDay 이상이면 지난달, 아니면 지지난달 (연도 넘어감 포함)
//     - latest 가 null · 빈 글 · "YYYY-MM" 형식이 아니면 true (비었거나 읽을 수 없으면 채움)
//     - latest 가 기대 달보다 앞이면 true · 같거나 뒤면 false (기대 달보다 뒤인 값이 와도 다시 받지 않음)
import { describe, expect, it } from "vitest";
import { ECOS_PUBLISH_DAY, KOSIS_PUBLISH_DAY, monthlyDue } from "./due";

describe("발표일 상수", () => {
  it("KOSIS 5일 · ECOS 17일 (계획에 적은 값)", () => {
    expect(KOSIS_PUBLISH_DAY).toBe(5);
    expect(ECOS_PUBLISH_DAY).toBe(17);
  });
});

describe("monthlyDue — 비어 있음", () => {
  it("latest 가 null · 빈 글 · 형식이 틀리면 날짜와 상관없이 true", () => {
    for (const latest of [null, "", "abc", "2026", "2026-1", "2026-13", "2026-00", "2026/10"]) {
      for (const today of ["2026-11-01", "2026-11-05", "2026-11-30"]) expect(monthlyDue(latest, today, 5), `${latest} ${today}`).toBe(true);
    }
  });
});

describe("monthlyDue — 발표일 전날 · 당일 (publishDay 5)", () => {
  it("발표일 전날(11-04): 기대 달은 지지난달(2026-09) → 2026-09 면 false · 2026-08 이면 true", () => {
    expect(monthlyDue("2026-09", "2026-11-04", 5)).toBe(false);
    expect(monthlyDue("2026-08", "2026-11-04", 5)).toBe(true);
  });

  it("발표일 당일(11-05): 기대 달은 지난달(2026-10) → 2026-10 이면 false · 2026-09 면 true", () => {
    expect(monthlyDue("2026-10", "2026-11-05", 5)).toBe(false);
    expect(monthlyDue("2026-09", "2026-11-05", 5)).toBe(true);
  });

  it("발표일 이후(11-30)도 기대 달은 지난달", () => {
    expect(monthlyDue("2026-10", "2026-11-30", 5)).toBe(false);
    expect(monthlyDue("2026-09", "2026-11-30", 5)).toBe(true);
  });

  it("그 달 1일 · 발표일 전날까지는 한 달 더 늦어도 됨 (11-01 → 2026-09 면 false)", () => {
    expect(monthlyDue("2026-09", "2026-11-01", 5)).toBe(false);
    expect(monthlyDue("2026-08", "2026-11-01", 5)).toBe(true);
  });
});

describe("monthlyDue — 기대 달보다 뒤인 값", () => {
  it("기대 달보다 뒤(이번 달 · 미래 달)여도 false (다시 받지 않음)", () => {
    expect(monthlyDue("2026-11", "2026-11-05", 5)).toBe(false);
    expect(monthlyDue("2026-12", "2026-11-05", 5)).toBe(false);
  });
});

describe("monthlyDue — 연도 넘어감", () => {
  it("1월 발표일 전(2027-01-04): 기대 달 2026-11 → 2026-11 false · 2026-10 true", () => {
    expect(monthlyDue("2026-11", "2027-01-04", 5)).toBe(false);
    expect(monthlyDue("2026-10", "2027-01-04", 5)).toBe(true);
  });

  it("1월 발표일(2027-01-05): 기대 달 2026-12 → 2026-12 false · 2026-11 true", () => {
    expect(monthlyDue("2026-12", "2027-01-05", 5)).toBe(false);
    expect(monthlyDue("2026-11", "2027-01-05", 5)).toBe(true);
  });

  it("2월 발표일 전(2027-02-04): 기대 달 2026-12 → 2026-12 false · 2026-11 true", () => {
    expect(monthlyDue("2026-12", "2027-02-04", 5)).toBe(false);
    expect(monthlyDue("2026-11", "2027-02-04", 5)).toBe(true);
  });

  it("해 넘어가는 비교는 글자 순서가 아니라 달 순서 (2026-12 는 2027-01 보다 앞)", () => {
    expect(monthlyDue("2026-12", "2027-02-20", 5)).toBe(true); // 기대 2027-01
    expect(monthlyDue("2027-01", "2027-02-20", 5)).toBe(false);
  });
});

describe("monthlyDue — ECOS 발표일 17", () => {
  it("11-16: 기대 달 2026-09 · 11-17: 기대 달 2026-10", () => {
    expect(monthlyDue("2026-09", "2026-11-16", 17)).toBe(false);
    expect(monthlyDue("2026-08", "2026-11-16", 17)).toBe(true);
    expect(monthlyDue("2026-09", "2026-11-17", 17)).toBe(true);
    expect(monthlyDue("2026-10", "2026-11-17", 17)).toBe(false);
  });

  it("같은 날(11-10)에도 KOSIS(5)는 채울 때 · ECOS(17)는 아님 — 2026-09 까지 있을 때", () => {
    expect(monthlyDue("2026-09", "2026-11-10", KOSIS_PUBLISH_DAY)).toBe(true);
    expect(monthlyDue("2026-09", "2026-11-10", ECOS_PUBLISH_DAY)).toBe(false);
  });
});
