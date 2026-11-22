// 판정(싼 편 · 보통 · 비싼 편) 점 색 클래스 — 통화 상세 · 홈 도착지 · 여행 타이밍이 같이 씀 (작업 0312 에 세 곳의 같은 표를 모음)
import type { Signal } from "@hav/shared/signal";

type Tone = Signal;

export const SIGNAL_DOT: Record<Tone, string> = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" };

/** 판정이 없으면 보통 점 */
export const signalDot = (tone: Tone | null | undefined) => (tone ? SIGNAL_DOT[tone] : SIGNAL_DOT.normal);

/** 판정 글 — 최근 N일 중 "낮은 편" · "보통" · "높은 편" (작업 0312 에 홈 탑승권 · 인트로의 같은 표를 모음) */
export const SIGNAL_TEXT: Record<Tone, string> = { cheap: "낮은 편", normal: "보통", expensive: "높은 편" };
