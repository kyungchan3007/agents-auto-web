// 관세청 과세환율 — 계산기가 쓸 환율 고르기 · 수출입은행과의 차이 · "준비 중" (순수 함수 · 작업 0163)
//   직구 관세 · 부가세는 관세청이 매주 고시하는 과세환율로 계산됨 — 일요일 ~ 토요일 적용
import { weekStartOf } from "@hav/shared/date";
import type { Rate } from "./calc";

export type CustomsRate = { perUnit: number; weekStart: string };
export type RateSource = { kind: "customs"; weekStart: string; label: string } | { kind: "bank"; label: string };
export type Point = { period: string; value: number };

/** 이번 주 과세환율이 있으면 그것 · 없거나 지난 주 값이면 수출입은행(예상) · 둘 다 없으면 null (환율을 지어내지 않음) */
export function pickRate(currency: string, bank: Record<string, Rate>, customs: Record<string, CustomsRate> | null | undefined, today: string): { rate: Rate; source: RateSource } | null {
  const c = customs?.[currency];
  if (c && c.weekStart === weekStartOf(today)) {
    return { rate: { baseRate: c.perUnit, unit: 1 }, source: { kind: "customs", weekStart: c.weekStart, label: `관세청 과세환율 · ${c.weekStart} 주 고시` } };
  }
  const b = bank[currency];
  return b ? { rate: b, source: { kind: "bank", label: "수출입은행 환율로 계산한 예상 금액 (이번 주 과세환율 없음)" } } : null;
}

/** 수출입은행 고시 단위(100엔 등)에 맞춰 비교 */
export function customsGap(customs: CustomsRate, bank: Rate) {
  const c = customs.perUnit * bank.unit;
  const gapKrw = c - bank.baseRate;
  return { unit: bank.unit, customs: c, bank: bank.baseRate, gapKrw, gapPct: (gapKrw / bank.baseRate) * 100 };
}

export type CustomsView = { kind: "preparing" } | { kind: "ready"; latest: Point; trend: Point[]; gap: ReturnType<typeof customsGap> | null };

export function customsView(points: Point[] | null | undefined, bank: Rate | null | undefined): CustomsView {
  if (!points || points.length === 0) return { kind: "preparing" };
  const trend = [...points].sort((a, b) => a.period.localeCompare(b.period));
  const latest = trend[trend.length - 1];
  return { kind: "ready", latest, trend, gap: bank ? customsGap({ perUnit: latest.value, weekStart: latest.period }, bank) : null };
}
