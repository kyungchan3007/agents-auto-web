// 홈 맨 위 "여행 타이밍" — 통계청 국제항공료 지수(kosis-cpi:air-fare)로 가장 싼 달 · 가장 비싼 달 (작업 0169)
// 달별 평균 = 최근 36개월 같은 달 평균 (@hav/shared/travel 의 monthlyAverages · /flights 와 같은 계산) · 값이 없으면 숫자 · 달을 지어내지 않음
import { type MonthPoint, monthlyAverages } from "@hav/shared/travel";

export type IndexPoint = MonthPoint;

export type TravelTiming =
  | { kind: "preparing" }
  | { kind: "ready"; months: { month: number; avg: number }[]; cheapest: number; priciest: number; years: number; complete: boolean };

/** 값이 있는 달이 2개 미만이면 선을 그릴 수 없어 preparing · 같은 값이면 싼 달은 앞선 달 · 비싼 달은 뒤선 달 (모두 같아도 겹치지 않음) */
export function travelTiming(points: IndexPoint[] | null | undefined): TravelTiming {
  const avg = monthlyAverages(points ?? []);
  const months = Object.entries(avg)
    .map(([m, v]) => ({ month: Number(m), avg: v.avg, n: v.n }))
    .sort((a, b) => a.month - b.month);
  if (months.length < 2) return { kind: "preparing" };
  let cheapest = months[0];
  let priciest = months[0];
  for (const m of months) {
    if (m.avg < cheapest.avg) cheapest = m;
    if (m.avg >= priciest.avg) priciest = m;
  }
  return {
    kind: "ready",
    months: months.map(({ month, avg: a }) => ({ month, avg: a })),
    cheapest: cheapest.month,
    priciest: priciest.month,
    years: Math.max(...months.map((m) => m.n)),
    complete: months.length === 12,
  };
}

/** 문구는 받은 값으로만 — 달이 모자라면 "1년 중" 대신 "받은 달 중" (없는 달을 비교한 척하지 않음) */
export function travelTimingCopy(t: TravelTiming): { title: string | null; message: string } {
  if (t.kind === "preparing") return { title: null, message: "국제항공료 지수를 아직 받지 못했습니다" };
  const span = t.complete ? "1년 중" : "받은 달 중";
  return {
    title: `${t.cheapest}월에 떠나세요`,
    message: `통계청 국제항공료 지수로 보면 ${t.cheapest}월이 ${span} 가장 낮고, ${t.priciest}월이 가장 높습니다.`,
  };
}
