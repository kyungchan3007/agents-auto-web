// 판정 핀 글 · 모양 (작업 0168 · 0170 · 0312 에 signal-pin.tsx 에서 나눔 — 핀 부품은 그리기만) · 순수 함수 · 퍼센트를 못 받았으면 글자만(숫자를 지어내지 않음)
import type { Signal } from "@hav/shared/signal";

export type { Signal };

const LABEL: Record<Signal, string> = { cheap: "낮음", normal: "보통", expensive: "높음" };

export function signalLabel(signal: Signal): string {
  return LABEL[signal];
}

/** "-4.1% 쌈" · "+0.4% 보통" · "+2.3% 비쌈" — pct 가 없거나 유한하지 않으면 글자만 */
export function pinLabel(signal: Signal, pct?: number | null): string {
  if (typeof pct !== "number" || !Number.isFinite(pct)) return signalLabel(signal);
  return `${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(1)}% ${signalLabel(signal)}`;
}

/**
 * 판정 기준(최근 90일 백분위 · SIG-05)의 근거 숫자 + 판정 — "하위 12% · 쌈" · "상위 10% · 비쌈" (작업 0170 · 홈 도착지 줄이 씀)
 * percentile ≤ 0.5 면 하위 N% · 넘으면 상위 N% (정수로 반올림) · 판정 글자는 넘겨 준 signal 그대로 (백분위로 다시 정하지 않음)
 * 백분위가 없거나 유한하지 않거나 0~1 밖이면 판정 글자만 (숫자를 지어내지 않음) · pinLabel(퍼센트 변화)은 작년 대비 같은 곳이 그대로 씀
 */
export function pinBasis(signal: Signal, percentile?: number | null): string {
  if (typeof percentile !== "number" || !Number.isFinite(percentile) || percentile < 0 || percentile > 1) return signalLabel(signal);
  const where = percentile <= 0.5 ? `하위 ${Math.round(percentile * 100)}%` : `상위 ${Math.round((1 - percentile) * 100)}%`;
  return `${where} · ${signalLabel(signal)}`;
}

/** 모양 — 쌈 · 비쌈은 채운 알약 · 보통은 흰 바탕 + 테두리 */
export const PIN_STYLE: Record<Signal, { filled: boolean; outlined: boolean }> = {
  cheap: { filled: true, outlined: false },
  normal: { filled: false, outlined: true },
  expensive: { filled: true, outlined: false },
};

/** Figma: 글 SemiBold 13/20 · 안쪽 여백 12/4 · 둥근 알약 */
export const PIN_SIZE = { fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 } as const;

/** 신호별 글자 색 (핀이 아닌 글 속 숫자 · 표시용) */
export const SIGNAL_TEXT: Record<Signal, string> = { cheap: "text-cheap", normal: "text-normal", expensive: "text-expensive" };

/** 핀 글 — 우선순위 text → percentile → pct */
export const pinText = (signal: Signal, { pct, percentile, text }: { pct?: number | null; percentile?: number | null; text?: string }) => text ?? (percentile !== undefined ? pinBasis(signal, percentile) : pinLabel(signal, pct));
