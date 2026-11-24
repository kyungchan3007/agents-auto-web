// 통화 상세 한 줄 답 · 질문 넷을 페이지 자료에서 한 번에 (작업 0345) — 화면과 구조화 자료(FAQPage)가 같은 값을 쓰도록 한 곳 · 순수 함수
import { currencyName, percentileText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { PriceLevels } from "@hav/shared/prices";
import type { CurrencySignal } from "@hav/shared/signal";
import { type CurrencyFaqItem, answerLine, currencyFaq, faqCountry } from "./currency-faq";
import { yearStats } from "./detail-view";

type Input = { code: string; rate: FxRate | null; signal: { ok: true; data: CurrencySignal } | { ok: false }; history: { ok: true; data: FxHistory } | { ok: false }; levels?: PriceLevels | null };

export function detailFaq(d: Input): { answer: { label: string; text: string } | null; items: CurrencyFaqItem[] } {
  if (!d.rate) return { answer: null, items: [] };
  const stats = d.history.ok ? yearStats(toUnit(d.history.data.rates, d.rate.unit)) : null;
  const s = d.signal.ok ? d.signal.data : null;
  const rate = { baseRate: d.rate.baseRate, unit: d.rate.unit, date: d.rate.date };
  const two = stats && { min: stats.min, avg: stats.avg };
  return {
    answer: answerLine({ code: d.code, rate, stats: two }),
    items: currencyFaq({ code: d.code, name: currencyName(d.code), rate, stats: two, signalText: percentileText(s?.signal ?? null, s?.percentile ?? null, s?.rule.windowDays ?? 90), country: faqCountry(d.code, d.levels?.rows ?? null) }),
  };
}
