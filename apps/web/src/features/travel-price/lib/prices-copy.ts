// /prices(여행 물가) 큰 문장 (작업 0170 · Figma 04) — 물가가 가장 낮은 나라 + 세계은행 자료 연도 · 줄이 없으면 null (지어내지 않음)
export function pricesHeadline(rows: { name: string; relative: number; year: number }[]): { title: string; note: string } | null {
  if (rows.length === 0) return null;
  const low = rows.reduce((a, b) => (b.relative < a.relative ? b : a));
  const note = `세계은행 ${low.year}년 자료`;
  if (!(low.relative < 1)) return { title: "한국보다 물가가 낮은 나라가 없습니다", note };
  const last = low.name.charCodeAt(low.name.length - 1);
  const josa = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? "은" : "는";
  return { title: `${low.name}${josa} 한국보다 물가가 ${Math.round((1 - low.relative) * 100)}% 낮습니다`, note };
}
