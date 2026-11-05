// GEO 화면 자료 — 응답을 화면이 쓰는 모양으로 (순수 함수) · 받지 못한 값은 만들지 않음
import type { GeoReport } from "@hav/shared/geo";

export const KIND_TEXT: Record<GeoReport["bots"][number]["kind"], string> = {
  training: "학습용 수집",
  search: "AI 검색 색인",
  user: "사용자 요청",
  engine: "일반 검색 엔진",
};

/** 질문별 1회 측정 기록 — docs/geo-measurement.md 와 같은 값 · 새로 측정하면 여기와 문서에 더함 */
export const MEASUREMENTS = [{ date: "2026-11-05", brand: 0, brandTotal: 8, general: 0, generalTotal: 16, note: "수정 전 기준선" }];

const sum = (list: { hits: number }[]) => list.reduce((n, x) => n + x.hits, 0);

export function geoView(r: GeoReport) {
  const engines = r.bots.filter((b) => b.kind === "engine");
  const ai = r.bots.filter((b) => b.kind !== "engine");
  return { ai, engines, aiHits: sum(ai), engineHits: sum(engines), referralHits: sum(r.referrals) };
}
