// /geo 시안 B(작업 0214) 막대 계산 — 순수 함수 · 값은 받은 자료 그대로 · 막대마다 같은 숫자를 글(text)로도 내보냄 (검색 · AI 가 읽는 HTML)
import { numberText } from "@hav/shared/format";
import type { GeoReport } from "@hav/shared/geo";

export type BarRow = { label: string; value: number; pct: number; text: string };

/** 가로 막대 — 가장 큰 값이 100% · 나머지는 비례 · 0 이 아니면 최소 2% (보이게) · 0 은 0% */
export function barRows(rows: { label: string; value: number }[]): BarRow[] {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return rows.map((r) => ({ ...r, pct: max === 0 || r.value === 0 ? 0 : r.value === max ? 100 : Math.max(2, Math.round((r.value / max) * 100)), text: numberText(r.value) }));
}

export type DayColumn = { day: string; total: number; ok: number; cited: number; failed: boolean; heightPct: number; text: string };

/** 날마다 막대 — 같은 날 서비스는 합침 · 날짜 오름차순 · 응답이 하나도 없는 날은 실패(점선 · 전체 높이) · 측정하지 않은 날은 만들지 않음 */
export function dayColumns(history: NonNullable<GeoReport["answers"]>["history"]): DayColumn[] {
  const by = new Map<string, { total: number; ok: number; cited: number }>();
  for (const h of history) {
    const x = by.get(h.day) ?? { total: 0, ok: 0, cited: 0 };
    by.set(h.day, { total: x.total + h.total, ok: x.ok + h.ok, cited: x.cited + h.cited });
  }
  const days = [...by].sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(1, ...days.map(([, v]) => v.ok));
  return days.map(([day, v]) => {
    const failed = v.ok === 0;
    return {
      day,
      ...v,
      failed,
      heightPct: failed ? 100 : Math.max(4, Math.round((v.ok / max) * 100)),
      text: failed ? `${day} 측정 실패 (저장 ${v.total}개 중 응답 0개)` : `${day} 응답 받은 질문 ${v.ok}개 · 인용 ${v.cited}개`,
    };
  });
}

export type BotPagesView = { name: string; kind: NonNullable<GeoReport["botPages"]>[number]["kind"]; hits: number; text: string; rows: BarRow[]; rest: { places: number; hits: number; text: string } | null };

/** 봇별 읽은 페이지 카드 (작업 0226) — 봇마다 많이 읽은 상위 limit 개 경로 막대 + 나머지는 "그 밖 N곳 · M회" · 필드가 없거나 비면 [] · 값은 받은 그대로 */
export function botPagesView(botPages: GeoReport["botPages"], limit = 5): BotPagesView[] {
  return (botPages ?? [])
    .filter((b) => b.paths.length > 0)
    .map((b) => {
      const top = b.paths.slice(0, limit);
      const rest = b.paths.slice(limit);
      const restHits = rest.reduce((n, p) => n + p.hits, 0);
      return {
        name: b.name,
        kind: b.kind,
        hits: b.hits,
        text: `${b.name} · 총 ${numberText(b.hits)}회 · ${b.paths.length}곳`,
        rows: barRows(top.map((p) => ({ label: p.path, value: p.hits }))),
        rest: rest.length > 0 ? { places: rest.length, hits: restHits, text: `그 밖 ${rest.length}곳 · ${numberText(restHits)}회` } : null,
      };
    });
}
