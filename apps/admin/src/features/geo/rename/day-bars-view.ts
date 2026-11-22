// 날짜별 작은 막대 좌표 (작업 0205 · 0303 · 0312 에 rename-compare.tsx 에서 옮김) · 순수 함수 · viewBox 0 0 100 30
import type { DayHits } from "./rename-model";

export function dayBarsView(name: string, daily: DayHits[], dayMark: string) {
  const n = daily.length;
  if (n === 0) return null;
  const max = Math.max(1, ...daily.map((d) => d.hits));
  const w = 100 / n;
  const at = daily.findIndex((d) => d.day === dayMark);
  return {
    label: `${name} 날짜별 방문: ${daily.map((d) => `${d.day.slice(5)} ${d.hits}회`).join(", ")}${at >= 0 ? ` (${dayMark} 이름 바꾼 날)` : ""}`,
    bars: daily.map((d, i) => ({ key: d.day, x: i * w + w * 0.15, width: w * 0.7, y: 29 - (d.hits / max) * 27, height: (d.hits / max) * 27, after: d.day >= dayMark })),
    /** 이름 바꾼 날 세로 점선 x — 기간 안에 없으면 null */
    markX: at >= 0 ? at * w : null,
  };
}
