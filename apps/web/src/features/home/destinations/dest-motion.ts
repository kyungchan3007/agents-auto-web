// 도착지 줄 동그라미 움직임 — 금액 카운트업과 같은 진행 비율(0→1)로 시작 위치에서 제자리까지 (작업 0217)
// 시작 위치 = 최종 위치의 85% (카운트업 시작 값 비율과 같음 · @hav/ui lib/count-up 의 START_RATIO 와 같은 값) · progress 1 이면 정확히 최종 위치

const START_RATIO = 0.85;

/** 막대 위 동그라미 위치 0~1 (0 쌈 ~ 1 비쌈) — final = 지금 위치 계산 값 */
export function dotPosition(final: number, progress: number): number {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  if (p >= 1 || !Number.isFinite(final)) return final;
  const start = final * START_RATIO;
  return start + (final - start) * p;
}

// ── 요약 알약 → 카드 펼치기 시간표 (작업 0228 · 모션 13번) — 시안 m-home.src.js 와 같은 시간 · 순서
//   카드 높이 · 모서리 0.46초 · 알약 글 0.18초에 사라짐 · 줄은 0.14초 뒤부터 0.07초 간격 · 줄마다 나타남 0.3초 · 점 · 금액 0.62초(같은 곡선) · 신호 글은 점이 도착한 뒤 0.26초
export const PILL_MOTION = { hold: 120, grow: 460, pillFade: 180, rowStart: 140, rowStep: 70, rowFade: 300, move: 620, status: 260 } as const;

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const inOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const outCubic = (k: number) => 1 - (1 - k) ** 3;

export type PillFrame = { grow: number; pill: number; row: number; move: number; status: number };

/** 펼치기 시작(t = 0 ms)에서 t ms 지난 때, i 번째 줄의 진행(모두 0~1) */
export function pillFrame(t: number, i: number): PillFrame {
  const s = t - PILL_MOTION.rowStart - i * PILL_MOTION.rowStep;
  return {
    grow: inOut(clamp01(t / PILL_MOTION.grow)),
    pill: 1 - clamp01(t / PILL_MOTION.pillFade),
    row: outCubic(clamp01(s / PILL_MOTION.rowFade)),
    move: inOut(clamp01(s / PILL_MOTION.move)),
    status: outCubic(clamp01((s - PILL_MOTION.move) / PILL_MOTION.status)),
  };
}

/** 펼침이 모두 끝나는 때 (ms) — 줄이 count 개 */
export const pillTotalMs = (count: number) => PILL_MOTION.rowStart + Math.max(0, count - 1) * PILL_MOTION.rowStep + PILL_MOTION.move + PILL_MOTION.status;

/** 시작 값 → 최종 값 (move 0 이면 시작 · 1 이면 정확히 최종) — 소수 자리에 맞춰 반올림 · 시작 값이 없으면 최종 값 그대로 */
export function rateAt(start: number | null, final: number, move: number, digits: number): number {
  if (start === null || move >= 1) return final;
  const k = 10 ** digits;
  return Math.round((start + (final - start) * move) * k) / k;
}
