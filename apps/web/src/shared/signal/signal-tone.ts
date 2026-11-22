// 판정(싼 편 · 보통 · 비싼 편) 점 색 클래스 — 통화 상세 · 홈 도착지 · 여행 타이밍이 같이 씀 (작업 0312 에 세 곳의 같은 표를 모음)
import type { Signal } from "@hav/shared/signal";

type Tone = Signal;

export const SIGNAL_DOT: Record<Tone, string> = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" };

/** 판정이 없으면 보통 점 */
export const signalDot = (tone: Tone | null | undefined) => (tone ? SIGNAL_DOT[tone] : SIGNAL_DOT.normal);
