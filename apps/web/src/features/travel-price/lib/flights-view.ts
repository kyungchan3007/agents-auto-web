// 새 /flights 의 머리 글자판 · 탑승권 숫자 · 한 줄 띠 계산 — 순수 함수 (작업 0218 · 테스트 flights-view.test.ts)
// 값은 받은 자료 그대로 — 없는 항목은 줄 · 문장에서 빼고 숫자를 지어내지 않음
import type { IndexPoint } from "./travel-index";

const byPeriod = (a: IndexPoint, b: IndexPoint) => a.period.localeCompare(b.period);
const idx = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

/** 가장 최근 달의 지수 · 달 · 작년 같은 달 대비 % — 작년 값이 없거나 0 이하면 yoy null · 자료가 없으면 null */
export function latestNumbers(points: IndexPoint[] | null | undefined): { period: string; month: number; value: number; yoy: number | null } | null {
  if (!points || points.length === 0) return null;
  const latest = [...points].sort(byPeriod).at(-1) as IndexPoint;
  const prev = points.find((p) => p.period === `${Number(latest.period.slice(0, 4)) - 1}${latest.period.slice(4)}`);
  return { period: latest.period, month: Number(latest.period.slice(5, 7)), value: latest.value, yoy: prev && prev.value > 0 ? (latest.value / prev.value - 1) * 100 : null };
}

/** 글자판 한 줄 — 이름은 왼쪽(흰 글자) · 값은 오른쪽(노랑) · 사이는 빈 칸 · 길이는 정확히 cols · 이름이 길면 이름만 줄임 */
export function flapLine(name: string, value: string, cols: number): { text: string; whiteUntil: number } {
  const v = Array.from(value);
  const room = Math.max(0, cols - v.length - 1); // 이름과 값 사이 최소 한 칸
  let n = Array.from(name);
  if (n.length > room) n = room <= 1 ? n.slice(0, room) : [...n.slice(0, room - 1), "…"];
  const gap = Math.max(0, cols - n.length - v.length);
  return { text: n.join("") + " ".repeat(gap) + v.join(""), whiteUntil: n.length };
}

const MIN_COLS = 12;

/** 머리 글자판 — "가장 싼 달" / "국제항공료" / "단체여행비" 줄(있는 것만) · 줄이 없으면 null */
export function flightsBoard(a: { airCheap: number | null; tourCheap: number | null; air: IndexPoint[] | null; tour: IndexPoint[] | null }): { rows: { text: string; whiteUntil: number }[]; cols: number; label: string } | null {
  const months = [...new Set([a.airCheap, a.tourCheap].filter((m): m is number => m !== null))].map((m) => `${m}월`).join(" · ");
  const air = latestNumbers(a.air);
  const tour = latestNumbers(a.tour);
  const items: { name: string; value: string }[] = [];
  if (months) items.push({ name: "가장 싼 달", value: months });
  if (air) items.push({ name: "국제항공료", value: air.value.toFixed(1) });
  if (tour) items.push({ name: "단체여행비", value: tour.value.toFixed(1) });
  if (items.length === 0) return null;
  const cols = Math.max(MIN_COLS, ...items.map((i) => Array.from(i.name).length + 1 + Array.from(i.value).length));
  const parts = [months ? `가장 싼 달은 ${months}입니다.` : "", [air ? `국제항공료 지수 ${air.value.toFixed(1)}` : "", tour ? `해외단체여행비 지수 ${tour.value.toFixed(1)}` : ""].filter(Boolean).join(" · ")].filter(Boolean);
  return { rows: items.map((i) => flapLine(i.name, i.value, cols)), cols, label: parts.join(" ") };
}

/** 한 줄 띠 — 최근 36개월(마지막 달에서 35달 전부터) 안 항공료 최고 · 최저 · 가장 최근 달 원/달러 월평균 */
export function stripStats(air: IndexPoint[] | null | undefined, fx: IndexPoint[]): { max: IndexPoint; min: IndexPoint; fx: IndexPoint | null } | null {
  if (!air || air.length === 0) return null;
  const sorted = [...air].sort(byPeriod);
  const from = idx(sorted[sorted.length - 1].period) - 35;
  const inRange = sorted.filter((p) => idx(p.period) >= from);
  let max = inRange[0];
  let min = inRange[0];
  for (const p of inRange) {
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }
  return { max, min, fx: fx.length > 0 ? ([...fx].sort(byPeriod).at(-1) as IndexPoint) : null };
}
