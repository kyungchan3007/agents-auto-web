// 여행 품목(국제항공료 · 해외단체여행비) 소비자물가지수 계산 — 순수 함수 (작업 0164)
//   지수는 통계청 KOSIS (2020=100) · 월 단위 · 값이 없으면 지어내지 않고 null · "준비 중"
export type IndexPoint = { period: string; value: number };

const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;
const byPeriod = (a: IndexPoint, b: IndexPoint) => a.period.localeCompare(b.period);

/** 같은 달의 1년 전 대비 % — 이번 달이나 작년 값이 없거나 작년 값이 0 이하면 null */
export function yoyChange(points: IndexPoint[], period: string): number | null {
  const now = points.find((p) => p.period === period);
  const prev = points.find((p) => p.period === `${Number(period.slice(0, 4)) - 1}${period.slice(4)}`);
  if (!now || !prev || prev.value <= 0) return null;
  return (now.value / prev.value - 1) * 100;
}

/** 가장 최근 달부터 36개월만 보고 달(1~12)마다 평균 · 값이 없는 달은 키가 없음 */
export function monthlyAverages(points: IndexPoint[]): Record<number, { avg: number; n: number }> {
  if (points.length === 0) return {};
  const last = Math.max(...points.map((p) => monthIndex(p.period)));
  const sums: Record<number, { sum: number; n: number }> = {};
  for (const p of points) {
    if (monthIndex(p.period) <= last - 36) continue;
    const m = Number(p.period.slice(5, 7));
    const s = (sums[m] ??= { sum: 0, n: 0 });
    s.sum += p.value;
    s.n += 1;
  }
  return Object.fromEntries(Object.entries(sums).map(([m, s]) => [Number(m), { avg: s.sum / s.n, n: s.n }]));
}

/** 1~12월 모두 값이 2개 이상일 때만 평균이 가장 낮은 달 · 같으면 앞선 달 · 모자라면 null (고르지 않음) */
export function cheapMonth(points: IndexPoint[]): number | null {
  const avg = monthlyAverages(points);
  let best: number | null = null;
  for (let m = 1; m <= 12; m++) {
    const a = avg[m];
    if (!a || a.n < 2) return null;
    if (best === null || a.avg < avg[best].avg) best = m;
  }
  return best;
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
