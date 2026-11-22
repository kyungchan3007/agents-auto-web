// 여행 물가 글 · 값 (작업 0312 에 price-bands · price-route · price-route-list 의 같은 계산을 모음) · 순수 함수
import type { Signal } from "@hav/shared/signal";

/** 물가 지수(한국 = 100) — 비율 × 100 반올림 */
export const relativePct = (relative: number) => Math.round(relative * 100);

/** 최신 해가 아닌 자료면 " · 2023년 자료" */
export const yearNote = (year: number | null | undefined, latestYear: number | undefined) => (year != null && year !== latestYear ? ` · ${year}년 자료` : "");

/** 한국과의 차이 % — 크기만 */
export const gapPct = (v: number) => Math.abs(100 - v);

/** "저렴합니다" · "비쌉니다" */
export const cheaperText = (v: number) => (v < 100 ? "저렴합니다" : "비쌉니다");

/** 하루 예산 예시 — 한국 하루 100,000원 기준 (천 원 단위로 반올림한 값을 받으면 그대로) */
export const budgetWon = (v: number) => v * 1000;
export const wonText = (won: number) => won.toLocaleString("ko-KR");

/** 물가 숫자 칸 — 한 글자 한 칸 */
export const digitCells = (v: number) => String(v).split("");

/** 판정 칩 색 — 보통은 흰 칸 · 비싼 편 빨강 · 싼 편 파랑 */
export const signalChipTone = (s: Signal) => (s === "normal" ? "bg-card text-fg ring-[1.5px] ring-fg ring-inset" : s === "expensive" ? "bg-pin-expensive text-on-accent" : "bg-pin-cheap text-on-accent");

/** 막대 너비 % (최대에서 자름) */
export const barPct = (value: number, max: number) => `${Math.min(100, (value / max) * 100).toFixed(1)}%`;

/** 카드의 해 글 — "2023년 자료" (최신 해면 빈 글) */
export const yearOnly = (year: number | null | undefined, latestYear: number | undefined) => (year != null && year !== latestYear ? `${year}년 자료` : "");
