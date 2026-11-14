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
