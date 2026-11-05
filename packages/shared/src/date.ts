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

const KST_MS = 9 * 3600_000;

/** 한국 시각으로 옮긴 Date — getUTC* 로 한국 날짜 · 시각을 읽음 */
export function kstNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + KST_MS);
}

/** 한국 날짜 (YYYY-MM-DD · KST = UTC+9) */
export function kstDate(now: Date = new Date()): string {
  return kstNow(now).toISOString().slice(0, 10);
}
