// 통화 그래프 최고 · 최저 금액 라벨 위치 — 순수 함수 (작업 0175 · 테스트 extreme-labels.test.ts)
//   기본: 최고는 점 위 · 최저는 점 아래 · 가로는 점 가운데 → 영역 밖이면 안쪽으로(왼쪽 끝 start · 오른쪽 끝 end · 위가 모자라면 아래로)
//   겹치면 비킴: 반대쪽 → 가로 붙임(start · end) → 한 글자 높이씩 더 — 두 라벨 · 오늘 점 · 최고 · 최저 점(원)을 가리지 않음
export type Pt = { x: number; y: number };
export type Box = { left: number; top: number; right: number; bottom: number };
export type Placed = { x: number; y: number; anchor: "start" | "middle" | "end"; box: Box };

type Args = {
  max: Pt & { text: string };
  min: Pt & { text: string };
  today: Pt;
  bounds: Box;
  font?: { size: number; charWidth: number };
  dotRadius?: number;
  todayRadius?: number;
  gap?: number;
  /** 가리면 안 되는 칸들 (예: 3D 비행기가 서는 자리) — 라벨이 이 칸과 겹치면 다른 자리로 (작업 0211) */
  avoid?: Box[];
};

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
/** 칸이 원과 겹치는지 — 칸에서 원 중심까지 가장 가까운 거리 < 반지름 */
function hitsCircle(box: Box, c: Pt, r: number): boolean {
  const dx = Math.max(box.left - c.x, 0, c.x - box.right);
  const dy = Math.max(box.top - c.y, 0, c.y - box.bottom);
  return dx * dx + dy * dy < r * r;
}
const inside = (box: Box, b: Box) => box.left >= b.left - 1e-9 && box.right <= b.right + 1e-9 && box.top >= b.top - 1e-9 && box.bottom <= b.bottom + 1e-9;

const MARGIN = 0.5; // 점과 칸 사이 여유 (원 반지름에 더함)

/** 한 라벨의 후보 위치 — 선호 쪽 → 반대쪽 · 같은 높이에서는 가운데 → 왼쪽 붙임 → 오른쪽 붙임 · 한 글자 높이씩 더 멀리 */
function candidates(p: Pt, pref: "above" | "below", w: number, h: number, gap: number, bounds: Box): Placed[] {
  const out: Placed[] = [];
  const steps = Math.ceil((bounds.bottom - bounds.top) / h) + 1;
  const sides: ("above" | "below")[] = pref === "above" ? ["above", "below"] : ["below", "above"];
  for (let k = 0; k < steps; k++) {
    for (const side of sides) {
      const top = side === "above" ? p.y - gap - k * h - h : p.y + gap + k * h;
      for (const mode of ["middle", "start", "end"] as const) {
        const want = mode === "middle" ? p.x - w / 2 : mode === "start" ? p.x : p.x - w;
        const left = Math.min(Math.max(want, bounds.left), bounds.right - w);
        const box: Box = { left, top, right: left + w, bottom: top + h };
        const centered = Math.abs(left - (p.x - w / 2)) < 1e-9;
        const anchor: Placed["anchor"] = centered ? "middle" : left <= bounds.left + 1e-9 && left + w / 2 > p.x ? "start" : left + w >= bounds.right - 1e-9 && left + w / 2 < p.x ? "end" : mode;
        const x = anchor === "start" ? box.left : anchor === "end" ? box.right : (box.left + box.right) / 2;
        out.push({ x, y: box.top, anchor, box });
      }
    }
  }
  return out;
}

export function placeExtremeLabels(a: Args): { max: Placed; min: Placed } {
  const font = a.font ?? { size: 13, charWidth: 7.5 };
  const dotR = (a.dotRadius ?? 4) + MARGIN;
  const todayR = (a.todayRadius ?? 6) + MARGIN;
  const gap = a.gap ?? 8;
  const wMax = a.max.text.length * font.charWidth;
  const wMin = a.min.text.length * font.charWidth;
  const free = (box: Box) => inside(box, a.bounds) && !(a.avoid ?? []).some((v) => overlaps(box, v)) && !hitsCircle(box, a.today, todayR) && !hitsCircle(box, a.max, dotR) && !hitsCircle(box, a.min, dotR);
  const maxCands = candidates(a.max, "above", wMax, font.size, gap, a.bounds).filter((c) => free(c.box));
  const minCands = candidates(a.min, "below", wMin, font.size, gap, a.bounds).filter((c) => free(c.box));
  for (const m of maxCands) {
    const n = minCands.find((c) => !overlaps(m.box, c.box));
    if (n) return { max: m, min: n };
  }
  // 어디에도 자리가 없으면(영역이 너무 작음) 기본 위치 — 호출하는 쪽이 영역을 키워야 함
  return { max: candidates(a.max, "above", wMax, font.size, gap, a.bounds)[0], min: candidates(a.min, "below", wMin, font.size, gap, a.bounds)[0] };
}
