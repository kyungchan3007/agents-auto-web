// 작업 0169 — 홈 맨 위 "여행 타이밍" 계산 · 문구 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 통계청 국제항공료 지수(kosis-cpi:air-fare) 월별 값 → 달별 평균 → 가장 싼 달 · 가장 비싼 달 (최근 3년 같은 달 평균 · 0164 travel-index 의 monthlyAverages 와 같은 계산)
//
// builder 가 만들 것 — apps/web/src/features/home/timing/travel-timing.ts
//   (달별 평균 계산은 packages/shared/src/domain 으로 옮겨 홈 · /flights 가 함께 씀 — 기능 폴더끼리 직접 가져오지 않는 규칙 · 이 테스트는 travelTiming 의 결과만 봄)
//   export type IndexPoint = { period: string /* YYYY-MM */; value: number }
//   export type TravelTiming =
//     | { kind: "preparing" }
//     | { kind: "ready"; months: { month: number /* 1~12 */; avg: number }[] /* 값이 있는 달만 · 1월부터 오름차순 */; cheapest: number; priciest: number; years: number; complete: boolean }
//   export function travelTiming(points: IndexPoint[] | null | undefined): TravelTiming
//     - 가장 최근 달부터 36개월(최근 달 포함)만 보고 달(1~12)마다 평균 · 값이 있는 달이 2개 미만이면 { kind: "preparing" } (선을 그릴 수 없음 · 없는 숫자를 지어내지 않음)
//     - cheapest = 평균이 가장 낮은 달 · 같으면 앞선 달 / priciest = 평균이 가장 높은 달 · 같으면 뒤선 달 (모두 같아도 두 달이 겹치지 않게)
//     - years = 평균에 쓴 같은 달 값의 최대 개수 (1~3) · complete = 1~12월 모두 값이 있음
//   export function travelTimingCopy(t: TravelTiming): { title: string | null; message: string }
//     - preparing: title null · message "국제항공료 지수를 아직 받지 못했습니다"
//     - ready: title `${cheapest}월에 떠나세요.` (작업 0380: 끝에 마침표)
//       message complete: `항공료가 1년 중 가장 낮은 달입니다.` (작업 0380: 가장 높은 달 문장을 뺌 · 출처는 꼬리표 HERO_GUIDE.tag 로 따로)
//       message complete 가 아니면 "1년 중" 대신 "받은 달 중" (없는 달을 비교한 척하지 않음)
//   heroParts(t): ready 면 { month: "N월", rest: "에 떠나세요." } (작업 0380)
import { describe, expect, it } from "vitest";
import { type IndexPoint, travelTiming, travelTimingCopy } from "./travel-timing";

/** from ~ to (YYYY-MM · 양끝 포함) 달마다 f(월, 연) 값 */
function series(from: string, to: string, f: (month: number, year: number) => number): IndexPoint[] {
  const out: IndexPoint[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push({ period: `${y}-${String(m).padStart(2, "0")}`, value: f(m, y) });
    if (++m > 12) (m = 1), y++;
  }
  return out;
}
// 4월이 가장 싸고 8월이 가장 비싼 3년치 (2023-11 ~ 2026-10 = 36개월 · 달마다 3개)
const SHAPE = (m: number) => (m === 4 ? 90 : m === 8 ? 140 : 100 + m);
const THREE_YEARS = series("2023-11", "2026-10", SHAPE);

describe("travelTiming — 자료가 없으면 준비 중 (숫자 · 달을 지어내지 않음)", () => {
  it("null · undefined · 빈 배열 → preparing", () => {
    for (const p of [null, undefined, []]) expect(travelTiming(p), String(p)).toEqual({ kind: "preparing" });
  });

  it("값이 한 달뿐이면 선을 그릴 수 없어 preparing", () => {
    expect(travelTiming([{ period: "2026-10", value: 120 }])).toEqual({ kind: "preparing" });
    expect(travelTiming([{ period: "2025-10", value: 120 }, { period: "2026-10", value: 125 }])).toEqual({ kind: "preparing" }); // 같은 달 두 해 = 여전히 한 달
  });
});

describe("travelTiming — 3년치", () => {
  it("12달 모두 · 4월이 가장 싸고 8월이 가장 비쌈 · years 3 · complete", () => {
    const t = travelTiming(THREE_YEARS);
    expect(t.kind).toBe("ready");
    if (t.kind !== "ready") return;
    expect(t.months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(t.months.find((m) => m.month === 4)?.avg).toBe(90);
    expect(t.cheapest).toBe(4);
    expect(t.priciest).toBe(8);
    expect(t.years).toBe(3);
    expect(t.complete).toBe(true);
  });

  it("들어온 순서가 섞여도 같은 결과", () => {
    expect(travelTiming([...THREE_YEARS].reverse())).toEqual(travelTiming(THREE_YEARS));
  });

  it("최근 36개월보다 오래된 값은 평균에 넣지 않음 (2020-04 값 1 이 있어도 4월 평균 90)", () => {
    const t = travelTiming([{ period: "2020-04", value: 1 }, ...THREE_YEARS]);
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.months.find((m) => m.month === 4)?.avg).toBe(90);
  });

  it("한 해만 싼 달에 속지 않고 평균으로 — 4월은 2024 에만 아주 싸고 평균은 7월이 가장 낮음", () => {
    const t = travelTiming(series("2023-11", "2026-10", (m, y) => (m === 7 ? 95 : m === 4 ? (y === 2024 ? 60 : 130) : 100 + m)));
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.cheapest).toBe(7);
  });
});

describe("travelTiming — 자료가 모자란 경우", () => {
  it("2년치(달마다 2개) → years 2", () => {
    const t = travelTiming(series("2024-11", "2026-10", SHAPE));
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.years).toBe(2);
    expect(t.complete).toBe(true);
  });

  it("1년치(달마다 1개) → years 1 · 싼 달 · 비싼 달은 그대로 고름", () => {
    const t = travelTiming(series("2025-11", "2026-10", SHAPE));
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.years).toBe(1);
    expect([t.cheapest, t.priciest]).toEqual([4, 8]);
  });

  it("일부 달만 있으면(6개월) 있는 달만 months 에 · complete false · 있는 달 중에서 고름", () => {
    const t = travelTiming(series("2026-05", "2026-10", SHAPE)); // 5~10월 (8월 비쌈 · 5~10월 중 가장 싼 달은 5월)
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.months.map((m) => m.month)).toEqual([5, 6, 7, 8, 9, 10]);
    expect(t.complete).toBe(false);
    expect(t.cheapest).toBe(5);
    expect(t.priciest).toBe(8);
  });

  it("값이 모두 같아도 싼 달(가장 앞)과 비싼 달(가장 뒤)이 겹치지 않음", () => {
    const t = travelTiming(series("2023-11", "2026-10", () => 100));
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(t.cheapest).toBe(1);
    expect(t.priciest).toBe(12);
  });
});

describe("travelTimingCopy — 문구는 받은 값으로만", () => {
  it("preparing → 제목 없음 · '국제항공료 지수를 아직 받지 못했습니다'", () => {
    expect(travelTimingCopy({ kind: "preparing" })).toEqual({ title: null, message: "국제항공료 지수를 아직 받지 못했습니다" });
  });

  it("3년치 → 'N월에 떠나세요.' + 한 줄 (작업 0380 · 가장 높은 달 · 통계청 문장은 뺌)", () => {
    expect(travelTimingCopy(travelTiming(THREE_YEARS))).toEqual({
      title: "4월에 떠나세요.",
      message: "항공료가 1년 중 가장 낮은 달입니다.",
    });
  });

  it("뺀 문구가 없음 — 가장 높은 달 · 통계청 지수 문장 · 같은 달 평균 설명 (작업 0185 · 0380)", () => {
    for (const pts of [THREE_YEARS, series("2024-11", "2026-10", SHAPE), series("2026-05", "2026-10", SHAPE)]) {
      const m = travelTimingCopy(travelTiming(pts)).message;
      expect(m).not.toMatch(/가장 높/);
      expect(m).not.toContain("통계청");
      expect(m).not.toMatch(/같은 달 평균/);
      expect(m).not.toMatch(/비교했습니다/);
      expect(m).not.toMatch(/최근 \d+년/);
    }
    expect(travelTimingCopy(travelTiming(series("2024-11", "2026-10", SHAPE))).message).toBe("항공료가 1년 중 가장 낮은 달입니다.");
  });

  it("일부 달만 → '1년 중' 대신 '받은 달 중'", () => {
    const c = travelTimingCopy(travelTiming(series("2026-05", "2026-10", SHAPE)));
    expect(c.title).toBe("5월에 떠나세요.");
    expect(c.message).toBe("항공료가 받은 달 중 가장 낮은 달입니다.");
    expect(c.message).not.toContain("1년 중");
  });

  it("지수가 없으면 지금처럼 '아직 받지 못했습니다' (달을 지어내지 않음 · 작업 0380 요구 3)", () => {
    const c = travelTimingCopy(travelTiming(null));
    expect(c.title).toBeNull();
    expect(c.message).toBe("국제항공료 지수를 아직 받지 못했습니다");
    expect(c.message).not.toMatch(/\d+월/);
  });
});
