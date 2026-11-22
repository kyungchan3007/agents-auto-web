// 항공권 출발일 달력 순수 계산 (작업 0234) — 화면 · API 가 같이 씀 · 규칙은 docs/domain/airfare-calendar.md
// 요일은 날짜 글자(YYYY-MM-DD)를 UTC 로 읽어 구함 — 시간대 영향 없음 (0=월 … 6=일)
import type { AirfareDay } from "../contracts/airfare";

export type Day = AirfareDay;
export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const weekdayIndex = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
const won = (n: number) => `${Math.round(n).toLocaleString("en-US")}원`;
const man = (v: number) => (v / 10000).toFixed(1);
const md = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
const dot = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}`;

export function weekdayLabel(iso: string): string {
  return WEEKDAYS[weekdayIndex(iso)];
}
export function formatDay(iso: string): string {
  return `${md(iso)}(${weekdayLabel(iso)})`;
}

/** 가장 싼 날 — 같은 값이면 먼저 오는 날 · 빈 배열이면 null */
export function cheapestDay(days: readonly Day[]): Day | null {
  let best: Day | null = null;
  for (const d of days) if (!best || d.price < best.price) best = d;
  return best;
}
export function priciestDay(days: readonly Day[]): Day | null {
  let worst: Day | null = null;
  for (const d of days) if (!worst || d.price > worst.price) worst = d;
  return worst;
}

/** 길이 7 · 출발일 요일별 평균 · 해당 요일 날이 없으면 null */
export function weekdayAverages(days: readonly Day[]): (number | null)[] {
  const sum = Array<number>(7).fill(0);
  const cnt = Array<number>(7).fill(0);
  for (const d of days) {
    const w = weekdayIndex(d.depart);
    sum[w] += d.price;
    cnt[w] += 1;
  }
  return sum.map((s, w) => (cnt[w] ? s / cnt[w] : null));
}

export function cheapestWeekday(days: readonly Day[]): { weekday: number; average: number; priciest: { weekday: number; average: number } } | null {
  const avg = weekdayAverages(days);
  let lo = -1;
  let hi = -1;
  avg.forEach((v, w) => {
    if (v === null) return;
    if (lo < 0 || v < (avg[lo] as number)) lo = w;
    if (hi < 0 || v > (avg[hi] as number)) hi = w;
  });
  if (lo < 0) return null;
  return { weekday: lo, average: avg[lo] as number, priciest: { weekday: hi, average: avg[hi] as number } };
}

export function priceSpread(days: readonly Day[]): { lo: number; hi: number; ratio: number } | null {
  const a = cheapestDay(days);
  const b = priciestDay(days);
  if (!a || !b) return null;
  return { lo: a.price, hi: b.price, ratio: b.price / a.price };
}

/** 아래 1/4 · 위 1/4 (시안: 정렬 뒤 q1 = s[floor(n·0.25)] · q3 = s[floor(n·0.75)] · 먼저 low 판정) */
export function priceTier(price: number, days: readonly Day[]): "low" | "mid" | "high" {
  const s = days.map((d) => d.price).sort((x, y) => x - y);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  if (price <= q1) return "low";
  if (price >= q3) return "high";
  return "mid";
}

const hasBatchim = (word: string) => {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};

export function headline(city: string, day: Day): string {
  return `${city}${hasBatchim(city) ? "은" : "는"} ${formatDay(day.depart)} 출발이 가장 저렴합니다`;
}
export function bestSubline(best: Day, worst: Day): string {
  return `${dot(best.depart)} → ${dot(best.return)} 왕복 · 가장 비싼 ${formatDay(worst.depart)} 출발(${won(worst.price)})보다 ${won(worst.price - best.price)} 저렴합니다`;
}
export function pickedSubline(picked: Day, best: Day): string {
  return `고른 날 ${formatDay(picked.depart)} 출발 ${won(picked.price)} · 가장 저렴한 날보다 ${won(picked.price - best.price)} 비쌉니다`;
}

export type SummaryFact = { label: string; big: string; say: string };
/** 요약 두 항목 (이름표 → 큰 값 → 풀이 한 줄) · 날이 없으면 null */
export function summaryFacts(days: readonly Day[]): { weekday: SummaryFact; spread: SummaryFact } | null {
  const w = cheapestWeekday(days);
  const s = priceSpread(days);
  if (!w || !s) return null;
  return {
    weekday: {
      label: "가장 저렴한 요일",
      big: `${WEEKDAYS[w.weekday]}요일`,
      say: `출발 평균 ${man(w.average)}만 원으로, 가장 비싼 ${WEEKDAYS[w.priciest.weekday]}요일보다 ${man(w.priciest.average - w.average)}만 원 저렴합니다.`,
    },
    spread: {
      label: "출발일에 따른 차이",
      big: `최대 ${s.ratio.toFixed(1)}배`,
      say: `가장 저렴한 날 ${man(s.lo)}만 원부터 가장 비싼 날 ${man(s.hi)}만 원까지 벌어집니다.`,
    },
  };
}

export function receivedNote(fetchedOn: string): string {
  return `${md(fetchedOn)}에 받은 가격이며, 실제 결제 가격과 다를 수 있습니다.`;
}
