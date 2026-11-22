// 작업 0229 — 여행 타이밍 '창밖으로 보는 12달' 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   기준: .tmp/lead-motion-1119/02-flights-1.png · 참고 구현 .tmp/motion-pages/m-flights.js (달 표 M · 지수 · 비교 글 · 꼬리표 · 재생 순서 SEQ)
//
// builder 가 만들 것 — apps/web/src/features/flights/window/window-months-view.ts
//   export const SEASONS: { season: "겨울" | "봄" | "여름" | "가을"; desc: string }[]   // 1~12월 순서 12개
//   export function seasonOf(month: number): { season: string; desc: string }            // 1~12
//   export type WindowMonth = { month: number; avg: number; text: string; season: string; desc: string; tone: "high" | "low" | null; tag: string | null; cmp: string }
//   export type WindowMonths = { months: WindowMonth[]; lowest: number; highest: number; complete: boolean }
//   export function windowMonths(points: { period: string; value: number }[] | null | undefined): WindowMonths | null
//     // 홈 12달 막대와 같은 계산(monthlyAverages · 최근 36개월 같은 달 평균 · travelTiming 의 싼 달 · 비싼 달 규칙: 같은 값이면 싼 달은 앞선 달 · 비싼 달은 뒤선 달)
//     // 값이 있는 달이 2개 미만이면 null · months 는 값이 있는 달만 1월부터 순서대로 · text = avg.toFixed(1) (소수 한 자리)
//     // tone/tag: 가장 싼 달 "low" · "가장 저렴한 달" · 가장 비싼 달 "high" · "가장 비싼 달" · 나머지 null
//     // cmp: 차이는 화면에 보이는 한 자리 값끼리(text) 뺀 값 .toFixed(1)
//          가장 싼 달 = complete ? "1년 중 가장 낮은 달" : "받은 달 중 가장 낮은 달"
//          가장 비싼 달 = `${complete ? "1년" : "받은 달"} 중 가장 높은 달 · ${싼 달}월보다 ${차이} 높음`
//          나머지 = `${싼 달}월보다 ${차이} 높음`
//   export function flapChars(month: number): [string, string, string]   // 한 자리 달은 ["", "1", "월"] · 두 자리는 ["1", "1", "월"]
//   export function playSequence(months: number[], lowest: number): number[]  // 달을 작은 순서로 · 끝에 가장 싼 달에서 멈춤: [1..12, 11] · 가장 싼 달이 마지막이면 그대로 [1..12]
import { describe, expect, it } from "vitest";
import { SEASONS, flapChars, playSequence, seasonOf, windowMonths } from "./window-months-view";

// 달마다 평균이 정확히 TARGET 이 되는 기록 — 2024-12 ~ 2026-10 (홈과 같은 23개월 · 12월은 2개 · 11월은 1개) · 두 값이면 ±2 로 나눠 평균을 맞춤
const TARGET = [127.34, 122.26, 121.94, 129.31, 138.7, 136.5, 136.7, 136.2, 133.8, 134.2, 119.8, 122.4];
function fixture(targets: (number | null)[] = TARGET) {
  const pts: { period: string; value: number }[] = [];
  const add = (y: number, m: number, v: number) => pts.push({ period: `${y}-${String(m).padStart(2, "0")}`, value: v });
  targets.forEach((t, i) => {
    const m = i + 1;
    if (t === null) return;
    const twice = m <= 10 || m === 12; // 2025 · 2026 (12월은 2024-12 · 2025-12) · 11월은 2025-11 한 번
    if (!twice) return add(2025, m, t);
    if (m === 12) { add(2024, 12, t - 2); add(2025, 12, t + 2); } else { add(2025, m, t - 2); add(2026, m, t + 2); }
  });
  return pts;
}

describe("SEASONS · seasonOf — 달마다 계절 · 한마디 (시안 M)", () => {
  it("12개 · 순서", () => {
    expect(SEASONS).toHaveLength(12);
    expect(SEASONS.map((s) => s.season)).toEqual(["겨울", "겨울", "봄", "봄", "봄", "여름", "여름", "여름", "가을", "가을", "가을", "겨울"]);
    expect(SEASONS.map((s) => s.desc)).toEqual(["깊은 눈", "녹는 눈", "새싹", "벚꽃", "신록 · 꽃밭", "물 댄 논", "장마 비", "한여름 뭉게구름", "익는 들", "단풍", "늦가을 · 건초", "첫눈 · 불 켜진 집"]);
  });
  it("seasonOf(달)", () => {
    expect(seasonOf(11)).toEqual({ season: "가을", desc: "늦가을 · 건초" });
    expect(seasonOf(1)).toEqual({ season: "겨울", desc: "깊은 눈" });
    expect(seasonOf(12).season).toBe("겨울");
  });
});

describe("windowMonths — 같은 달 평균(홈 12달 막대와 같은 계산)", () => {
  const w = windowMonths(fixture())!;
  it("12개 달 · 평균 · 소수 한 자리 글", () => {
    expect(w.months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(w.complete).toBe(true);
    for (const [i, m] of w.months.entries()) expect(m.avg, `${m.month}월 평균`).toBeCloseTo(TARGET[i], 6);
    expect(w.months.map((m) => m.text)).toEqual(["127.3", "122.3", "121.9", "129.3", "138.7", "136.5", "136.7", "136.2", "133.8", "134.2", "119.8", "122.4"]);
  });
  it("가장 싼 달 11월 · 가장 비싼 달 5월 · 꼬리표 · tone", () => {
    expect(w.lowest).toBe(11);
    expect(w.highest).toBe(5);
    expect(w.months.find((m) => m.month === 11)).toMatchObject({ tone: "low", tag: "가장 저렴한 달" });
    expect(w.months.find((m) => m.month === 5)).toMatchObject({ tone: "high", tag: "가장 비싼 달" });
    expect(w.months.filter((m) => m.tone === null).map((m) => m.tag)).toEqual(new Array(10).fill(null));
  });
  it("달마다 계절 · 한마디가 붙음", () => {
    expect(w.months.find((m) => m.month === 11)).toMatchObject({ season: "가을", desc: "늦가을 · 건초" });
    expect(w.months.find((m) => m.month === 4)).toMatchObject({ season: "봄", desc: "벚꽃" });
  });
  it("비교 글 — 보이는 한 자리 값끼리 뺀 차이", () => {
    const cmp = (m: number) => w.months.find((x) => x.month === m)!.cmp;
    expect(cmp(11)).toBe("1년 중 가장 낮은 달");
    expect(cmp(5)).toBe("1년 중 가장 높은 달 · 11월보다 18.9 높음"); // 138.7 − 119.8
    expect(cmp(1)).toBe("11월보다 7.5 높음"); // 127.3 − 119.8
    expect(cmp(2)).toBe("11월보다 2.5 높음"); // 122.3 − 119.8
    expect(cmp(12)).toBe("11월보다 2.6 높음"); // 122.4 − 119.8
  });
  it("홈 12달 막대(travelTiming)와 같은 싼 달 · 비싼 달 — 같은 기록이면 같은 달", async () => {
    // 홈 계산(features/home/timing/travel-timing.ts)과 같은 규칙인지를 값으로 확인: 가장 싼 달 11 · 가장 비싼 달 5
    expect([w.lowest, w.highest]).toEqual([11, 5]);
  });
});

describe("windowMonths — 달이 모자랄 때 · 같은 값 · 없음", () => {
  it("값이 있는 달이 2개 미만이면 null (그리지 않음 · 지어내지 않음)", () => {
    expect(windowMonths(null)).toBeNull();
    expect(windowMonths(undefined)).toBeNull();
    expect(windowMonths([])).toBeNull();
    expect(windowMonths([{ period: "2026-10", value: 120 }])).toBeNull();
  });
  it("받은 달만 · complete false · 문구는 '받은 달 중'", () => {
    const t = [100, 110, 105, null, null, null, null, null, null, null, null, null];
    const w = windowMonths(fixture(t))!;
    expect(w.months.map((m) => m.month)).toEqual([1, 2, 3]);
    expect(w.complete).toBe(false);
    expect([w.lowest, w.highest]).toEqual([1, 2]);
    expect(w.months[0].cmp).toBe("받은 달 중 가장 낮은 달");
    expect(w.months[1].cmp).toBe("받은 달 중 가장 높은 달 · 1월보다 10.0 높음");
    expect(w.months[2].cmp).toBe("1월보다 5.0 높음");
  });
  it("모두 같은 값이면 싼 달은 앞선 달 · 비싼 달은 뒤선 달 (겹치지 않음)", () => {
    const w = windowMonths(fixture(new Array(12).fill(130)))!;
    expect([w.lowest, w.highest]).toEqual([1, 12]);
    expect(w.months[0].tone).toBe("low");
    expect(w.months[11].tone).toBe("high");
  });
});

describe("flapChars — 글자판 '1월' · '11월'", () => {
  it("한 자리 달은 앞 칸이 빔", () => {
    expect(flapChars(1)).toEqual(["", "1", "월"]);
    expect(flapChars(9)).toEqual(["", "9", "월"]);
  });
  it("두 자리 달", () => {
    expect(flapChars(10)).toEqual(["1", "0", "월"]);
    expect(flapChars(11)).toEqual(["1", "1", "월"]);
    expect(flapChars(12)).toEqual(["1", "2", "월"]);
  });
});

describe("playSequence — 다시 보기 재생 순서 (1월부터 12월까지 지나 가장 싼 달에서 멈춤)", () => {
  it("[1..12, 11]", () => {
    expect(playSequence([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 11)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11]);
  });
  it("가장 싼 달이 마지막이면 그대로 · 순서가 뒤섞여 들어와도 작은 달부터", () => {
    expect(playSequence([1, 2, 3], 3)).toEqual([1, 2, 3]);
    expect(playSequence([3, 1, 2], 2)).toEqual([1, 2, 3, 2]);
  });
  it("받은 달만", () => {
    expect(playSequence([2, 5, 9], 5)).toEqual([2, 5, 9, 5]);
  });
});
