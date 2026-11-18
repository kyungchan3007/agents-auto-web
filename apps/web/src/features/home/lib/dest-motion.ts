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
