// 신호 목록 → 통화별 맵 (작업 0312 에 통화 목록(browse-layout) · 여행 물가(price-page)의 같은 변환을 모음) · 순수 함수 · 못 받으면 빈 맵
import type { Fetched } from "@hav/shared/api";
import type { SignalList } from "@hav/shared/signal";

type Item = SignalList["signals"][number];

export function signalMaps(signals: Fetched<SignalList>) {
  const list: Item[] = signals.ok ? signals.data.signals : [];
  const by = <T,>(f: (s: Item) => T) => Object.fromEntries(list.map((s) => [s.currency, f(s)])) as Record<string, T>;
  return {
    signalOf: by((s) => s.signal),
    percentileOf: by((s) => s.percentile),
    latestOf: by((s) => s.latest),
    /** 표의 "90일 최고보다" — 오늘 값 · 90일 최고 (없으면 null) */
    valueOf: by((s) => ({ latest: s.latest?.value ?? null, max: s.max ?? null })),
  };
}
