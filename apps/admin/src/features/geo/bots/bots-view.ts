// 봇 방문 판 · 봇별 읽은 페이지 카드에 보일 값 (작업 0226 · 0303 · 0312 에 geo-detail.tsx · bot-pages.tsx 에서 옮김) · 순수 함수
import type { GeoReport } from "@hav/shared/geo";
import { type BarRow, type BotPagesView, barRows } from "../common/geo-bars";
import { KIND_TEXT, geoDetail } from "../common/geo-view";

export type BotKind = "all" | "ai" | "eng";

const byHits = <T extends { hits: number }>(list: T[]) => [...list].sort((a, b) => b.hits - a.hits);

/** AI 봇 · 검색 엔진 두 묶음 막대 — 두 묶음을 같은 잣대로(가장 많은 봇 = 끝) · 아래 한 줄(종류 · 최근 방문 · 기간) */
export function botBarGroups(report: GeoReport): { ai: BarRow[]; engines: BarRow[]; foot: string } {
  const ai = byHits(report.bots.filter((b) => b.kind !== "engine"));
  const engines = byHits(report.bots.filter((b) => b.kind === "engine"));
  const max = Math.max(0, ...report.bots.map((b) => b.hits));
  const rows = (list: typeof ai) => barRows([...list.map((b) => ({ label: b.name, value: b.hits })), { label: "\u0000", value: max }]).slice(0, -1);
  const kinds = ai.map((b) => `${b.name} ${KIND_TEXT[b.kind]}`).join(" · ");
  const last = ai.length > 0 ? ` (최근 방문 ${ai.map((b) => b.lastDay).sort().at(-1)})` : "";
  return { ai: rows(ai), engines: rows(engines), foot: `${kinds}${last} · ${geoDetail(report).period}` };
}

/** 묶음으로 거르기 — 전체 · AI 봇(검색 엔진 아닌 것) · 검색 엔진 */
export const filterBotKind = (bots: BotPagesView[], kind: BotKind) => bots.filter((b) => (kind === "all" ? true : kind === "eng" ? b.kind === "engine" : b.kind !== "engine"));

/** 카드 머리 작은 글 — 봇 이름을 뺀 "총 N회 · M곳" (화면 읽기용 전체 글은 b.text) */
export const botShortText = (b: Pick<BotPagesView, "name" | "text">) => b.text.replace(`${b.name} · `, "");
