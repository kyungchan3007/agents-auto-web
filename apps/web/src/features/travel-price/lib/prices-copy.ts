// /prices(여행 물가) 큰 문장 (작업 0170 · Figma 04) — 물가가 가장 낮은 나라 + 세계은행 자료 연도 · 줄이 없으면 null (지어내지 않음)
import { BAND_EDGE } from "@hav/shared/travel";
export function pricesHeadline(rows: { name: string; relative: number; year: number }[]): { title: string; note: string } | null {
  if (rows.length === 0) return null;
  const low = rows.reduce((a, b) => (b.relative < a.relative ? b : a));
  const note = `세계은행 ${low.year}년 자료`;
  if (!(low.relative < 1)) return { title: "한국보다 물가가 낮은 나라가 없습니다", note };
  const last = low.name.charCodeAt(low.name.length - 1);
  const josa = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? "은" : "는";
  return { title: `${low.name}${josa} 한국보다 물가가 ${Math.round((1 - low.relative) * 100)}% 낮습니다`, note };
}

const josaOf = (name: string): "은" | "는" => {
  const last = name.charCodeAt(name.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? "은" : "는";
};

/** 고른 나라 기준 큰 문장 (작업 0201) — 그 나라 줄이 없으면 null (쓰는 쪽이 위의 가장 싼 나라 문장을 씀) · 구간 3칸과 같은 기준(BAND_EDGE) */
export function pickedHeadline(country: string | null | undefined, rows: { country: string; name: string; relative: number; year: number }[]): { title: string; note: string } | null {
  if (!country) return null;
  const row = rows.find((r) => r.country === country);
  if (!row) return null;
  const note = `세계은행 ${row.year}년 자료`;
  const who = `${row.name}${josaOf(row.name)}`;
  if (row.relative < BAND_EDGE.cheap) return { title: `${who} 한국보다 물가가 ${Math.round((1 - row.relative) * 100)}% 낮습니다`, note };
  if (row.relative > BAND_EDGE.pricey) return { title: `${who} 한국보다 물가가 ${Math.round((row.relative - 1) * 100)}% 높습니다`, note };
  return { title: `${who} 한국과 물가가 비슷합니다`, note };
}
