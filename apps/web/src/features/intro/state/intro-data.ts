// 서버(page.tsx)가 빌드 때 받은 값을 인트로가 쓸 작은 모양으로 — 순수 함수 (작업 0185) · 못 받은 것은 빈 배열 · null (지어내지 않음)
import type { IntroData } from "./use-intro";

type Ok<T> = { ok: true; data: T } | { ok: false };

export function introDataOf(a: {
  latest: Ok<{ rates: { currency: string; unit: number; baseRate: number }[] }>;
  signals: Ok<{ signals: { currency: string; signal: "cheap" | "normal" | "expensive" | null }[]; rule: { windowDays: number } }>;
  airFare: Ok<{ points: { period: string; value: number }[] }>;
  levels: Ok<{ rows: { country: string; relative: number }[] }>;
}): IntroData {
  return {
    rates: a.latest.ok ? a.latest.data.rates.map((r) => ({ currency: r.currency, unit: r.unit, baseRate: r.baseRate })) : [],
    signals: a.signals.ok ? a.signals.data.signals.map((s) => ({ currency: s.currency, signal: s.signal })) : [],
    levels: a.levels.ok ? a.levels.data.rows.map((r) => ({ country: r.country, relative: r.relative })) : [],
    airFare: a.airFare.ok ? a.airFare.data.points.map((p) => ({ period: p.period, value: p.value })) : null,
    windowDays: a.signals.ok ? a.signals.data.rule.windowDays : 90,
  };
}
