// 카운트업 값 계산 — 순수 함수 (작업 0216) · 부품 CountUp · 훅 useCountUp 이 씀
// 0 이 아니라 최종 값 근처(85%)에서 시작해 약 1초 동안 최종 값으로 · 끝에서 느려짐 · 소수 자리 · 쉼표는 최종 값 그대로

/** 움직이는 시간 (ms) */
export const COUNT_UP_MS = 1000;

const START_RATIO = 0.85;

const clamp01 = (t: number) => (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0);
const roundTo = (v: number, digits: number) => {
  const k = 10 ** digits;
  return Math.round(v * k) / k;
};

/** 시작 값 — 최종 값의 85% (소수 자리에 맞춰 반올림) · 0 이면 0 */
export function countUpStart(final: number, digits = 0): number {
  if (!Number.isFinite(final) || final === 0) return 0;
  return roundTo(final * START_RATIO, digits);
}

/** 끝에서 느려지는 곡선 (ease-out cubic) · 범위 밖은 자름 */
export function easeOut(t: number): number {
  const p = clamp01(t);
  return 1 - (1 - p) ** 3;
}

/** 진행 비율(0~1) → 값 · 0 이면 시작 값 · 1 이면 정확히 최종 값 */
export function countUpValue(final: number, progress: number, digits = 0): number {
  const p = clamp01(progress);
  if (p >= 1 || !Number.isFinite(final)) return final;
  const start = countUpStart(final, digits);
  return roundTo(start + (final - start) * easeOut(p), digits);
}

/** 쉼표 · 소수 자리 고정 — 1338.8 · 1 → "1,338.8" */
export function formatCount(value: number, digits = 0): string {
  return value.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
