// 여행지 검색 · 자주 가는 곳 — 순수 함수 (작업 0201) · 홈 "내 여행지 고르기" 시트와 여행 물가 시트가 같이 씀
// 나라 · 도시 자료는 @hav/shared/travel (인트로 1단계와 같은 자료 · 같은 저장 값 PickedTrip) — 인트로 폴더를 가져오지 않음 (0185 규칙)
import { TRAVEL_CITIES, TRAVEL_COUNTRIES } from "@hav/shared/travel";

export type DestinationHit = { country: string; city: string; label: string };

const hit = (country: string, city: string): DestinationHit => ({ country, city, label: `${TRAVEL_COUNTRIES[country].name} ${city}` });

/** 저장할 수 있는(TRAVEL_COUNTRIES 에 있는) 나라의 모든 (나라, 도시) — 표 순서 */
const ALL: DestinationHit[] = Object.entries(TRAVEL_CITIES).flatMap(([country, cities]) => (Object.hasOwn(TRAVEL_COUNTRIES, country) ? cities.map((city) => hit(country, city)) : []));

export const DEFAULT_LIMIT = 8;

/** 도시 · 나라 이름으로 찾음 — 앞부분 일치(0) → 포함(1) · 도시 이름이 나라 이름보다 먼저 · 같은 순위는 표 순서 (나라 이름이 맞으면 그 나라 도시 모두 · 대표 도시 먼저) */
export function searchDestinations(query: string, limit = DEFAULT_LIMIT): DestinationHit[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [];
  const ranked: { h: DestinationHit; rank: number; order: number }[] = [];
  ALL.forEach((h, order) => {
    const city = h.city.toLowerCase();
    const country = TRAVEL_COUNTRIES[h.country].name.toLowerCase();
    const rank = city.startsWith(q) ? 0 : country.startsWith(q) ? 1 : city.includes(q) ? 2 : country.includes(q) ? 3 : -1;
    if (rank >= 0) ranked.push({ h, rank, order });
  });
  return ranked
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .slice(0, Math.max(0, limit))
    .map((r) => r.h);
}

/** 자주 가는 곳 칩 */
export const POPULAR_DESTINATIONS: DestinationHit[] = [
  ["JPN", "도쿄"],
  ["JPN", "오사카"],
  ["THA", "방콕"],
  ["VNM", "다낭"],
  ["SGP", "싱가포르"],
  ["FRA", "파리"],
  ["USA", "뉴욕"],
  ["GBR", "런던"],
].map(([country, city]) => hit(country, city));
