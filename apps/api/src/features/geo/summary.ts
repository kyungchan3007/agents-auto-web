// 방문 집계 행 → 공개 응답 (순수 함수) — 운영 확인 방문(test)은 수치에 넣지 않음
import type { GeoReport } from "@hav/shared/geo";

export type GeoRow = { day: string; kind: "training" | "search" | "user" | "engine" | "referral" | "test"; name: string; path: string; hits: number };

export function geoReport(rows: GeoRow[], since: string, search: GeoReport["search"] = null): GeoReport {
  const real = rows.filter((r) => r.kind !== "test");
  const bots = new Map<string, GeoReport["bots"][number]>();
  const referrals = new Map<string, GeoReport["referrals"][number]>();
  const pages = new Map<string, number>();
  for (const r of real) {
    if (r.kind === "referral") {
      const x = referrals.get(r.name);
      referrals.set(r.name, { name: r.name, hits: (x?.hits ?? 0) + r.hits, lastDay: x && x.lastDay > r.day ? x.lastDay : r.day });
    } else if (r.kind !== "test") {
      const x = bots.get(r.name);
      bots.set(r.name, { name: r.name, kind: r.kind, hits: (x?.hits ?? 0) + r.hits, lastDay: x && x.lastDay > r.day ? x.lastDay : r.day });
      if (r.kind !== "engine") pages.set(r.path, (pages.get(r.path) ?? 0) + r.hits);
    }
  }
  const byHits = <T extends { hits: number }>(a: T, b: T) => b.hits - a.hits;
  const days = real.map((r) => r.day).sort();
  const tests = rows.filter((r) => r.kind === "test").map((r) => r.day).sort();
  return {
    since,
    firstDay: days[0] ?? null,
    bots: [...bots.values()].sort(byHits),
    referrals: [...referrals.values()].sort(byHits),
    pages: [...pages].map(([path, hits]) => ({ path, hits })).sort(byHits),
    verifiedDay: tests.at(-1) ?? null,
    search,
  };
}

export type GscInput = {
  syncedAt: string | null;
  daily: { day: string; clicks: number; impressions: number; position: number }[];
  top: { kind: "query" | "page"; key: string; clicks: number; impressions: number; position: number }[];
};

const TOP_SHOWN = 10;

/** Search Console 저장값 → 공개 요약 · 평균 순위는 노출로 가중 · 가져온 적이 없으면 null */
export function searchSummary(g: GscInput): GeoReport["search"] {
  if (!g.syncedAt) return null;
  const clicks = g.daily.reduce((n, r) => n + r.clicks, 0);
  const impressions = g.daily.reduce((n, r) => n + r.impressions, 0);
  const weighted = g.daily.reduce((n, r) => n + r.position * r.impressions, 0);
  const top = (kind: "query" | "page") =>
    g.top
      .filter((r) => r.kind === kind)
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, TOP_SHOWN)
      .map(({ key, clicks: c, impressions: i, position }) => ({ key, clicks: c, impressions: i, position: Math.round(position * 10) / 10 }));
  return {
    syncedAt: g.syncedAt,
    firstDay: g.daily[0]?.day ?? null,
    lastDay: g.daily.at(-1)?.day ?? null,
    clicks,
    impressions,
    position: impressions > 0 ? Math.round((weighted / impressions) * 10) / 10 : null,
    queries: top("query"),
    pages: top("page"),
  };
}
