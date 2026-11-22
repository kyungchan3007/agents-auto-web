// 홈 "도착지별 환전 타이밍" 아래 통화 전체 링크 — 순수 함수 (작업 0191)
// 개수 = /currencies 목록에 보이는 통화(빌드 때 받은 환율) 수 − 위 목록에 이미 나온 통화 수 · 자료가 없으면 개수 없이 (지어내지 않음)
export const MORE_CURRENCIES_HREF = "/currencies";

/** 남는 통화 수 · 받은 통화가 없거나 남는 게 없으면 null */
export function moreCurrenciesCount(rates: { currency: string }[], shown: { currency?: string }[]): number | null {
  const all = new Set(rates.map((r) => r.currency));
  const onList = new Set(shown.flatMap((d) => (d.currency && all.has(d.currency) ? [d.currency] : [])));
  const rest = all.size - onList.size;
  return rest > 0 ? rest : null;
}

export const moreCurrenciesText = (count: number | null): string => (count === null ? "통화 모두 보기 ›" : `다른 통화 ${count}개 모두 보기 ›`);
