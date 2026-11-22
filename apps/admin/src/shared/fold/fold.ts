// 묶음 목록 계산 (작업 0312) · 순수 함수

/** 고른 묶음의 항목 — 원래 번호 i 를 함께 ("all" 이면 전부) */
export const shownItems = <T, C extends string>(items: readonly T[], catOf: (x: T) => C, cat: C | "all") =>
  items.map((x, i) => ({ x, i })).filter(({ x }) => cat === "all" || catOf(x) === cat);

/** 묶음마다 개수 */
export const countIn = <T, C extends string>(items: readonly T[], catOf: (x: T) => C, cat: C) => items.filter((x) => catOf(x) === cat).length;

/** 모두 펼치기 단추 글 */
export const foldAllText = (allOpen: boolean) => (allOpen ? "모두 접기" : "모두 펼치기");
