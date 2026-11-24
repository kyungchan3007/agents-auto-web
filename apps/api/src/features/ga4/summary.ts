// GET /ga4 응답 만들기 — D1 에서 읽은 행 → 날짜별 · 유입 경로별(기간 합) · 페이지별(기간 합) (순수 함수 · 작업 0324)
//   합계는 받은 행의 합만 · 같은 키는 날짜를 가로질러 합침
import type { Ga4Report } from "@hav/shared/ga4";
import { parseEngagement } from "./engagement";
import type { Ga4DailyRow, Ga4PageRow, Ga4SourceRow } from "./report";

const TOP = 20;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function sourcesTop(rows: Ga4SourceRow[]): Ga4Report["sources"] {
  const sum = new Map<string, Ga4Report["sources"][number]>();
  for (const r of rows) {
    const key = JSON.stringify([r.source, r.medium, r.campaign]);
    const cur = sum.get(key) ?? { source: r.source, medium: r.medium, campaign: r.campaign, sessions: 0, users: 0 };
    cur.sessions += r.sessions;
    cur.users += r.users;
    sum.set(key, cur);
  }
  return [...sum.values()].sort((a, b) => b.sessions - a.sessions || cmp(a.source, b.source) || cmp(a.medium, b.medium) || cmp(a.campaign, b.campaign)).slice(0, TOP);
}

function pagesTop(rows: Ga4PageRow[]): Ga4Report["pages"] {
  const sum = new Map<string, number>();
  for (const r of rows) sum.set(r.path, (sum.get(r.path) ?? 0) + r.views);
  return [...sum].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views || cmp(a.path, b.path)).slice(0, TOP);
}

/** 저장된 한 장(team_snapshots) → 데이터 · 없거나 깨졌으면 null */
const snapshotOf = (snapshots: { key: string; body: string }[], key: string) => {
  const row = snapshots.find((s) => s.key === key);
  return row ? parseEngagement(row.body) : null;
};

export const ga4Report = (daily: Ga4DailyRow[], sources: Ga4SourceRow[], pages: Ga4PageRow[], snapshots: { key: string; body: string }[] = []): Ga4Report => ({
  daily: daily.map((d) => ({ day: d.day, users: d.users, sessions: d.sessions, pageViews: d.pageViews })).sort((a, b) => cmp(b.day, a.day)),
  sources: sourcesTop(sources),
  pages: pagesTop(pages),
  engagement: snapshotOf(snapshots, "ga4-page-engagement"),
  baseline: snapshotOf(snapshots, "ga4-page-engagement-baseline"),
});
