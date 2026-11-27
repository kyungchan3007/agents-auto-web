// 오늘 숫자 칸의 값 (작업 0393 · 0396) — 첫 페이지와 나라 물가 머리가 같이 씀 · 순수 함수 · React 없음
//   값은 페이지가 이미 받은 환율 · 신호 · 물가 수준에서만 · 받지 못한 값은 null (화면은 "-" 또는 안내 · 지어내지 않음)
import { currencyName } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import type { PriceLevels } from "@hav/shared/prices";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";

/** 1 외화당 원을 구할 수 있는 환율 한 줄 (고시 단위 · 홈 RateRow 와 같은 모양) */
export type FactRate = { currency: string; unit: number; baseRate: number };
/** 90일 신호 한 줄 (홈 SignalRow 와 같은 모양) */
export type FactSignal = { currency: string; percentile: number | null; median?: number | null };

/** 나라가 쓰는 통화 — 수출입은행이 값을 주지 않는 나라는 null (TRAVEL_COUNTRIES 의 currency 가 그 목록) */
export const currencyOf = (country: string): string | null => TRAVEL_COUNTRIES[country]?.currency ?? null;
/** 1 외화당 원 */
export const perOf = (currency: string | null, rates: FactRate[]): number | null => {
  const r = currency ? rates.find((x) => x.currency === currency) : undefined;
  return r && r.unit > 0 ? r.baseRate / r.unit : null;
};
/** 값 크기에 맞춘 자릿수(1,475 · 41.2 · 9.41 · 0.056) */
const digitsFor = (n: number): number => (n >= 100 ? 0 : n >= 10 ? 1 : n >= 1 ? 2 : 3);
export const fixed = (n: number): string => numberText(n, { minimumFractionDigits: digitsFor(n), maximumFractionDigits: digitsFor(n) });
export const unitName = (currency: string): string => currencyName(currency).replace(/화$/, "");
/** 최근 며칠 중 오늘보다 환율이 높았던 날의 비율(%) */
export const belowOf = (sig: FactSignal | undefined): number | null => (sig && sig.percentile !== null ? Math.round((1 - sig.percentile) * 100) : null);

export type Facts = {
  /** "일본 도쿄" · 나라 페이지는 "일본" */
  title: string;
  /** 나라 이름 "일본" */
  name: string;
  /** 이 나라 통화를 수출입은행이 주지 않음 — 환율 · 1만원이면 · 90일을 그릴 수 없음 */
  noRate: boolean;
  /** "9.41원" · 못 받으면 null */
  rateText: string | null;
  /** "1엔" */
  perText: string | null;
  /** 1만원이면 — "1,063" 과 "엔" */
  tenKValue: string | null;
  tenKUnit: string | null;
  /** 한국보다 "12% 높음" · "62% 낮음" · "비슷" */
  priceText: string | null;
  /** 90일 위치 막대(0~100) */
  position: number | null;
  /** "오늘은 90일 중 보통 (64%의 날보다 낮음)" */
  positionText: string | null;
  /** 90일 중간값 "9.20원" */
  medianText: string | null;
};

/** 한 나라의 숫자 칸 값 — 90일 최저 · 최고는 목록 응답에 없어 그리지 않음(중간값만) */
export function factsFor(i: { country: string; title?: string; rates: FactRate[]; signals: FactSignal[]; levels: PriceLevels | null; windowDays?: number }): Facts {
  const windowDays = i.windowDays ?? 90;
  const name = TRAVEL_COUNTRIES[i.country]?.name ?? "";
  const currency = currencyOf(i.country);
  const per = perOf(currency, i.rates);
  const sig = i.signals.find((s) => s.currency === currency);
  const below = belowOf(sig);
  const lv = (i.levels?.rows ?? []).filter((l) => l.country === i.country).sort((a, b) => b.year - a.year)[0];
  const gap = lv ? Math.round(Math.abs(lv.relative - 1) * 100) : null;
  const band = below === null ? null : below >= 66 ? "낮은 편" : below >= 33 ? "보통" : "높은 편";
  const median = sig?.median;
  return {
    title: i.title ?? name,
    name,
    noRate: currency === null,
    rateText: per === null ? null : `${fixed(per)}원`,
    perText: currency && per !== null ? `1${unitName(currency)}` : null,
    tenKValue: per === null ? null : fixed(10000 / per),
    tenKUnit: currency && per !== null ? unitName(currency) : null,
    priceText: !lv || gap === null ? null : gap === 0 ? "비슷" : `${gap}% ${lv.relative > 1 ? "높음" : "낮음"}`,
    position: below,
    positionText: below === null ? null : `오늘은 ${windowDays}일 중 ${band} (${below}%의 날보다 낮음)`,
    medianText: median === null || median === undefined || !Number.isFinite(median) ? null : `${fixed(median)}원`,
  };
}
