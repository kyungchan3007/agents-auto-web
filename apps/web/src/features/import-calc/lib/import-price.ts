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

export type Kpi = { period: string; value: number; delta: number | null };

/** 큰 숫자 두 개 — 각 값의 가장 최근 달 + 바로 앞 값과의 차이 (앞이 없으면 delta null · 값이 없으면 null · 작업 0200) */
export function importPriceKpis(rows: AlignedMonth[]): { price: Kpi | null; fx: Kpi | null } {
  const kpi = (key: "fx" | "price"): Kpi | null => {
    const have = rows.filter((r) => r[key] !== null) as (AlignedMonth & Record<typeof key, number>)[];
    const last = have[have.length - 1];
    if (!last) return null;
    const prev = have[have.length - 2];
    return { period: last.period, value: last[key], delta: prev ? last[key] - prev[key] : null };
  };
  return { price: kpi("price"), fx: kpi("fx") };
}

/** 카운트업 소수 자리 — 값이 보이는 만큼(끝 0 제외 · 최대 max) · 정수면 0 (작업 0221 · formatCount 끝 글 = numberText 지금 글) */
export function kpiDigits(value: number, max = 2): number {
  const frac = (Number(value.toFixed(max)).toString().split(".")[1] ?? "").length;
  return Math.min(max, frac);
}

/** 전달보다 — 오름 up · 내림 down · 같음 flat · 없으면 null (점 색 · 작업 0221) */
export const deltaTone = (delta: number | null): "up" | "down" | "flat" | null => (delta === null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat");
