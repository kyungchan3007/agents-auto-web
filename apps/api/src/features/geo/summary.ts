// 방문 집계 행 → 공개 응답 (순수 함수) — 운영 확인 방문(test)은 수치에 넣지 않음
import type { GeoReport } from "@hav/shared/geo";

export type GeoRow = { day: string; kind: "training" | "search" | "user" | "engine" | "referral" | "test"; name: string; path: string; hits: number };

export function geoReport(rows: GeoRow[], since: string): GeoReport {
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
  };
}
