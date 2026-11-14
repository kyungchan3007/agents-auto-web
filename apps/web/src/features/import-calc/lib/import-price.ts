// 원/달러 월평균 · 수입물가지수를 같은 달끼리 맞추기 — 순수 함수 (작업 0165)
//   환율이 오르면 수입물가가 따라 오르는지 한 차트에서 보려고 · 한쪽만 있는 달은 null (가운데를 채우지 않음) · 자료가 없으면 "준비 중"
import { fxMonthlyAverage } from "@hav/shared/currency";

export type MonthPoint = { period: string; value: number };
export type FxDay = { date: string; baseRate: number; unit: number };
export type AlignedMonth = { period: string; fx: number | null; price: number | null };

/** 일별 환율 → 달별 평균 — 공용 계산(@hav/shared/currency · 여행 물가와 같은 함수)을 그대로 씀 (같은 이름으로 다시 내보냄 · 중복 없음) */
export const monthlyFx: (rows: FxDay[]) => MonthPoint[] = fxMonthlyAverage;

/** 두 자료의 달을 합쳐 오래된 달부터 · 같은 달은 한 줄 · 한쪽만 있으면 없는 쪽은 null */
export function alignMonthly(fx: MonthPoint[], price: MonthPoint[]): AlignedMonth[] {
  const fxBy = new Map(fx.map((p) => [p.period, p.value]));
  const priceBy = new Map(price.map((p) => [p.period, p.value]));
  return [...new Set([...fxBy.keys(), ...priceBy.keys()])].sort().map((period) => ({ period, fx: fxBy.get(period) ?? null, price: priceBy.get(period) ?? null }));
}

export type ImportPriceView = { kind: "preparing" } | { kind: "ready"; rows: AlignedMonth[]; both: number };

export function importPriceView(fxRows: FxDay[] | null | undefined, price: MonthPoint[] | null | undefined): ImportPriceView {
  if (!price || price.length === 0 || !fxRows || fxRows.length === 0) return { kind: "preparing" };
  const rows = alignMonthly(monthlyFx(fxRows), price);
  const both = rows.filter((r) => r.fx !== null && r.price !== null).length;
  return both === 0 ? { kind: "preparing" } : { kind: "ready", rows, both };
}
