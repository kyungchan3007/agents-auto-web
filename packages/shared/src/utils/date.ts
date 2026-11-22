// 날짜 — API 와 화면이 같은 규칙으로 검사
import { z } from "zod";

/** YYYY-MM-DD 이면서 달력에 있는 날만 */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const IsoDate = z.string().refine(isIsoDate, "YYYY-MM-DD 날짜가 아님");
export const IsoDateTime = z.iso.datetime();

/** from 에서 days 일 전 날짜 (YYYY-MM-DD · UTC) */
export function isoDaysBefore(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() - days * 86400_000).toISOString().slice(0, 10);
}

/** 그 날이 속한 주의 일요일 (YYYY-MM-DD) — 관세청 과세환율 적용 기간은 일요일 ~ 토요일 (작업 0163) */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() - d.getUTCDay() * 86400_000).toISOString().slice(0, 10);
}

export { kstDate, kstMonthDay, kstNow } from "./kst";

/** "2025-05" → 달 번호(연 × 12 + 월 − 1) — 달끼리 빼거나 비교할 때 (작업 0312 에 여행 타이밍 · 직구 · 여행 계산의 같은 함수를 모음) */
export const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

/** 달 번호 → "2025-05" */
export const periodOfIndex = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;

/** "2025-05" → "25.05" (휴대폰 눈금) */
export const shortPeriod = (p: string) => `${p.slice(2, 4)}.${p.slice(5, 7)}`;
