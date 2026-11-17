// 통화 검색 제안 줄 · 결과 없음 문구 — 순수 함수 (작업 0192)
import { currencyName } from "@hav/shared/currency";
import type { CurrencyHit } from "@hav/shared/currency-search";

export const SEARCH_LIMIT = 8;
export const SEARCH_EMPTY = "찾는 통화가 없습니다";

/** 맞은 나라 · 도시 — 많으면 앞의 둘만 보이고 "외 N곳" ("일본 도쿄" · "프랑스, 독일 프랑크푸르트 외 2곳") */
export function matchText(matches: CurrencyHit["matches"]): string {
  const shown = matches.slice(0, 2).map((m) => (m.city ? `${m.country} ${m.city}` : m.country));
  const rest = matches.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} 외 ${rest}곳` : shown.join(", ");
}

/** 제안 줄 글 — "JPY 엔화 · 일본 도쿄" (코드나 이름으로만 맞으면 "USD 달러") */
export function hitText(hit: CurrencyHit): string {
  const where = matchText(hit.matches);
  return `${hit.code} ${currencyName(hit.code)}${where ? ` · ${where}` : ""}`;
}

/** 결과 없음 — 고를 수 있는 통화 수를 같이 보여 줌 */
export const emptyText = (count: number): string => `${SEARCH_EMPTY} · 고를 수 있는 통화 ${count}개`;
