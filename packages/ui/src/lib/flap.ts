// 출발 안내판(스플릿 플랩)의 글자 칸 · 넘어가는 차례 — 순수 함수 (작업 0177 · 테스트 flap.test.ts)
//   한 글자(코드 포인트)가 한 칸 · 모자라면 빈 칸 · 넘치면 앞 cols−1 글자 + "…" · 값이 없으면 "----" (지어내지 않음)
//   넘어가는 차례는 난수 없이 정해진 글자판(알파벳 · 숫자)을 거쳐 최종 글자로 — 칸마다 조금씩 늦게 · 전체 1~2초
export const EMPTY_TEXT = "----";

export function toCells(text: string | null | undefined, cols: number, opts: { align?: "left" | "right" } = {}): string[] {
  if (cols <= 0) return [];
  const trimmed = (text ?? "").trim();
  if (trimmed === "") return cols < EMPTY_TEXT.length ? Array.from({ length: cols }, () => "-") : fit(Array.from(EMPTY_TEXT), cols, opts.align);
  return fit(Array.from(trimmed), cols, opts.align);
}

function fit(chars: string[], cols: number, align: "left" | "right" = "left"): string[] {
  if (chars.length > cols) return cols === 1 ? [chars[0]] : [...chars.slice(0, cols - 1), "…"];
  const pad = Array.from({ length: cols - chars.length }, () => " ");
  return align === "right" ? [...pad, ...chars] : [...chars, ...pad];
}

export type FlipStep = { index: number; delayMs: number; stepMs: number; frames: string[] };

const FLIP_GLYPHS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 칸마다 처음 글자 → 최종 글자 단계 목록 · 칸마다 조금씩 늦게 시작 · 마지막 글자 칸이 끝나는 때가 totalMs(1000 ~ 2000 · 기본 1500) */
export function flipPlan(cells: string[], opts: { totalMs?: number; steps?: number } = {}): FlipStep[] {
  const n = cells.length;
  if (n === 0) return [];
  const total = clamp(opts.totalMs ?? 1500, 1000, 2000);
  const steps = Math.max(1, Math.floor(opts.steps ?? 6));
  // 첫 칸 0 에서 칸마다 stepMs 의 절반씩 늦게 — 마지막 칸: (n−1) × stepMs/2 + steps × stepMs = total
  const stepMs = total / (steps + 0.5 * (n - 1));
  return cells.map((cell, index) => {
    const delayMs = index * stepMs * 0.5;
    if (cell === " ") return { index, delayMs, stepMs, frames: [" "] };
    const cp = cell.codePointAt(0) ?? 0;
    const frames = Array.from({ length: steps }, (_, i) => (i === steps - 1 ? cell : FLIP_GLYPHS[(cp + i * 7 + index) % FLIP_GLYPHS.length]));
    return { index, delayMs, stepMs, frames };
  });
}

/** 전체 걸리는 시간 — 칸마다 (시작 늦춤 + 단계 수 × 단계 시간) 의 가장 큰 값 */
export function flipDurationMs(plan: FlipStep[]): number {
  return plan.reduce((m, p) => Math.max(m, p.delayMs + p.frames.length * p.stepMs), 0);
}
