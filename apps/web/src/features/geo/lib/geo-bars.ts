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
