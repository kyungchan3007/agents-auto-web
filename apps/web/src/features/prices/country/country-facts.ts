// 나라 물가 머리의 오늘 요약 값 (작업 0396) — 페이지가 이미 받는 신호 목록 · 물가 수준에서만 · 계산은 공통 shared/facts
//   신호 목록의 latest.value 는 1 외화당 원이라 고시 단위 1 로 넘김 · 새 API · 계약 변경 없음 · 받지 못한 값은 null
import type { Fetched } from "@hav/shared/api";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import { type Facts, factsFor } from "@/shared/facts/facts";

export function countryFacts(code: string, levels: PriceLevels | null, signals: Fetched<SignalList>): Facts {
  const list = signals.ok ? signals.data.signals : [];
  const rates = list.flatMap((s) => (s.latest ? [{ currency: s.currency, unit: 1, baseRate: s.latest.value }] : []));
  return factsFor({ country: code, rates, signals: list, levels, windowDays: signals.ok ? signals.data.rule.windowDays : 90 });
}
