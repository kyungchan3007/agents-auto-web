// 통화 1년 흐름 그래프의 눈금 계산 — 순수 함수 (작업 0219 · 시안 F)
//   세로: 보기 좋은 간격(1 · 2 · 5 × 10ⁿ)의 값 눈금 · 가로: 달 첫날(기간이 길 때) 또는 고르게 나눈 날(짧을 때)
import { numberText } from "@hav/shared/format";

const DAY = 86_400_000;
/** 날짜(YYYY-MM-DD) → 하루 단위 숫자 (그래프 가로 값) */
export const dayNumber = (date: string): number => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY);
const dateOf = (n: number): string => new Date(n * DAY).toISOString().slice(0, 10);

/** 보기 좋은 눈금 간격 — 구간을 약 count 칸으로 나누는 1 · 2 · 5 × 10ⁿ */
export function niceStep(range: number, count = 4): number {
  if (!(range > 0)) return 1;
  const raw = range / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

export type ValueAxis = { min: number; max: number; ticks: { v: number; t: string }[] };

/** 세로 눈금 — 바닥은 최저 아래 첫 눈금 · 위는 최고보다 6% 위 · 눈금은 그 사이의 간격 배수 (최저 · 최고 점이 눈금선 바로 위에 걸리지 않게 여유) */
export function valueAxis(min: number, max: number): ValueAxis {
  const range = max - min || Math.abs(max) * 0.02 || 1;
  const step = niceStep(range);
  const lo = Math.floor((min - step * 0.05) / step) * step;
  const hi = max + range * 0.06;
  const digits = step < 1 ? (step < 0.1 ? 3 : 2) : 0;
  const ticks: { v: number; t: string }[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push({ v: Number(v.toFixed(6)), t: numberText(v, { minimumFractionDigits: digits, maximumFractionDigits: digits }) });
  return { min: lo, max: hi, ticks };
}

export type DateTick = { x: number; label: string; short: string };

/** 가로 눈금 — 기간이 100일을 넘으면 달 첫날("2026-04" · 한 번에 5개 이하가 되는 1 · 2 · 3 · 6달 간격) · 짧으면 고르게 4개("04-18") */
export function dateTicks(firstDate: string, lastDate: string): DateTick[] {
  const a = dayNumber(firstDate);
  const b = dayNumber(lastDate);
  if (b - a > 100) {
    const starts: string[] = [];
    const [fy, fm] = firstDate.split("-").map(Number);
    for (let y = fy, m = fm; `${y}-${String(m).padStart(2, "0")}-01` <= lastDate; m++) {
      if (m > 12) {
        y++;
        m = 1;
      }
      const d = `${y}-${String(m).padStart(2, "0")}-01`;
      if (d >= firstDate && d <= lastDate) starts.push(d);
    }
    const step = [1, 2, 3, 6, 12].find((k) => Math.ceil(starts.length / k) <= 5) ?? 12;
    return starts.filter((_, i) => i % step === 0).map((d) => ({ x: dayNumber(d), label: d.slice(0, 7), short: `${d.slice(2, 4)}.${d.slice(5, 7)}` }));
  }
  return [0, 1, 2, 3].map((i) => {
    const x = Math.round(a + ((b - a) * i) / 3);
    const d = dateOf(x);
    return { x, label: d.slice(5), short: d.slice(5) };
  });
}
