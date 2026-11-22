// 판정 핀 — 둥근 알약 · 쌈(울트라마린 바탕 · 흰 글) · 보통(흰 바탕 · 보조색 2px 테두리 · 남색 글) · 비쌈(주홍 바탕 · 흰 글) (작업 0168 · Figma)
// 색만으로 전하지 않고 항상 글자를 같이 · 글 · 모양 상수는 signal-pin-text.ts (그리기만 · 작업 0312) · 핀이 자기 바탕 · 글 색을 가져 어느 배경 위에서도 같음 (tokens.css --hav-pin-*)
import { type Signal, pinText } from "./signal-pin-text";

export type { Signal };

const CLASS: Record<Signal, string> = {
  cheap: "bg-pin-cheap text-foam",
  normal: "border-2 border-pin-line bg-foam text-pin-ink",
  expensive: "bg-pin-expensive text-foam",
};

/** text: 핀 글을 직접 정할 때 (예 "작년보다 +6.1%") · percentile: 90일 백분위(0~1)면 "하위 12% · 쌈" 근거 숫자 글 · 둘 다 없으면 pct(퍼센트 변화) 또는 "쌈 · 보통 · 비쌈" 글자 — 우선순위 text → percentile → pct (작업 0170 · props 추가만) */
export function SignalPin({ signal, pct, percentile, text, className = "" }: { signal: Signal; pct?: number | null; percentile?: number | null; text?: string; className?: string }) {
  return <span className={`inline-flex items-center rounded-pill px-3 py-1 text-small font-semibold whitespace-nowrap tabular-nums ${CLASS[signal]} ${className}`}>{pinText(signal, { pct, percentile, text })}</span>;
}
