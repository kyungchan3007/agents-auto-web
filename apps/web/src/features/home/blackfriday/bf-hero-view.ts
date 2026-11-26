// 블프 hero 왼쪽 글 · 막대 값 (작업 0381) — 그리기는 bf-hero.tsx · 계산은 여기
import { type BfResult, rateLine } from "./bf-calc";
import { BF_COPY } from "./bf-copy";

/** 제목 첫 줄에서 노랑으로 칠하는 "$200" 뒤의 글 */
export const TITLE_REST = BF_COPY.titleLines[0].slice(BF_COPY.accent.length);

export type HeroDraw = { barPct: number; barOver: boolean; source: string };

/** 한도 막대 너비(%) · 한도 밖 여부 · 환율 기준 줄(결과가 있을 때만) */
export function heroDraw(r: BfResult, perUsd: number | null): HeroDraw {
  if (r.kind !== "ok") return { barPct: 0, barOver: false, source: "" };
  return { barPct: Math.min(100, r.ratio * 100), barOver: r.over, source: rateLine(perUsd, r.sourceLabel) };
}
