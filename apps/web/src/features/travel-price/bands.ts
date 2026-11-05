// 묶음별 나라 목록 계산 — 지역 단추 · 막대 길이 · 거르기 (순수 함수)
import { REGIONS, type Region } from "@hav/shared/currency";
import type { Band, TravelRow } from "@hav/shared/travel";

export type PriceBand = { id: Band; label: string; rows: TravelRow[] };

export function bandsView(bands: PriceBand[], region: Region | "all") {
  const all = bands.flatMap((b) => b.rows);
  // 막대 길이 = 한국 대비 · 가장 비싼 나라가 끝 · 한국(1)은 가운데 근처 선
  const max = Math.max(2, ...all.map((r) => r.relative));
  return {
    regions: REGIONS.filter((r) => all.some((c) => c.region === r.id)),
    koreaAt: (1 / max) * 100,
    barWidth: (relative: number) => Math.min(100, (relative / max) * 100),
    shown: bands.map((b) => ({ ...b, rows: b.rows.filter((r) => region === "all" || r.region === region) })).filter((b) => b.rows.length > 0),
  };
}
