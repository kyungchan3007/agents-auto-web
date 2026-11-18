// 묶음별 나라 목록 계산 — 지역 단추 · 막대 길이 · 거르기 (순수 함수)
import { REGIONS, type Region } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";
import type { Band, TravelRow } from "@hav/shared/travel";
import { pinBasis } from "@hav/ui/data/signal-pin";

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

/** 나라 줄 판정 알약 글 — 나라 물가(구간 제목)가 아니라 그 나라 통화 환율 신호라는 것을 "환율" 로 구분 (작업 0212) */
export const rateBadgeText = (signal: Signal, percentile: number | null | undefined): string => `환율 ${pinBasis(signal, percentile)}`;
