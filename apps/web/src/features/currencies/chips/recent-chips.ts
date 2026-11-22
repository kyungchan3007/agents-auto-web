// 고른 통화 칩 계산 — 순수 함수 (작업 0231 · 테스트 recent-chips.test.ts)
//   고른 통화는 칩 줄 맨 앞에 붙고 나머지는 한 칸씩 밀림 · 줄에는 5개까지 + "더보기 +N" · 더보기 상자는 한 쪽 5개 · 저장이 없으면 지금 운영 그대로(chipCodes)
import { chipCodes } from "../detail/range/redesign";

/** 브라우저 저장 키 — 즐겨찾기("flapfx:favorites")와 같은 방식 · 새 키 */
export const RECENT_KEY = "flapfx:recent-currencies";
export const CHIP_MAX = 5;
export const BOX_PAGE = 5;
export const RECENT_CAP = 30;

const CODE = /^[A-Z]{3}$/;

/** 저장된 글 → 코드 목록 — 모양이 틀리면 [] · 대문자 세 글자 코드만 · 중복 · 이상한 값은 버림 · RECENT_CAP 까지만 */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const out: string[] = [];
    for (const c of v) if (typeof c === "string" && CODE.test(c) && !out.includes(c)) out.push(c);
    return out.slice(0, RECENT_CAP);
  } catch {
    return [];
  }
}

/** 고른 통화를 맨 앞에 — 이미 있으면 그 자리에서 빼 맨 앞으로 · RECENT_CAP 넘으면 오래된(뒤) 것부터 빠짐 · 코드가 이상하면 그대로 */
export function pushRecent(list: string[], code: string): string[] {
  if (!CODE.test(code)) return list;
  return [code, ...list.filter((c) => c !== code)].slice(0, RECENT_CAP);
}

/** 칩 줄에 놓일 전체 순서 — 저장이 없으면 지금 운영 그대로(chipCodes) · 있으면 저장 순서에서 받은 통화만 */
export function chipRow(stored: string[], current: string, available: string[]): string[] {
  if (stored.length === 0) return chipCodes(current, available);
  return stored.filter((c) => available.includes(c));
}

/** 줄에 보이는 처음 max 개 · 나머지 · 나머지 수 */
export function visibleChips(list: string[], max = CHIP_MAX): { shown: string[]; hidden: string[]; more: number } {
  const shown = list.slice(0, max);
  const hidden = list.slice(max);
  return { shown, hidden, more: hidden.length };
}

export const moreLabel = (n: number): string => `더보기 +${n}`;

/** 상자 한 쪽 — page 는 0부터 · 범위 밖은 자름 */
export function boxPage(list: string[], page: number, size = BOX_PAGE): { items: string[]; page: number; pages: number; label: string } {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(pages - 1, Math.max(0, page));
  return { items: list.slice(p * size, p * size + size), page: p, pages, label: `${p + 1} / ${pages}` };
}
