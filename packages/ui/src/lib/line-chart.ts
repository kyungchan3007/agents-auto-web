// 2D 선 그래프 계산 — 순수 함수 (작업 0216 · 시안 F 의 chart.js 를 사이트 부품으로 옮김 · 외부 라이브러리 없음)
//   부드러운 곡선(단조 3차) · 끊김 나누기 · 선 위 위치 비율 · 시간표 보조(이징 · 구간 진행값) · 글자 폭 어림 · 숫자 글

export type Pt = [number, number];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** 이징 — 시안 EZ 와 같은 곡선 (입력은 0~1 로 자름 · Infinity 는 1) */
export const ease = {
  out: (t: number) => 1 - (1 - clamp01(t)) ** 3,
  io: (t: number) => {
    const u = clamp01(t);
    return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  },
  /** 살짝 넘쳤다가 돌아옴 — 점 · 말풍선이 "톡" */
  back: (t: number) => {
    const u = clamp01(t);
    const c1 = 1.9;
    const c3 = c1 + 1;
    return u === 0 ? 0 : 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
  },
  lin: clamp01,
};
export type EaseName = keyof typeof ease;

/** 단조 3차 곡선 — 점 사이를 부드럽게 잇되 값이 튀어 넘치지 않음 · 각 조각은 "C…" 글 */
export function monotoneSegments(p: Pt[]): string[] {
  const n = p.length;
  if (n < 2) return [];
  const dx: number[] = [];
  const m: number[] = [];
  const t: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1][0] - p[i][0] || 1e-6;
    m[i] = (p[i + 1][1] - p[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = a * a + b * b;
    if (h > 9) {
      const s = 3 / Math.sqrt(h);
      t[i] = s * a * m[i];
      t[i + 1] = s * b * m[i];
    }
  }
  const f = (v: number) => v.toFixed(1);
  const out: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const [x0, y0] = p[i];
    const [x1, y1] = p[i + 1];
    out.push(`C${f(x0 + h)},${f(y0 + t[i] * h)} ${f(x1 - h)},${f(y1 - t[i + 1] * h)} ${f(x1)},${f(y1)}`);
  }
  return out;
}

/** 점들을 이은 한 줄 글 "M… C…" (점이 하나면 점 하나 · 없으면 빈 글) */
export function monotonePath(p: Pt[]): string {
  if (p.length === 0) return "";
  const head = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  return head + monotoneSegments(p).join("");
}

/** 점 사이 가로 간격이 maxStep 을 넘으면 끊어 여러 구간으로 — 없는 달을 잇지 않음 (FX-02 · 빈 값 만들지 않음) */
export function breakRuns<T extends { x: number }>(points: T[], maxStep: number): T[][] {
  const runs: T[][] = [];
  for (const p of points) {
    const run = runs[runs.length - 1];
    if (run && p.x - run[run.length - 1].x <= maxStep) run.push(p);
    else runs.push([p]);
  }
  return runs;
}

/** ease(c) = f 가 되는 c 를 이분법으로 — "선 머리가 f 만큼 갔을 때의 시간 비율" */
export function invertEase(f: number, e: EaseName): number {
  let a = 0;
  let b = 1;
  for (let k = 0; k < 24; k++) {
    const c = (a + b) / 2;
    if (ease[e](c) < f) a = c;
    else b = c;
  }
  return (a + b) / 2;
}

/** SVG 글자 폭 어림(px) — 서버에서 글자를 재지 못해 글자 종류별 폭 비율로 계산 (한글 1 · 숫자 .6 · 영문 대문자 .66 · 소문자 .55 · 공백 .3 · 나머지 .45) */
export function textWidth(text: string, size: number, bold = false): number {
  let w = 0;
  for (const ch of text) {
    if (/[ᄀ-ᇿ㄰-㆏가-힯　-〿一-鿿]/.test(ch)) w += 1;
    else if (/[0-9]/.test(ch)) w += 0.6;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else if (/[a-z]/.test(ch)) w += 0.55;
    else if (ch === " ") w += 0.3;
    else w += 0.45;
  }
  return w * size * (bold ? 1.04 : 1);
}

/** 숫자 글 — 쉼표 · 소수 자리 고정 */
export function fmtNum(v: number, digits = 0): string {
  return v.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 값 → 세로 위치 — min 은 아래(bottom) · max 는 위(top) · 범위 밖도 같은 직선 · min = max 면 가운데 한 줄 */
export function valueScale(range: { min: number; max: number }, top: number, bottom: number): (v: number) => number {
  const span = range.max - range.min;
  return (v) => (span === 0 ? (top + bottom) / 2 : bottom - ((v - range.min) / span) * (bottom - top));
}

/** 최고 · 최저 점의 순서 — 같은 값이 여럿이면 처음 나온 칸 · 숫자가 아닌 칸은 건너뜀 · 빈 입력은 null */
export function extremeIndices(values: number[]): { max: number; min: number } | null {
  let max = -1;
  let min = -1;
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    if (max < 0 || v > values[max]) max = i;
    if (min < 0 || v < values[min]) min = i;
  });
  return max < 0 ? null : { max, min };
}

/** 끝 말풍선들이 서로 겹치지 않게 세로 가운데 높이를 벌림 — 위에서부터 (높이 합의 반 + gap) 이상 · 아래가 넘치면 통째로 위로 · 위 끝은 4px · 입력 순서대로 돌려줌 */
export function stackBubbles(centers: number[], heights: number[], H: number, gap = 6): number[] {
  const order = centers.map((_, i) => i).sort((a, b) => centers[a] - centers[b]);
  const cy = centers.slice();
  const place = () => {
    order.forEach((i, k) => {
      cy[i] = Math.max(cy[i], 4 + heights[i] / 2);
      if (k > 0) {
        const a = order[k - 1];
        cy[i] = Math.max(cy[i], cy[a] + (heights[a] + heights[i]) / 2 + gap);
      }
    });
  };
  place();
  const last = order[order.length - 1];
  if (last !== undefined) {
    const over = cy[last] + heights[last] / 2 - (H - 4);
    if (over > 0) {
      for (let i = 0; i < cy.length; i++) cy[i] -= over;
      place();
    }
  }
  return cy;
}

export type Span = { at: number; dur: number };
export type ChartSchedule = {
  grid: Span;
  axis: Span;
  series: { line: Span; marks: Span[]; area: Span | null; endDot: Span; endBubble: Span; endCount: Span }[];
  total: number;
};

/** 순서 움직임 시간표 — 눈금(150) → 날짜 글(450) → 선(250 + k·260 · 1500ms · 왼쪽부터) → 최고/최저 점(선 머리가 지날 때) → 면(선 끝 −150 · 아래에서 차오름) → 끝 점(선 끝 −60) → 말풍선(선 끝) → 카운트업(+60 · 1000ms) */
export function chartSchedule(opts: { series: { marks: number[]; area: boolean }[]; durationMs?: number; staggerMs?: number }): ChartSchedule {
  const dur = opts.durationMs ?? 1500;
  const stagger = opts.staggerMs ?? 260;
  const grid = { at: 150, dur: 700 };
  const axis = { at: 450, dur: 700 };
  const series = opts.series.map((s, k) => {
    const at = 250 + k * stagger;
    const end = at + dur;
    return {
      line: { at, dur },
      marks: s.marks.map((m) => ({ at: at + dur * invertEase(Math.min(1, Math.max(0, m)), "io"), dur: 520 })),
      area: s.area ? { at: end - 150, dur: 900 } : null,
      endDot: { at: end - 60, dur: 460 },
      endBubble: { at: end, dur: 420 },
      endCount: { at: end + 60, dur: 1000 },
    };
  });
  const spans: Span[] = [grid, axis];
  for (const s of series) spans.push(s.line, ...s.marks, ...(s.area ? [s.area] : []), s.endDot, s.endBubble, s.endCount);
  return { grid, axis, series, total: Math.max(...spans.map((p) => p.at + p.dur)) };
}

/** 시간(ms) → 0~1 진행(직선) — 시작 전 0 · 끝난 뒤 1 · Infinity(움직임 줄이기 · 서버 첫 그림)는 1 · 길이 0 이면 그 시각에 바로 1 */
export function progressAt(span: Span, ms: number): number {
  if (span.dur === 0) return ms >= span.at ? 1 : 0;
  return clamp01((ms - span.at) / span.dur);
}
