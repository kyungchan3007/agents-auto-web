// 나라 페이지 자료 받기 (작업 0344) — 빌드 때 우리 API 에서 · 받지 못한 것은 null 로 넘김 (페이지가 "자료 없음" 으로 그림)
import { api, mustHave } from "@hav/shared/api";
import type { PriceLevels } from "@hav/shared/prices";
import { toUnit } from "@hav/shared/currency";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { type CountryInput, type CountryView, countryView } from "./country-model";
import { countryTargets } from "./country-view";

export async function loadTargets(): Promise<string[]> {
  const levels = mustHave(await api.priceLevels(), "여행 물가");
  return countryTargets(levels.ok ? levels.data : null);
}

export async function loadCountry(code: string): Promise<{ view: CountryView | null; levels: PriceLevels | null; problem: string | null }> {
  const currency = TRAVEL_COUNTRIES[code]?.currency ?? null;
  const [levels, latest, signals, calendar, air, history] = await Promise.all([
    api.priceLevels(),
    api.latest(),
    api.signals(),
    api.airfareCalendar(),
    api.indicator("kosis-cpi:air-fare", 60),
    currency ? api.history(currency, 365) : Promise.resolve(null),
  ]);
  if (!levels.ok) return { view: null, levels: null, problem: levels.reason };
  const rate = currency && latest.ok ? (latest.data.rates.find((r) => r.currency === currency) ?? null) : null;
  const sig = currency && signals.ok ? signals.data.signals.find((s) => s.currency === currency) : undefined;
  const input: CountryInput = {
    code,
    levels: levels.data,
    rate,
    history: rate && history?.ok ? toUnit(history.data.rates, rate.unit) : null,
    signal: sig && signals.ok ? { signal: sig.signal, percentile: sig.percentile, windowDays: signals.data.rule.windowDays } : null,
    calendar: calendar.ok ? calendar.data : null,
    airPoints: air.ok ? air.data.points : null,
  };
  return { view: countryView(input), levels: levels.data, problem: null };
}

/**
 * 여행 물가 목록의 나라 사이드바 내용 (작업 0361 2단계) — 목록의 모든 나라를 한 번에 · 나라 페이지와 같은 계산(countryView)
 *   환율 · 신호 · 항공권은 한 번만 받고 · 1년 환율 기록은 통화마다 한 번 · 받지 못한 값은 null 로 두어 사이드바가 "물가만"으로 그림 (지어내지 않음)
 */
export async function loadSideViews(levels: PriceLevels): Promise<CountryView[]> {
  const codes = countryTargets(levels);
  const currencies = [...new Set(codes.flatMap((c) => TRAVEL_COUNTRIES[c]?.currency ?? []))];
  const [latest, signals, calendar, air, histories] = await Promise.all([api.latest(), api.signals(), api.airfareCalendar(), api.indicator("kosis-cpi:air-fare", 60), Promise.all(currencies.map((c) => api.history(c, 365)))]);
  const historyOf = new Map(currencies.map((c, i) => [c, histories[i]]));
  return codes.flatMap((code) => {
    const currency = TRAVEL_COUNTRIES[code]?.currency ?? null;
    const rate = currency && latest.ok ? (latest.data.rates.find((r) => r.currency === currency) ?? null) : null;
    const sig = currency && signals.ok ? signals.data.signals.find((s) => s.currency === currency) : undefined;
    const history = currency ? historyOf.get(currency) : undefined;
    const view = countryView({
      code,
      levels,
      rate,
      history: rate && history?.ok ? toUnit(history.data.rates, rate.unit) : null,
      signal: sig && signals.ok ? { signal: sig.signal, percentile: sig.percentile, windowDays: signals.data.rule.windowDays } : null,
      calendar: calendar.ok ? calendar.data : null,
      airPoints: air.ok ? air.data.points : null,
    });
    return view ? [view] : [];
  });
}
