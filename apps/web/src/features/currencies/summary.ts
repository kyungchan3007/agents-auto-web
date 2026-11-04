// 통화 상세 요약 문장 · 기간별 표 — 차트를 못 읽어도 같은 숫자를 글자로 (작업 0115 · 이슈 #117)
//   받은 값만 · 지난 값 비교일 뿐 앞으로를 말하지 않음 (FX-02 · SIG-01)
import { percentileText, rateText } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import type { Signal } from "@hav/shared/signal";
import { PERIODS, changeOf, sliceDays } from "./periods";

/**
 * 먼저 적용해 나머지와 비교하는 통화 — 2026-11-05 통화 21개를 코드순으로 번갈아 고름 (docs/geo-measurement.md)
 * 재측정이 끝나면 지우고 모든 통화에 적용하거나 뺌
 */
const FIRST_GROUP = new Set(["AED", "BND", "CHF", "DKK", "GBP", "IDR", "KWD", "NOK", "SAR", "SGD", "USD"]);
export const showsSummary = (code: string) => FIRST_GROUP.has(code);

const LEVEL: Record<Signal, string> = { cheap: "싼 편", normal: "보통", expensive: "비싼 편" };

type Day = { date: string; baseRate: number };
type RateNow = Pick<FxRate, "date" | "baseRate" | "unit">;
type SignalNow = { signal: Signal | null; percentile: number | null; windowDays: number };

/** 기준일 · 환율 · 평균 대비 · 판단 — days 는 rate.unit 에 맞춘 값 */
export function summaryOf(name: string, code: string, rate: RateNow, days: Day[], s: SignalNow | null): string {
  const t = rateText(rate);
  const parts = [`${rate.date} 기준 ${name}(${code}) 환율은 ${t.value}${t.unit}입니다.`];
  if (days.length >= 2) {
    const avg = days.reduce((sum, d) => sum + d.baseRate, 0) / days.length;
    const pct = ((rate.baseRate - avg) / avg) * 100;
    const where = Math.abs(pct) < 0.05 ? "거의 같습니다" : `${Math.abs(pct).toFixed(1)}% ${pct < 0 ? "낮습니다" : "높습니다"}`;
    parts.push(`고시를 받은 최근 1년 ${days.length}일의 평균 ${rateText({ baseRate: avg, unit: rate.unit }).value}${t.unit}보다 ${where}.`);
  }
  if (s?.signal) parts.push(`최근 ${s.windowDays}일 기준으로는 ${LEVEL[s.signal]}입니다 (${percentileText(s.signal, s.percentile, s.windowDays)}).`);
  parts.push("지난 값과 비교한 것이며 예측이 아닙니다.");
  return parts.join(" ");
}

/** 기간별 처음 → 마지막 — 기록이 모자란 기간은 뺌 · 받은 기록이 그 기간을 다 채우지 못하면 뺌 (짧은 기록을 1년으로 보이지 않게) */
export function periodRows(days: Day[]) {
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  if (!first || !last) return [];
  const heldDays = (Date.parse(last) - Date.parse(first)) / 86400_000;
  return PERIODS.flatMap((p) => {
    const c = changeOf(sliceDays(days, p.days));
    // 1년은 공휴일 · 주말로 시작일이 며칠 밀려도 인정
    return c && heldDays >= p.days - 7 ? [{ id: p.id, label: p.label, from: c.from, to: c.to, pct: c.pct }] : [];
  });
}
