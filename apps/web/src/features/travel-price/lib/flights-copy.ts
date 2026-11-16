// /flights(여행 타이밍) 큰 문장 · 작년 대비 카드 (작업 0170 · Figma 03) — 자료가 없으면 "준비 중" · 카드 숨김 (숫자를 지어내지 않음)
import type { Signal } from "@hav/shared/signal";
import type { IndexPoint } from "./travel-index";

export function flightsHeadline(airCheap: number | null, tourCheap: number | null): string {
  if (airCheap !== null && tourCheap !== null) return `항공료는 ${airCheap}월, 단체여행은 ${tourCheap}월이 싼 편`;
  if (airCheap !== null) return `항공료는 ${airCheap}월이 싼 편`;
  if (tourCheap !== null) return `단체여행은 ${tourCheap}월이 싼 편`;
  return "준비 중";
}

/** 판정 경계 ±1% 는 가정 (lead 판단) · 월 자료는 발표가 늦어 "이번 달" 대신 실제 달 이름을 씀 */
const YOY_EDGE = 1;

export function yoyCard(name: string, points: IndexPoint[] | null | undefined): { label: string; value: string; signal: Signal | null; pinText: string } | null {
  if (!points || points.length === 0) return null;
  const latest = [...points].sort((a, b) => a.period.localeCompare(b.period)).at(-1) as IndexPoint;
  const label = `${name} · ${Number(latest.period.slice(5, 7))}월`;
  const value = latest.value.toFixed(1);
  const prev = points.find((p) => p.period === `${Number(latest.period.slice(0, 4)) - 1}${latest.period.slice(4)}`);
  if (!prev || !(prev.value > 0)) return { label, value, signal: null, pinText: "작년 값 없음" };
  const yoy = (latest.value / prev.value - 1) * 100;
  const signal: Signal = yoy >= YOY_EDGE ? "expensive" : yoy <= -YOY_EDGE ? "cheap" : "normal";
  return { label, value, signal, pinText: `작년보다 ${yoy >= 0 ? "+" : "-"}${Math.abs(yoy).toFixed(1)}%` };
}

/** years = 평균에 쓴 해 수(받은 자료 그대로 — 24개월이면 2년) · 0 이면 "같은 달 평균" 만 (몇 년인지 지어내지 않음) */
export function cheapMonthsCard(airCheap: number | null, tourCheap: number | null, years = 0): { label: string; value: string; note: "같은 달 평균 기준" } | null {
  const months = [airCheap, tourCheap].filter((m): m is number => m !== null).map((m) => `${m}월`);
  if (months.length === 0) return null;
  return { label: years > 0 ? `가장 싼 달 (최근 ${years}년 평균)` : "가장 싼 달 (같은 달 평균)", value: months.join(" · "), note: "같은 달 평균 기준" };
}
