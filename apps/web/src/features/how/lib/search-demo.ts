// 만드는 방식의 검색 예시 (작업 0306) — 사이트의 실제 검색 함수(@hav/shared/currency-search)와 통화 목록으로 · 어느 순위로 맞았는지 글을 더함 · 순수 함수
import { CURRENCIES, currencyName } from "@hav/shared/currency";
import { type CurrencyHit, searchCurrencies } from "@hav/shared/currency-search";

export const DEMO_CODES = Object.keys(CURRENCIES);
export const RANK_TEXT = ["코드 앞글자", "이름 앞글자", "나라 앞글자", "도시 앞글자", "가운데 일치"] as const;

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 맞은 순위 글 — 검색 함수의 순위 규칙(코드 > 이름 > 나라 > 도시 > 가운데)과 같은 순서로 다시 봄 */
export function rankText(query: string, hit: CurrencyHit): string {
  const q = norm(query);
  if (norm(hit.code).startsWith(q)) return RANK_TEXT[0];
  if (norm(currencyName(hit.code)).startsWith(q)) return RANK_TEXT[1];
  if (hit.matches.some((m) => !m.city && norm(m.country).startsWith(q))) return RANK_TEXT[2];
  if (hit.matches.some((m) => m.city && norm(m.city).startsWith(q))) return RANK_TEXT[3];
  return RANK_TEXT[4];
}

/** 맞은 나라 · 도시 — 앞의 둘 + "외 N곳" */
export function whereText(hit: CurrencyHit): string {
  const shown = hit.matches.slice(0, 2).map((m) => (m.city ? `${m.country} ${m.city}` : m.country));
  const rest = hit.matches.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} 외 ${rest}곳` : shown.join(", ");
}

export type DemoHit = { code: string; name: string; where: string; rank: string };

export function demoSearch(query: string, codes: string[] = DEMO_CODES, limit = 8): DemoHit[] {
  return searchCurrencies(query, codes, limit).map((h) => ({ code: h.code, name: currencyName(h.code), where: whereText(h), rank: rankText(query, h) }));
}
