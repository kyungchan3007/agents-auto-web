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

const CLASS: Record<Signal, string> = {
  cheap: "bg-pin-cheap text-foam",
  normal: "border-2 border-pin-line bg-foam text-pin-ink",
  expensive: "bg-pin-expensive text-foam",
};

/** 신호별 글자 색 (핀이 아닌 글 속 숫자 · 표시용) */
export const SIGNAL_TEXT: Record<Signal, string> = { cheap: "text-cheap", normal: "text-normal", expensive: "text-expensive" };

/** text: 핀 글을 직접 정할 때 (예 "작년보다 +6.1%") · percentile: 90일 백분위(0~1)면 "하위 12% · 쌈" 근거 숫자 글 · 둘 다 없으면 pct(퍼센트 변화) 또는 "쌈 · 보통 · 비쌈" 글자 — 우선순위 text → percentile → pct (작업 0170 · props 추가만) */
export function SignalPin({ signal, pct, percentile, text, className = "" }: { signal: Signal; pct?: number | null; percentile?: number | null; text?: string; className?: string }) {
  return <span className={`inline-flex items-center rounded-pill px-3 py-1 text-small font-semibold whitespace-nowrap tabular-nums ${CLASS[signal]} ${className}`}>{text ?? (percentile !== undefined ? pinBasis(signal, percentile) : pinLabel(signal, pct))}</span>;
}
