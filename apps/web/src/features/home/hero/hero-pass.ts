// 첫 화면 탑승권 hero 의 값 · 순서 (작업 0380) — 순수 함수 · 값은 홈이 이미 받는 환율 · 신호에서만 · 받지 못한 값은 빈 글(지어내지 않음)
//   탑승권 네 장(파리 → 도쿄 → 방콕 → 다낭 순으로 맨 앞이 넘어감) · 꼬리표 셋(오늘 환율로 계산) · 칩(도쿄 · 방콕 · 다낭 · 파리)
import { type DestinationHit, POPULAR_DESTINATIONS } from "@hav/shared/destination-search";
import type { RateRow, SignalRow } from "../common/destinations";
import { HERO_GUIDE } from "../timing/hero-guide";

export const ORIGIN = { code: "ICN", name: "인천" };

type City = { id: string; city: string; currency: string; code: string; unit: string };
/** 탑승권이 쌓이는 순서 — 맨 앞부터 (파리 → 도쿄 → 방콕 → 다낭) */
export const PASS_CITIES: City[] = [
  { id: "paris", city: "파리", currency: "EUR", code: "CDG", unit: "유로" },
  { id: "tokyo", city: "도쿄", currency: "JPY", code: "NRT", unit: "엔" },
  { id: "bangkok", city: "방콕", currency: "THB", code: "BKK", unit: "바트" },
  { id: "danang", city: "다낭", currency: "VND", code: "DAD", unit: "동" },
];

export type PassCard = {
  id: string;
  city: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  /** "1,475원" · 환율이 없으면 빈 글 */
  rateText: string;
  /** "1유로" */
  perText: string;
  /** 떠나기 좋은 달 "11월" · 지수가 없으면 빈 글 */
  month: string;
  /** "83%" · 신호가 없으면 빈 글 */
  pctText: string;
  /** 막대 너비(0~100) · 신호가 없으면 0 */
  pct: number;
  windowDays: number;
};

/** 1 외화당 원 — 값 크기에 맞춰 자릿수(1,475 · 41.2 · 9.41 · 0.056) */
function perUnitText(won: number): string {
  const d = won >= 100 ? 0 : won >= 10 ? 1 : won >= 1 ? 2 : 3;
  return `${won.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d })}원`;
}

export function passCards(rates: RateRow[], signals: SignalRow[], windowDays: number, month: string): PassCard[] {
  return PASS_CITIES.map((c) => {
    const rate = rates.find((r) => r.currency === c.currency);
    const sig = signals.find((s) => s.currency === c.currency);
    const below = sig && sig.percentile !== null ? Math.round((1 - sig.percentile) * 100) : null;
    return {
      id: c.id,
      city: c.city,
      fromCode: ORIGIN.code,
      fromName: ORIGIN.name,
      toCode: c.code,
      rateText: rate ? perUnitText(rate.baseRate / rate.unit) : "",
      perText: `1${c.unit}`,
      month,
      pctText: below === null ? "" : `${below}%`,
      pct: below ?? 0,
      windowDays,
    };
  });
}

export type FxTag = { id: "t1" | "t2" | "t3"; lead: string; value: string };

/** 주변 꼬리표 셋 — 오늘 환율로 계산 · 환율이 없는 꼬리표는 그리지 않음 */
export function fxTags(rates: RateRow[]): FxTag[] {
  const per = (currency: string) => {
    const r = rates.find((x) => x.currency === currency);
    return r ? r.baseRate / r.unit : null;
  };
  const jpy = per("JPY");
  const eur = per("EUR");
  const thb = per("THB");
  const int = (n: number) => Math.round(n).toLocaleString("ko-KR");
  return [
    ...(jpy ? [{ id: "t1" as const, lead: "1만원 → ", value: `¥${int(10000 / jpy)}` }] : []),
    ...(eur ? [{ id: "t2" as const, lead: "€1 = ", value: `${int(eur)}원` }] : []),
    ...(thb ? [{ id: "t3" as const, lead: "฿100 = ", value: `${int(thb * 100)}원` }] : []),
  ];
}

/** 칩 — 도쿄 · 방콕 · 다낭 · 파리 (기존 여행지 고르기와 같은 항목 · 같은 저장 값) */
export const heroChips = (): DestinationHit[] => HERO_GUIDE.chips.flatMap((name) => POPULAR_DESTINATIONS.filter((h) => h.city === name));

export type Slot = "0" | "1" | "2" | "out" | "in";
/** 탑승권 한 장의 자리 — 앞 세 장은 0 · 1 · 2 · 넘어가는 중인 맨 앞은 out · 나머지는 in(보이지 않게 뒤에 대기) */
export function deckSlot(order: string[], leaving: boolean, id: string): Slot {
  const i = order.indexOf(id);
  if (i === 0 && leaving) return "out";
  return i === 0 ? "0" : i === 1 ? "1" : i === 2 ? "2" : "in";
}

/** 맨 앞 한 장을 뒤로 보냄 · toId 가 있으면 그 장이 맨 앞이 될 때까지 */
export function rotateDeck(order: string[], toId?: string): string[] {
  const next = [...order.slice(1), ...order.slice(0, 1)];
  if (!toId || !next.includes(toId)) return next;
  for (let i = 0; i < next.length && next[0] !== toId; i++) next.push(...next.splice(0, 1));
  return next;
}

/** 도시 이름 → 탑승권 번호(id) · 없으면 null */
export const passIdOf = (city: string): string | null => PASS_CITIES.find((c) => c.city === city)?.id ?? null;

/** 칩이 지금 맨 앞 장의 도시인가 */
export const isFrontCity = (order: string[], city: string): boolean => passIdOf(city) === order[0];

/** hero 오른쪽에 그릴 값 한 묶음 — 탑승권 네 장 · 꼬리표 · 위 오른쪽 달 글("이번 주 · 11월") */
export function heroPassView(rates: RateRow[], signals: SignalRow[], windowDays: number, month: string): { cards: PassCard[]; tags: FxTag[]; monthLabel: string } {
  return { cards: passCards(rates, signals, windowDays, month), tags: fxTags(rates), monthLabel: month ? `이번 주 · ${month}` : "이번 주" };
}
