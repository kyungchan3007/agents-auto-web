// 즐겨찾는 통화 — 이 브라우저에만 저장 (localStorage · 보내지 않음) · 목록 맨 위에 (작업 0089)
//   저장소를 못 쓰는 브라우저(사생활 보호 모드 등)에서는 그냥 빈 목록 — 화면은 그대로 동작 · 저장소 접근은 use-favorites.ts

export const FAVORITES_KEY = "tripfx:favorites";
const MAX = 20;

/** 저장된 글 → 통화 코드 목록 (모양이 틀리면 빈 목록 · 중복 · 이상한 값은 버림) */
export function parseFavorites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return [...new Set(v.filter((c): c is string => typeof c === "string" && /^[A-Z]{3}$/.test(c)))].slice(0, MAX);
  } catch {
    return [];
  }
}

/** 있으면 빼고 없으면 끝에 더함 (최대 20개) */
export function toggleFavorite(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code].slice(-MAX);
}

/** 즐겨찾기를 고른 순서대로 앞에 · 나머지는 원래 순서 */
export function favoritesFirst<T extends { currency: string }>(items: T[], favs: string[]): T[] {
  const rank = new Map(favs.map((c, i) => [c, i]));
  const picked = items.filter((i) => rank.has(i.currency)).sort((a, b) => (rank.get(a.currency) ?? 0) - (rank.get(b.currency) ?? 0));
  return [...picked, ...items.filter((i) => !rank.has(i.currency))];
}
