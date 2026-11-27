// 기본 hero 에서 고른 곳의 값 (작업 0393) — 순수 함수 · React 없음 · 값은 홈이 이미 받는 환율 · 신호 · 물가 수준에서만 · 받지 못한 값은 null (화면은 "-" · 지어내지 않음)
//   탑승권 한 장(passFor) · 칩 아래 숫자 칸(pickFacts) · 고른 장을 앞에 세운 덱 순서(frontWith)
import { type DestinationHit, POPULAR_DESTINATIONS } from "@hav/shared/destination-search";
import type { PriceLevels } from "@hav/shared/prices";
import { TRAVEL_COUNTRIES, countryPath } from "@hav/shared/travel";
import type { RateRow, SignalRow } from "../common/destinations";
import { type Facts, belowOf, currencyOf, factsFor, fixed, perOf, unitName } from "@/shared/facts/facts";
import { ORIGIN, PASS_CITIES, type PassCard } from "./hero-pass";

/** 도착 공항 — 항공권 달력이 다루는 8곳만(자료에 있을 때만 · 나머지는 빈 글) */
const AIRPORTS: Record<string, string> = { 도쿄: "NRT", 오사카: "KIX", 방콕: "BKK", 파리: "CDG", 다낭: "DAD", 싱가포르: "SIN", 뉴욕: "JFK", 런던: "LHR" };
export const airportOf = (city: string): string => AIRPORTS[city] ?? "";

/** 네 도시 밖을 골랐을 때 만드는 탑승권 번호의 머리글 */
export const PICK_PREFIX = "pick-";
export const isPickCardId = (id: string): boolean => id.startsWith(PICK_PREFIX);
export const pickCardId = (hit: DestinationHit): string => `${PICK_PREFIX}${hit.country}-${hit.city}`;
const baseOf = (city: string) => PASS_CITIES.find((c) => c.city === city);
/** 고른 곳이 들어갈 탑승권 번호 — 네 도시면 그 장 · 아니면 새로 만드는 장 */
export const cardIdOf = (hit: DestinationHit): string => baseOf(hit.city)?.id ?? pickCardId(hit);

/** 고른 도시의 탑승권 한 장 — 네 도시는 지금 값 그대로 · 밖은 같은 모양에 id "pick-나라-도시" · 환율 · 신호가 없으면 빈 글 */
export function passFor(hit: DestinationHit, rates: RateRow[], signals: SignalRow[], windowDays: number, month: string): PassCard {
  const base = baseOf(hit.city);
  const currency = base?.currency ?? currencyOf(hit.country);
  const per = perOf(currency, rates);
  const below = belowOf(signals.find((s) => s.currency === currency));
  return {
    id: cardIdOf(hit),
    city: hit.city,
    fromCode: ORIGIN.code,
    fromName: ORIGIN.name,
    toCode: base?.code ?? airportOf(hit.city),
    rateText: per === null ? "" : `${fixed(per)}원`,
    perText: base ? `1${base.unit}` : currency ? `1${unitName(currency)}` : "",
    month,
    pctText: below === null ? "" : `${below}%`,
    pct: below ?? 0,
    windowDays,
  };
}

export type PickFacts = Facts;

/** 칩 아래 숫자 칸의 값 — 계산은 공통 shared/facts 에서(나라 물가 머리도 같이 씀) · 제목만 "나라 도시" */
export function pickFacts(hit: DestinationHit, rates: RateRow[], signals: SignalRow[], levels: PriceLevels | null, windowDays = 90): PickFacts {
  const country = TRAVEL_COUNTRIES[hit.country];
  return factsFor({ country: hit.country, title: `${country?.name ?? ""} ${hit.city}`.trim(), rates, signals, levels, windowDays });
}

/** 나라 물가 페이지 주소 — 그 나라 페이지가 만들어지지 않으면 null */
export const countryLink = (hit: DestinationHit, pageCodes: readonly string[]): string | null => (pageCodes.includes(hit.country) ? countryPath(hit.country) : null);

/** 고른 장을 맨 앞에 — 지금 맨 앞은 맨 뒤 · 이미 맨 앞이면 그대로 · 사이 장 순서는 그대로 · 덱 밖(pick-) 장은 하나만(앞의 것은 버림) */
export function frontWith(order: string[], id: string): string[] {
  const front = order[0];
  if (front === undefined || front === id) return order;
  const middle = order.filter((x) => x !== id && x !== front && !isPickCardId(x));
  return [id, ...middle, ...(isPickCardId(front) ? [] : [front])];
}

/** 탑승권 번호(id) → 그 장의 도시 — 네 도시는 칩과 같은 나라 · 덱 밖 장은 extras 에서 */
export function hitOfCard(id: string, extras: DestinationHit[]): DestinationHit | null {
  const base = PASS_CITIES.find((c) => c.id === id);
  if (base) return POPULAR_DESTINATIONS.find((h) => h.city === base.city) ?? null;
  return extras.find((h) => pickCardId(h) === id) ?? null;
}
