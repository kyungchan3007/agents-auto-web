// 판정 핀 — 둥근 알약 · 쌈(울트라마린 바탕 · 흰 글) · 보통(흰 바탕 · 보조색 2px 테두리 · 남색 글) · 비쌈(주홍 바탕 · 흰 글) (작업 0168 · Figma)
// 색만으로 전하지 않고 항상 글자를 같이 · 퍼센트를 못 받았으면 글자만 (숫자를 지어내지 않음) · 핀이 자기 바탕 · 글 색을 가져 어느 배경 위에서도 같음 (tokens.css --hav-pin-*)
// 예전 signal-badge(싼 편 · 비싼 편)를 대신함

export type Signal = "cheap" | "normal" | "expensive";

const LABEL: Record<Signal, string> = { cheap: "쌈", normal: "보통", expensive: "비쌈" };

export function signalLabel(signal: Signal): string {
  return LABEL[signal];
}

/** "-4.1% 쌈" · "+0.4% 보통" · "+2.3% 비쌈" — pct 가 없거나 유한하지 않으면 글자만 */
export function pinLabel(signal: Signal, pct?: number | null): string {
  if (typeof pct !== "number" || !Number.isFinite(pct)) return signalLabel(signal);
  return `${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(1)}% ${signalLabel(signal)}`;
}

/** 모양 — 쌈 · 비쌈은 채운 알약 · 보통은 흰 바탕 + 테두리 */
export const PIN_STYLE: Record<Signal, { filled: boolean; outlined: boolean }> = {
  cheap: { filled: true, outlined: false },
  normal: { filled: false, outlined: true },
  expensive: { filled: true, outlined: false },
};

/** Figma: 글 SemiBold 13/20 · 안쪽 여백 12/4 · 둥근 알약 */
export const PIN_SIZE = { fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 } as const;

const CLASS: Record<Signal, string> = {
  cheap: "bg-pin-cheap text-foam",
  normal: "border-2 border-pin-line bg-foam text-pin-ink",
  expensive: "bg-pin-expensive text-foam",
};

/** 신호별 글자 색 (핀이 아닌 글 속 숫자 · 표시용) */
export const SIGNAL_TEXT: Record<Signal, string> = { cheap: "text-cheap", normal: "text-normal", expensive: "text-expensive" };

export function SignalPin({ signal, pct, className = "" }: { signal: Signal; pct?: number | null; className?: string }) {
  return <span className={`inline-flex items-center rounded-pill px-3 py-1 text-small font-semibold whitespace-nowrap tabular-nums ${CLASS[signal]} ${className}`}>{pinLabel(signal, pct)}</span>;
}
