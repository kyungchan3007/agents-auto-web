// 통화 검색 · 자동완성 계산 — 순수 함수 (작업 0192)
// 대상은 빌드 때 받은 통화 코드뿐 · 코드 · 통화 이름 · 나라 · 도시로 찾고 순위는 코드 앞 > 이름 앞 > 나라 앞 > 도시 앞 > 가운데 일치 · 같은 순위는 codes 순서
import { currencyName } from "./currency";
import { TRAVEL_CITIES, TRAVEL_COUNTRIES } from "./travel";

export type CurrencyMatch = { country: string; city?: string };
export type CurrencyHit = { code: string; matches: CurrencyMatch[] };

/** 공백 · 대소문자를 무시하려고 비교용으로 정리 */
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 0 코드 앞글자 · 1 이름 앞글자 · 2 나라 앞글자 · 3 도시 앞글자 · 4 가운데 일치 · 없으면 null */
function rankOf(q: string, fields: { code: string; name: string; countries: string[]; cities: string[] }): number | null {
  const lists: [number, string[]][] = [
    [0, [fields.code]],
    [1, [fields.name]],
    [2, fields.countries],
    [3, fields.cities],
  ];
  let best: number | null = null;
  for (const [rank, values] of lists) {
    for (const v of values) {
      const n = norm(v);
      if (n.startsWith(q)) return rank;
      if (n.includes(q) && best === null) best = 4;
    }
  }
  return best;
}

export function searchCurrencies(query: string, codes: string[], limit: number): CurrencyHit[] {
  const q = norm(query);
  if (!q || limit <= 0) return [];
  const hits: { hit: CurrencyHit; rank: number; order: number }[] = [];
  const seen = new Set<string>();
  codes.forEach((code, order) => {
    if (seen.has(code)) return;
    seen.add(code);
    const places = Object.entries(TRAVEL_COUNTRIES).filter(([, c]) => c.currency === code);
    const countries = places.map(([, c]) => c.name);
    const cities = places.flatMap(([iso, c]) => (TRAVEL_CITIES[iso] ?? []).map((city) => ({ country: c.name, city })));
    const rank = rankOf(q, { code, name: currencyName(code), countries, cities: cities.map((c) => c.city) });
    if (rank === null) return;
    const matches: CurrencyMatch[] = [];
    for (const [, c] of places) if (norm(c.name).includes(q)) matches.push({ country: c.name });
    for (const c of cities) if (norm(c.city).includes(q)) matches.push({ country: c.country, city: c.city });
    hits.push({ hit: { code, matches }, rank, order });
  });
  return hits
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .slice(0, limit)
    .map((h) => h.hit);
}
