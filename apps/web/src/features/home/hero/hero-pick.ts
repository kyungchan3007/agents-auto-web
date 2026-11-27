// 기본 hero 에서 고른 곳의 값 (작업 0393) — 순수 함수 · React 없음 · 값은 홈이 이미 받는 환율 · 신호 · 물가 수준에서만 · 받지 못한 값은 null (화면은 "-" · 지어내지 않음)
//   탑승권 한 장(passFor) · 칩 아래 숫자 칸(pickFacts) · 고른 장을 앞에 세운 덱 순서(frontWith)
import { type DestinationHit, POPULAR_DESTINATIONS } from "@hav/shared/destination-search";
import { currencyName } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import type { PriceLevels } from "@hav/shared/prices";
import { TRAVEL_COUNTRIES, countryPath } from "@hav/shared/travel";
import type { RateRow, SignalRow } from "../common/destinations";
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

const currencyOf = (hit: DestinationHit): string | null => TRAVEL_COUNTRIES[hit.country]?.currency ?? null;
/** 1 외화당 원 */
const perOf = (currency: string | null, rates: RateRow[]): number | null => {
  const r = currency ? rates.find((x) => x.currency === currency) : undefined;
  return r && r.unit > 0 ? r.baseRate / r.unit : null;
};
/** 값 크기에 맞춘 자릿수(1,475 · 41.2 · 9.41 · 0.056) */
const digitsFor = (n: number): number => (n >= 100 ? 0 : n >= 10 ? 1 : n >= 1 ? 2 : 3);
const fixed = (n: number): string => numberText(n, { minimumFractionDigits: digitsFor(n), maximumFractionDigits: digitsFor(n) });
const unitName = (currency: string): string => currencyName(currency).replace(/화$/, "");
/** 최근 며칠 중 오늘보다 환율이 높았던 날의 비율(%) */
const belowOf = (sig: SignalRow | undefined): number | null => (sig && sig.percentile !== null ? Math.round((1 - sig.percentile) * 100) : null);

/** 고른 도시의 탑승권 한 장 — 네 도시는 지금 값 그대로 · 밖은 같은 모양에 id "pick-나라-도시" · 환율 · 신호가 없으면 빈 글 */
export function passFor(hit: DestinationHit, rates: RateRow[], signals: SignalRow[], windowDays: number, month: string): PassCard {
  const base = baseOf(hit.city);
  const currency = base?.currency ?? currencyOf(hit);
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

export type PickFacts = {
  /** "일본 도쿄" */
  title: string;
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

/** 칩 아래 숫자 칸의 값 — 90일 최저 · 최고는 목록 응답에 없어 그리지 않음(중간값만) */
export function pickFacts(hit: DestinationHit, rates: RateRow[], signals: SignalRow[], levels: PriceLevels | null, windowDays = 90): PickFacts {
  const country = TRAVEL_COUNTRIES[hit.country];
  const currency = currencyOf(hit);
  const per = perOf(currency, rates);
  const sig = signals.find((s) => s.currency === currency);
  const below = belowOf(sig);
  const lv = (levels?.rows ?? []).filter((l) => l.country === hit.country).sort((a, b) => b.year - a.year)[0];
  const gap = lv ? Math.round(Math.abs(lv.relative - 1) * 100) : null;
  const band = below === null ? null : below >= 66 ? "낮은 편" : below >= 33 ? "보통" : "높은 편";
  const median = sig?.median;
  return {
    title: `${country?.name ?? ""} ${hit.city}`.trim(),
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
