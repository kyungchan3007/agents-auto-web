// 지금 살 때인가 — 최근 90일 안에서 오늘 값의 위치 (예측 아님 · SIG-01)
//   백분위 = 최근 90일 중 오늘보다 낮았던 날의 비율 · 아래 30% 싼 편 · 위 30% 비싼 편 (사용자 확인: "전부 추천대로")

import type { Point, Signal, SignalResult, SignalRule } from "@hav/shared/signal";

export type { Point, Signal, SignalResult, SignalRule }; // 모양의 원본은 @hav/shared/signal

export const SIGNAL_RULE: SignalRule = {
  windowDays: 90,
  cheapAt: 0.3,
  expensiveAt: 0.7,
  minCoverage: 0.8, // SIG-03: 기간 영업일의 80% 미만이면 신호를 내지 않음
};

export const SIGNAL_METHOD = "최근 90일 중 오늘보다 낮았던 날의 비율 · 30% 이하 싼 편 · 70% 이상 비싼 편 · 예측 아님";

const DAY = 86400_000;
const day = (s: string) => Date.parse(`${s}T00:00:00Z`);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** from ~ to (둘 다 포함) 의 평일 수 */
export function weekdaysBetween(from: string, to: string): number {
  let n = 0;
  for (let t = day(from); t <= day(to); t += DAY) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) n++;
  }
  return n;
}

export function computeSignal(points: Point[], rule: SignalRule = SIGNAL_RULE): SignalResult {
  const base = { method: SIGNAL_METHOD };
  const sorted = points.filter((p) => p.value > 0).sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  if (!latest) return { ...base, signal: null, reason: "no-data", percentile: null, latest: null, window: null, range: null };

  const from = iso(day(latest.date) - (rule.windowDays - 1) * DAY);
  const inWindow = sorted.filter((p) => p.date >= from);
  const expected = weekdaysBetween(from, latest.date);
  const window = { from, to: latest.date, count: inWindow.length, expected };
  const values = inWindow.map((p) => p.value);
  const range = { min: Math.min(...values), max: Math.max(...values) };

  if (inWindow.length < 2 || inWindow.length < expected * rule.minCoverage) {
    return { ...base, signal: null, reason: "data-short", percentile: null, latest, window, range };
  }
  const others = inWindow.length - 1;
  const lower = inWindow.filter((p) => p.value < latest.value).length;
  const percentile = Math.round((lower / others) * 100) / 100;
  const signal: Signal = percentile <= rule.cheapAt ? "cheap" : percentile >= rule.expensiveAt ? "expensive" : "normal";
  return { ...base, signal, reason: "ok", percentile, latest, window, range };
}

/** 1 외화당 원 — 엔처럼 100 단위 고시도, 출처마다 단위가 달라도 같은 기준으로 (FX-04) */
export const perUnit = (r: { baseRate: number; unit: number }) => r.baseRate / r.unit;

/**
 * 저장된 환율(통화 · 날짜순) → 통화별 신호
 * 공식 값이 있는 통화만 — 2026-09-15 예비 출처에서 들어온 통화 147개가 "자료 부족" 으로 남아 있었음 (FX-03 · 작업 0098)
 */
export function signalsByCurrency(rows: { currency: string; date: string; baseRate: number; unit: number; source: string }[]) {
  const official = new Set(rows.filter((r) => r.source === "koreaexim").map((r) => r.currency));
  const byCurrency = new Map<string, Point[]>();
  for (const r of rows) if (official.has(r.currency)) byCurrency.set(r.currency, [...(byCurrency.get(r.currency) ?? []), { date: r.date, value: perUnit(r) }]);
  return [...byCurrency].map(([currency, points]) => {
    const { signal, reason, percentile, latest } = computeSignal(points);
    return { currency, signal, reason, percentile, latest };
  });
}
