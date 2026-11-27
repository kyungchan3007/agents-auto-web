// 흐르는 환율 띠의 항목 · 순서 · 글 (작업 0399) — 순수 함수 · React 없음 · 값은 페이지가 이미 받은 환율 · 신호에서만
//   환율을 받지 못한 통화는 뺌 · 신호가 없으면 금액만 · 하나도 없으면 빈 목록(띠를 그리지 않음) · 숫자를 지어내지 않음
import { currencyFlag, currencyListName } from "@hav/shared/currency";
import { wonText } from "@hav/shared/format";
import { type Signal, signalLabel } from "@/shared/signal/signal-pin-text";

/** 환율 한 줄 (고시 단위 · 홈 RateRow 와 같은 모양) */
export type TickerRate = { currency: string; unit: number; baseRate: number };
/** 신호 한 줄 (홈 SignalRow 와 같은 모양에서 쓰는 것만) */
export type TickerSignal = { currency: string; signal: Signal | null };

export type TickerItem = {
  code: string;
  /** 누르면 가는 통화 상세 */
  href: string;
  flag: string | null;
  /** "일본 엔 100" — 고시 단위가 1 보다 크면 단위를 붙임 */
  name: string;
  /** 도착지 목록과 같은 금액 글 "843원" */
  amount: string;
  signal: Signal | null;
  /** 낮음 · 보통 · 높음 — 신호가 없으면 null */
  signalText: string | null;
};

/** 많이 찾는 통화 먼저 — 엔 · 달러 · 유로 · 바트 · 싱가포르 달러 · 파운드 · 홍콩 달러 · 호주 달러 · 위안 · 캐나다 달러 · 나머지는 코드 순 */
export const TICKER_FIRST = ["JPY", "USD", "EUR", "THB", "SGD", "GBP", "HKD", "AUD", "CNH", "CAD"] as const;

const rank = (code: string): number => {
  const i = (TICKER_FIRST as readonly string[]).indexOf(code);
  return i < 0 ? TICKER_FIRST.length : i;
};

export function tickerItems(rates: TickerRate[], signals: TickerSignal[]): TickerItem[] {
  return rates
    .filter((r) => Number.isFinite(r.baseRate) && r.baseRate > 0 && r.unit > 0)
    .sort((a, b) => rank(a.currency) - rank(b.currency) || a.currency.localeCompare(b.currency))
    .map((r) => {
      const signal = signals.find((s) => s.currency === r.currency)?.signal ?? null;
      return {
        code: r.currency,
        href: `/currencies/${r.currency}`,
        flag: currencyFlag(r.currency),
        name: r.unit > 1 ? `${currencyListName(r.currency)} ${r.unit}` : currencyListName(r.currency),
        amount: wonText(r.baseRate),
        signal,
        signalText: signal ? signalLabel(signal) : null,
      };
    });
}

/** 라벨의 날짜 "11.27" — 환율 날짜(YYYY-MM-DD) · 날짜가 아니면 null (라벨은 날짜 없이) */
export function tickerDate(date: string | null | undefined): string | null {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date ?? "");
  return m ? `${Number(m[1])}.${m[2]}` : null;
}

/** 한 바퀴 시간(초) — 초당 약 40px · 항목 하나 약 200px 로 어림 (항목 10개 약 50초) · 너무 짧지 않게 */
export const PX_PER_SEC = 40;
const ITEM_PX = 200;
export const tickerSeconds = (count: number): number => Math.max(20, Math.round((count * ITEM_PX) / PX_PER_SEC));
