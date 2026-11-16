// 여행 품목(국제항공료 · 해외단체여행비) 소비자물가지수 계산 — 순수 함수 (작업 0164)
//   지수는 통계청 KOSIS (2020=100) · 월 단위 · 값이 없으면 지어내지 않고 null · "준비 중"
export type IndexPoint = { period: string; value: number };

const byPeriod = (a: IndexPoint, b: IndexPoint) => a.period.localeCompare(b.period);

/** 같은 달의 1년 전 대비 % — 이번 달이나 작년 값이 없거나 작년 값이 0 이하면 null */
export function yoyChange(points: IndexPoint[], period: string): number | null {
  const now = points.find((p) => p.period === period);
  const prev = points.find((p) => p.period === `${Number(period.slice(0, 4)) - 1}${period.slice(4)}`);
  if (!now || !prev || prev.value <= 0) return null;
  return (now.value / prev.value - 1) * 100;
}

/** 달(1~12)마다 최근 36개월 평균 — 홈과 같은 계산이라 @hav/shared/travel 한 곳에 두고 다시 내보냄 (작업 0169) */
import { monthlyAverages } from "@hav/shared/travel";

export { monthlyAverages };

/** 홈 맨 위(features/home/lib/travel-timing.ts travelTiming)와 같은 규칙 — 값이 있는 달이 2개 이상이면 그 달들 중 평균이 가장 낮은 달 · 같으면 앞선 달 · 달이 모자랄 때만 null ("준비 중") (작업 0181: 24개월 자료로도 12달이 다 채워지면 말함) */
export function cheapMonth(points: IndexPoint[]): number | null {
  const avg = monthlyAverages(points);
  const months = Object.keys(avg).map(Number).sort((a, b) => a - b);
  if (months.length < 2) return null;
  let best = months[0];
  for (const m of months) if (avg[m].avg < avg[best].avg) best = m;
  return best;
}

/** 싼 달 평균에 쓴 해 수 — 같은 달 값이 가장 많은 달의 개수 (홈 문구 "최근 N년 같은 달 평균"의 N 과 같음) · 값이 없으면 0 */
export function averageYears(points: IndexPoint[]): number {
  return Math.max(0, ...Object.values(monthlyAverages(points)).map((a) => a.n));
}

/** 환율 일별 → 달별 평균 — 0165 직구 화면과 같은 계산이라 @hav/shared/currency 한 곳에 두고 다시 내보냄 */
export { fxMonthlyAverage } from "@hav/shared/currency";

export type TravelView = { kind: "preparing" } | { kind: "ready"; trend: IndexPoint[]; latest: IndexPoint; yoy: number | null; cheapMonth: number | null };

export function travelView(points: IndexPoint[] | null | undefined): TravelView {
  if (!points || points.length === 0) return { kind: "preparing" };
  const trend = [...points].sort(byPeriod);
  const latest = trend[trend.length - 1];
  return { kind: "ready", trend, latest, yoy: yoyChange(trend, latest.period), cheapMonth: cheapMonth(trend) };
}
