// 항공권 출발일 달력 화면용 계산 (작업 0234) — 도시 한 곳의 날짜 칸 · 요일 막대 · 문장 (순수 함수)
//   값은 모두 @hav/shared/airfare-domain 의 계산 · 여기서는 화면 모양으로만 바꿈 · 받지 못한 값은 만들지 않음
import type { AirfareCity } from "@hav/shared/airfare";
import { type Day, WEEKDAYS, bestSubline, cheapestDay, formatDay, headline, pickedSubline, priceTier, priciestDay, summaryFacts, weekdayAverages, weekdayLabel } from "@hav/shared/airfare-domain";

/** 도착 공항 → 국기 나라 코드 (ISO 3166) */
export const AIRPORT_FLAG: Record<string, string> = { NRT: "JP", KIX: "JP", BKK: "TH", CDG: "FR", DAD: "VN", SIN: "SG", JFK: "US", LHR: "GB" };

export const manWon = (price: number) => (price / 10000).toFixed(1);
export const won = (price: number) => `${Math.round(price).toLocaleString("ko-KR")}원`;
/** "12.29(화)" — 탑승권 출발 · 돌아옴 */
export const dotDay = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}(${weekdayLabel(iso)})`;

export type DayCell = { day: Day; index: number; weekday: string; dateNumber: number; tier: "low" | "mid" | "high"; best: boolean; sat: boolean; sun: boolean; label: string };

export type CityView = {
  cells: DayCell[];
  bestIndex: number;
  best: Day;
  worst: Day;
  weekBars: { label: string; average: number | null; percent: number; min: boolean }[];
  facts: NonNullable<ReturnType<typeof summaryFacts>>;
  head: string;
};

/** 날이 하나도 없으면 null (그 도시는 화면에서 뺌) */
export function cityView(city: AirfareCity): CityView | null {
  const best = cheapestDay(city.days);
  const worst = priciestDay(city.days);
  const facts = summaryFacts(city.days);
  if (!best || !worst || !facts) return null;
  const cells = city.days.map((day, index): DayCell => {
    const w = new Date(`${day.depart}T00:00:00Z`).getUTCDay(); // 0=일
    return {
      day,
      index,
      weekday: index === 0 ? "오늘" : weekdayLabel(day.depart),
      dateNumber: Number(day.depart.slice(8, 10)),
      tier: priceTier(day.price, city.days),
      best: day === best,
      sat: w === 6,
      sun: w === 0,
      label: `${formatDay(day.depart)} 출발 ${won(day.price)}${day === best ? " · 가장 저렴한 날" : ""}`,
    };
  });
  const avg = weekdayAverages(city.days);
  const present = avg.filter((v): v is number => v !== null);
  const lo = Math.min(...present);
  const hi = Math.max(...present);
  const weekBars = avg.map((v, i) => ({
    label: WEEKDAYS[i],
    average: v,
    percent: v === null ? 0 : hi === lo ? 60 : (100 * v) / hi, // 막대 길이 = 그 요일 평균 ÷ 가장 비싼 요일 평균 (작업 0290 · 값이 없으면 0 · 하나뿐이거나 모두 같으면 60 은 그대로)
    min: v !== null && v === lo,
  }));
  return { cells, bestIndex: cells.findIndex((c) => c.best), best, worst, weekBars, facts, head: headline(city.city, best) };
}

/** 탑승권 아래 풀이 한 줄 — 가장 싼 날이면 가장 비싼 날과 비교 · 고른 날이면 가장 싼 날과 비교 */
export function subline(view: CityView, selIndex: number): string {
  const picked = view.cells[selIndex]?.day ?? view.best;
  return picked === view.best ? bestSubline(view.best, view.worst) : pickedSubline(picked, view.best);
}

/** 날짜 띠 위 범위 글 "11월 20일 ~ 12월 3일 출발" */
export function rangeText(a: string, b: string): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
  return `${md(a)} ~ ${md(b)} 출발`;
}
