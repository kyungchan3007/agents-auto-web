// 오늘 환율이 없으면 수집 — Worker 예약(cron)에 기대지 않는 길 (작업 0106)
//   2026-10-30 12:00 · 13:30 · 15:00 예약이 모두 돌지 않음 (15:00 전후 실시간 기록에 예약 이벤트 없음 · 직전 배포 없음)
//   누구나 부를 수 있어서: 평일 · 한국 11:30 뒤에만 · 마지막 수집 시작 20분 안이면 안 함 · 오늘 공식 값이 있으면 오늘은 안 함
//   오늘이 끝났으면 지난 14일 중 예비 값으로 남은 날을 하루씩 공식 값으로 덮음 · 다시 빌드 안 함 (다음 빌드에 반영 · 작업 0121)
import { kstDate, kstNow } from "@hav/shared/date";
import { collectDay } from "./collect";
import type { DailyDeps, DailyResult } from "./daily";
import { dailyFx } from "./daily";

export const ENSURE_GAP_MS = 20 * 60_000;

export type EnsureResult = { done: false; why: "weekend" | "too-early" | "recent-run" } | ({ done: true } & DailyResult);

export async function ensureToday(deps: DailyDeps & { lastRunAt: () => Promise<string | null>; fallbackDate?: (today: string) => Promise<string | null> }, now: Date = new Date()): Promise<EnsureResult> {
  const k = kstNow(now);
  const day = k.getUTCDay();
  if (day === 0 || day === 6) return { done: false, why: "weekend" };
  if (k.getUTCHours() * 60 + k.getUTCMinutes() < 11 * 60 + 30) return { done: false, why: "too-early" };
  const last = await deps.lastRunAt();
  if (last && now.getTime() - Date.parse(last) < ENSURE_GAP_MS) return { done: false, why: "recent-run" };
  const today = kstDate(now);
  const r = await dailyFx(today, true, deps);
  if (!r.skipped) return { done: true, ...r };
  const past = await deps.fallbackDate?.(today);
  if (!past) return { done: true, ...r };
  const c = await collectDay(deps.store, past, { koreaeximKey: deps.koreaeximKey, fetcher: deps.fetcher, now: deps.now, fallback: false });
  return { done: true, ...c, skipped: false, rebuild: "not-needed" };
}
