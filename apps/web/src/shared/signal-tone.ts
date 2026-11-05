// 신호별 글자 색 — 화면 여러 곳이 같이 씀
import type { Signal } from "@hav/shared/signal";

export const SIGNAL_TONE: Record<Signal, string> = { cheap: "text-cheap", normal: "text-normal", expensive: "text-expensive" };
