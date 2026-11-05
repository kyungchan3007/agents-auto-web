// 홈 자료 가공 — 빌드 때 받은 값을 화면이 쓰는 모양으로 (순수 함수 · 테스트 있음)
import { groupByRegion, rangeOf, toUnit } from "@hav/shared/currency";
import type { FxChanges, FxHistory, FxLatest } from "@hav/shared/fx";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import type { Fetched } from "@/shared/api";
import { DESTINATIONS } from "./places";

export const HERO = "USD";

export type HomeData = {
  latest: Fetched<FxLatest>;
  signals: Fetched<SignalList>;
  levels: Fetched<PriceLevels>;
  heroHistory: Fetched<FxHistory>;
  /** 통화마다 지난 1개월 변화 — 못 받으면 칸에서 뺌 (작업 0096) */
  changes: Fetched<FxChanges>;
};

export function homeView({ latest, signals, levels, heroHistory, changes }: HomeData) {
  const rates = latest.ok ? latest.data.rates : [];
  const bySignal = new Map(signals.ok ? signals.data.signals.map((s) => [s.currency, s]) : []);
  const priceOf = new Map(levels.ok ? levels.data.rows.map((r) => [r.country, r]) : []);
  const hero = rates.find((r) => r.currency === HERO);
  const year = hero && heroHistory.ok ? toUnit(heroHistory.data.rates, hero.unit) : [];
  return {
    rates,
    bySignal,
    changeOf: new Map(changes.ok ? changes.data.changes.map((c) => [c.currency, c]) : []),
    windowDays: signals.ok ? signals.data.rule.windowDays : 90,
    hero,
    heroSignal: bySignal.get(HERO),
    groups: groupByRegion(rates),
    problem: !latest.ok ? latest.reason : !signals.ok ? signals.reason : null,
    stops: DESTINATIONS.map((place) => {
      const p = priceOf.get(place.country);
      return {
        place,
        rate: rates.find((r) => r.currency === place.currency) ?? null,
        signal: bySignal.get(place.currency ?? "")?.signal ?? null,
        price: p ? { relative: p.relative, year: p.year } : null,
      };
    }),
    year,
    yearRange: rangeOf(year),
    heroHistoryProblem: heroHistory.ok ? "1년 기록이 모자랍니다" : heroHistory.reason,
  };
}

export type HomeView = ReturnType<typeof homeView>;
